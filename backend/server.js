const path = require('path');

const bcrypt = require('bcryptjs');
const cors = require('cors');
const crypto = require('crypto');
const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const https = require('https');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const { connectDb, User, Contact, Document } = require('./db');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors());

function getPublicBaseUrl(req) {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function getLlmApiBaseUrl() {
  const configured = process.env.LLM_API_BASE_URL;
  return (configured || 'http://localhost:8000').replace(/\/$/, '');
}

function getLlmApiTimeoutMs() {
  const configured = process.env.LLM_API_TIMEOUT_MS;
  const parsed = configured ? Number(configured) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 120000;
}

function requestJson(method, urlString, body, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? https : http;

    const payload = body === undefined ? undefined : Buffer.from(JSON.stringify(body));
    const req = transport.request(
      {
        method,
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        headers: {
          Accept: 'application/json',
          ...(payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': payload.length,
              }
            : {}),
        },
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          const status = res.statusCode || 0;
          const contentType = String(res.headers['content-type'] || '');
          const isJson = contentType.toLowerCase().includes('application/json');

          let parsed = raw;
          if (isJson && raw) {
            try {
              parsed = JSON.parse(raw);
            } catch (e) {
              return reject(new Error('Failed to parse JSON response from LLM API'));
            }
          }

          if (status < 200 || status >= 300) {
            const err = new Error(`LLM API request failed with status ${status}`);
            err.status = status;
            err.details = parsed;
            return reject(err);
          }

          return resolve(parsed);
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('LLM API request timed out'));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

function requestText(method, urlString, body, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? https : http;

    const payload = body === undefined ? undefined : Buffer.from(JSON.stringify(body));
    const req = transport.request(
      {
        method,
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        headers: {
          ...(payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': payload.length,
              }
            : {}),
        },
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          const status = res.statusCode || 0;
          if (status < 200 || status >= 300) {
            const err = new Error(`Request failed with status ${status}`);
            err.status = status;
            err.details = raw;
            return reject(err);
          }
          return resolve(raw);
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Request timed out'));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

function getMissingEmailJsEnvKeys() {
  const missing = [];
  if (!process.env.EMAILJS_SERVICE_ID) missing.push('EMAILJS_SERVICE_ID');
  if (!process.env.EMAILJS_TEMPLATE_ID) missing.push('EMAILJS_TEMPLATE_ID');
  if (!process.env.EMAILJS_PUBLIC_KEY) missing.push('EMAILJS_PUBLIC_KEY');
  return missing;
}

async function sendContactEmailViaEmailJs(contact) {
  const missing = getMissingEmailJsEnvKeys();
  if (missing.length) {
    const err = new Error(`EmailJS is not configured. Missing: ${missing.join(', ')}`);
    err.status = 500;
    throw err;
  }

  const apiUrl = (process.env.EMAILJS_API_URL || 'https://api.emailjs.com/api/v1.0/email/send').trim();
  const now = new Date();

  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      name: contact.full_name || '',
      email: contact.email || '',
      message: contact.message || '',
      date: now.toISOString(),
      full_name: contact.full_name || '',
      company: contact.company || '',
    },
  };

  console.log('Sending EmailJS request to:', apiUrl);
  console.log('EmailJS payload:', JSON.stringify(payload, null, 2));

  await requestText('POST', apiUrl, payload, 15000); // 15 second timeout
}

async function sendContactEmailViaSmtp(contact) {
  const transport = buildSmtpTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const to = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;

  if (!transport || !from || !to) {
    const missing = [];
    if (!transport) missing.push('SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS');
    if (!from) missing.push('SMTP_FROM or SMTP_USER');
    if (!to) missing.push('CONTACT_TO_EMAIL or SMTP_USER');
    const err = new Error(`SMTP is not configured. Missing: ${missing.join(', ')}`);
    err.status = 500;
    throw err;
  }

  const subject = `New Contact Form Submission - AutoRAG`;
  const safeName = contact.full_name ? String(contact.full_name) : '';
  const safeEmail = contact.email ? String(contact.email) : '';
  const safeCompany = contact.company ? String(contact.company) : '';
  const safeMessage = contact.message ? String(contact.message) : '';

  const text =
    `Hello Team AutoRAG,\n\n` +
    `You have received a new contact form submission from the AutoRAG website.\n\n` +
    `Name: ${safeName}\n` +
    `Email: ${safeEmail}\n` +
    `Company: ${safeCompany}\n` +
    `Message:\n${safeMessage}\n\n` +
    `Submitted On: ${new Date().toISOString()}\n`;

  await transport.sendMail({
    from,
    to,
    subject,
    text,
    replyTo: safeEmail || undefined,
  });
}

async function sendContactEmail(contact) {
  // Try EmailJS first (more reliable on Render)
  try {
    await sendContactEmailViaEmailJs(contact);
    return;
  } catch (emailJsError) {
    console.log('EmailJS failed, trying SMTP:', emailJsError.message);
  }
  
  // Fallback to SMTP
  const transport = buildSmtpTransport();
  if (transport) {
    return sendContactEmailViaSmtp(contact);
  }
  
  throw new Error('Both EmailJS and SMTP are unavailable');
}

function buildSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;

  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,    // 5 seconds
    socketTimeout: 10000,     // 10 seconds
  });
}

async function sendVerificationEmail(req, user, plainToken) {
  const transport = buildSmtpTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const verifyUrl = `${getPublicBaseUrl(req)}/api/auth/verify-email?token=${encodeURIComponent(plainToken)}`;

  if (!transport || !from) {
    console.log(`Email verification link (SMTP not configured): ${verifyUrl}`);
    return false;
  }

  await transport.sendMail({
    from,
    to: user.email,
    subject: 'Verify your email',
    text: `Verify your email by opening this link: ${verifyUrl}`,
    html: `<p>Verify your email by opening this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });

  return true;
}

function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

function getMissingGoogleEnvKeys() {
  const missing = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
  if (!process.env.GOOGLE_REDIRECT_URI) missing.push('GOOGLE_REDIRECT_URI');
  return missing;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = match[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/auth/google/callback', async (req, res, next) => {
  return next();
  try {
    // ... existing code ...
    const user = await User.findOne({ email });
    if (!user) {
      // If user doesn't exist, redirect to login with an error
      return res.redirect(`${getPublicBaseUrl(req)}/pages/login.html?error=invalid_credentials`);
    }
    // Update existing user
    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          provider: 'google',
          google_sub: googleSub,
          verified: true,
          verify_token: undefined,
          verify_token_expires_at: undefined,
        },
      },
      { new: true }
    );
    const jwtToken = jwt.sign({ userId: String(updatedUser._id), email: updatedUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const redirect = `${getPublicBaseUrl(req)}/pages/features.html?token=${encodeURIComponent(jwtToken)}`;
    return res.redirect(redirect);
  } catch (e) {
    console.error('Google auth failed:', e);
    return res.redirect(`${getPublicBaseUrl(req)}/pages/login.html?error=auth_failed`);
  }
});

app.get('/api/auth/google/callback', async (req, res) => {
  const client = getGoogleOAuthClient();
  if (!client) {
    return res.status(500).send(`Google OAuth is not configured. Missing: ${getMissingGoogleEnvKeys().join(', ')}`);
  }

  if (req.query && req.query.error) {
    const err = String(req.query.error || '');
    const desc = String(req.query.error_description || '');
    console.error('Google OAuth callback error:', err, desc);
    return res.redirect(`${getPublicBaseUrl(req)}/pages/login.html?error=auth_failed&message=${encodeURIComponent(desc || 'Google OAuth error')}`);
  }

  const code = String(req.query.code || '');
  if (!code) {
    return res.redirect(`${getPublicBaseUrl(req)}/pages/login.html?error=missing_code&message=Missing authorization code`);
  }

  try {
    // Exchange authorization code for tokens
    const { tokens } = await client.getToken(code);
    const idToken = tokens.id_token;
    if (!idToken) {
      return res.redirect(`${getPublicBaseUrl(req)}/pages/login.html?error=invalid_token&message=Missing ID token`);
    }

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.redirect(`${getPublicBaseUrl(req)}/pages/login.html?error=invalid_token&message=Invalid Google token payload`);
    }

    if (!payload.email_verified) {
      return res.redirect(`${getPublicBaseUrl(req)}/pages/login.html?error=email_not_verified&message=Google email not verified`);
    }

    const email = String(payload.email).toLowerCase();
    const name = payload.name || payload.given_name || '';
    const googleSub = String(payload.sub);

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // User doesn't exist, redirect to login with error
      return res.redirect(`${getPublicBaseUrl(req)}/pages/login.html?error=invalid_credentials&message=No account found with this email`);
    }

    // Update existing user with Google info
    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          provider: 'google',
          google_sub: googleSub,
          verified: true,
          verify_token: undefined,
          verify_token_expires_at: undefined,
        },
      },
      { new: true }
    );

    // Create JWT token
    const jwtToken = jwt.sign(
      { userId: String(updatedUser._id), email: updatedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to documents page with token
    const redirectUrl = `${getPublicBaseUrl(req)}/pages/features.html?token=${encodeURIComponent(jwtToken)}`;
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('Google auth failed:', error);
    const errorMessage = error.message || 'Authentication failed';
    return res.redirect(
      `${getPublicBaseUrl(req)}/pages/login.html?error=auth_failed&message=${encodeURIComponent(errorMessage)}`
    );
  }
});

app.get('/api/health', async (req, res) => {
  const conn = mongoose.connection;
  res.json({
    ok: true,
    db: {
      readyState: conn.readyState,
      name: conn.name,
      host: conn.host,
    },
  });
});

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: String(email).toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  const plainVerifyToken = crypto.randomBytes(32).toString('hex');
  const verifyTokenHash = crypto.createHash('sha256').update(plainVerifyToken).digest('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  try {
    const user = await User.create({
      name: name || undefined,
      email: String(email).toLowerCase(),
      password_hash: passwordHash,
      provider: 'local',
      verified: false,
      verify_token: verifyTokenHash,
      verify_token_expires_at: expiresAt,
    });

    let emailSent = false;
    try {
      emailSent = await sendVerificationEmail(req, user, plainVerifyToken);
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr && (mailErr.message || String(mailErr)));
    }

    return res.status(201).json({
      ok: true,
      requires_verification: true,
      email_sent: emailSent,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        verified: user.verified,
      },
    });
  } catch (e) {
    if (String(e && e.code) === '11000') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/api/auth/verify-email', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) {
    return res.status(400).send('Missing token');
  }

  const verifyTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    verify_token: verifyTokenHash,
    verify_token_expires_at: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).send('Invalid or expired token');
  }

  user.verified = true;
  user.verify_token = undefined;
  user.verify_token_expires_at = undefined;
  await user.save();

  const jwtToken = jwt.sign({ userId: String(user._id), email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const redirect = `${getPublicBaseUrl(req)}/pages/features.html?token=${encodeURIComponent(jwtToken)}`;
  return res.redirect(redirect);
});

app.post('/api/auth/resend-verification', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (user.verified) {
    return res.status(400).json({ error: 'Already verified' });
  }

  const plainVerifyToken = crypto.randomBytes(32).toString('hex');
  const verifyTokenHash = crypto.createHash('sha256').update(plainVerifyToken).digest('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  user.verify_token = verifyTokenHash;
  user.verify_token_expires_at = expiresAt;
  await user.save();

  let emailSent = false;
  try {
    emailSent = await sendVerificationEmail(req, user, plainVerifyToken);
  } catch (mailErr) {
    console.error('Failed to resend verification email:', mailErr && (mailErr.message || String(mailErr)));
  }

  return res.json({ ok: true, email_sent: emailSent });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).lean();
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.provider === 'google' && !user.password_hash) {
    return res.status(400).json({ error: 'Use Google login for this account' });
  }

  if (!user.verified) {
    return res.status(403).json({ error: 'Email not verified' });
  }

  if (!user.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(String(password), user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: String(user._id), email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return res.json({
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    },
  });
});

app.get('/api/auth/google', async (req, res) => {
  const client = getGoogleOAuthClient();
  if (!client) {
    return res.status(500).json({
      error: 'Google OAuth is not configured',
      missing: getMissingGoogleEnvKeys(),
    });
  }

  const url = client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  });
  return res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const client = getGoogleOAuthClient();
  if (!client) {
    return res.status(500).send(`Google OAuth is not configured. Missing: ${getMissingGoogleEnvKeys().join(', ')}`);
  }

  if (req.query && req.query.error) {
    const err = String(req.query.error || '');
    const desc = String(req.query.error_description || '');
    console.error('Google OAuth callback error:', err, desc);
    return res.status(400).send(`Google OAuth error: ${err}`);
  }

  const code = String(req.query.code || '');
  if (!code) {
    return res.status(400).send('Missing code');
  }

  try {
    const { tokens } = await client.getToken(code);
    const idToken = tokens.id_token;
    if (!idToken) {
      return res.status(400).send('Missing id_token');
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).send('Invalid Google token');
    }

    if (!payload.email_verified) {
      return res.status(403).send('Google email not verified');
    }

    const email = String(payload.email).toLowerCase();
    const name = payload.name || payload.given_name || '';
    const googleSub = String(payload.sub);

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          name,
          provider: 'google',
          google_sub: googleSub,
          verified: true,
          verify_token: undefined,
          verify_token_expires_at: undefined,
        },
      },
      { upsert: true, new: true }
    );

    const jwtToken = jwt.sign({ userId: String(user._id), email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const redirect = `${getPublicBaseUrl(req)}/pages/features.html?token=${encodeURIComponent(jwtToken)}`;
    return res.redirect(redirect);
  } catch (e) {
    const msg = e && (e.message || String(e));
    const details = e && e.response && e.response.data ? e.response.data : null;
    console.error('Google auth failed:', msg);
    if (details) console.error('Google auth details:', details);
    return res.status(500).send('Google auth failed');
  }
});

app.get('/api/me', requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findById(userId).select('_id name email created_at').lean();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    },
  });
});

app.post('/api/contact', requireAuth, async (req, res) => {
  const { full_name, company, message } = req.body || {};

  const emailValue = String((req.user && req.user.email) || '').trim();
  const messageValue = String(message || '').trim();
  if (!emailValue) {
    return res.status(400).json({ error: 'email is required' });
  }
  if (!messageValue) {
    return res.status(400).json({ error: 'message is required' });
  }

  const contactPayload = {
    full_name: full_name || undefined,
    email: emailValue,
    company: company || undefined,
    message: messageValue,
  };

  try {
    await Contact.create(contactPayload);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to save contact' });
  }

  try {
    console.log('Attempting to send contact email for:', contactPayload.email);
    await sendContactEmail(contactPayload);
    console.log('Contact email sent successfully');
  } catch (e) {
    const msg = e && (e.message || String(e));
    const status = e && e.status ? Number(e.status) : 502;
    const details = e && e.details ? e.details : undefined;
    console.error('Failed to send contact email:', msg);
    console.error('Error details:', e);
    if (details) console.error('EmailJS details:', details);
    
    // Return more specific error message
    let errorMessage = 'Failed to send message';
    if (msg.includes('EmailJS is not configured')) {
      errorMessage = 'Email service is not properly configured';
    } else if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
      errorMessage = 'Email service timeout - please try again';
    } else if (msg.includes('Connection')) {
      errorMessage = 'Unable to connect to email service';
    }
    
    return res.status(status).json({ error: errorMessage });
  }

  return res.status(201).json({ ok: true });
});

app.get('/api/documents', requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const documents = await Document.find({ user_id: userId })
    .sort({ uploaded_at: -1 })
    .select('_id title doc_type pages status uploaded_at')
    .lean();

  return res.json({
    documents: documents.map((d) => ({
      id: String(d._id),
      title: d.title,
      doc_type: d.doc_type,
      pages: d.pages,
      status: d.status,
      uploaded_at: d.uploaded_at,
    })),
  });
});

app.post('/api/documents', requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const { title, doc_type, pages, status } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const doc = await Document.create({
    user_id: userId,
    title,
    doc_type: doc_type || undefined,
    pages: Number.isFinite(pages) ? pages : pages ? Number(pages) : undefined,
    status: status || 'Processed',
  });

  return res.status(201).json({
    document: {
      id: String(doc._id),
      title: doc.title,
      doc_type: doc.doc_type,
      pages: doc.pages,
      status: doc.status,
      uploaded_at: doc.uploaded_at,
    },
  });
});

app.get('/api/llm/health', async (req, res) => {
  try {
    const llmBase = getLlmApiBaseUrl();
    const data = await requestJson('GET', `${llmBase}/health`);
    return res.json({ ok: true, llm: data });
  } catch (e) {
    const llmBase = getLlmApiBaseUrl();
    return res.status(502).json({ ok: false, error: e.message || 'LLM API unavailable', llm_base: llmBase });
  }
});

app.post('/api/llm/query', requireAuth, async (req, res) => {
  try {
    const { query, threshold, max_results, use_healing } = req.body || {};
    if (!query || !String(query).trim()) {
      return res.status(400).json({ error: 'query is required' });
    }

    const llmBase = getLlmApiBaseUrl();
    const payload = {
      query: String(query),
      ...(threshold !== undefined ? { threshold: Number(threshold) } : {}),
      ...(max_results !== undefined ? { max_results: Number(max_results) } : {}),
      ...(use_healing !== undefined ? { use_healing: Boolean(use_healing) } : {}),
    };

    const timeoutMs = getLlmApiTimeoutMs();
    const data = await requestJson('POST', `${llmBase}/query`, payload, timeoutMs);
    return res.json(data);
  } catch (e) {
    const llmBase = getLlmApiBaseUrl();
    const status = e && e.status ? Number(e.status) : 502;
    const response = { error: e.message || 'Failed to call LLM API', llm_base: llmBase };
    if (e && e.details !== undefined) response.details = e.details;
    return res.status(status).json(response);
  }
});

const staticRoot = path.join(__dirname, '..', 'AutoRag-website');
app.use(express.static(staticRoot));

app.get('/', (req, res) => {
  res.sendFile(path.join(staticRoot, 'index.html'));
});

app.get('/pages/:page', (req, res) => {
  res.sendFile(path.join(staticRoot, 'pages', req.params.page));
});

const port = Number(process.env.PORT || 3001);

async function start() {
  await connectDb();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Backend running on port ${port}`);
  });
}

start().catch((e) => {
  console.error('Failed to start server', e);
  process.exit(1);
});
