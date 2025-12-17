const path = require('path');

const bcrypt = require('bcryptjs');
const cors = require('cors');
const crypto = require('crypto');
const dotenv = require('dotenv');
const express = require('express');
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
  });
}

async function sendVerificationEmail(req, user, plainToken) {
  const transport = buildSmtpTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const verifyUrl = `${getPublicBaseUrl(req)}/api/auth/verify-email?token=${encodeURIComponent(plainToken)}`;

  if (!transport || !from) {
    console.log(`Email verification link (SMTP not configured): ${verifyUrl}`);
    return;
  }

  await transport.sendMail({
    from,
    to: user.email,
    subject: 'Verify your email',
    text: `Verify your email by opening this link: ${verifyUrl}`,
    html: `<p>Verify your email by opening this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
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
      await sendVerificationEmail(req, user, plainVerifyToken);
      emailSent = true;
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
  const redirect = `${getPublicBaseUrl(req)}/pages/documents.html?token=${encodeURIComponent(jwtToken)}`;
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
    await sendVerificationEmail(req, user, plainVerifyToken);
    emailSent = true;
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

  if (user.provider === 'google') {
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
    const redirect = `${getPublicBaseUrl(req)}/pages/documents.html?token=${encodeURIComponent(jwtToken)}`;
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

app.post('/api/contact', async (req, res) => {
  const { full_name, email, company, country, phone, message } = req.body || {};

  await Contact.create({
    full_name: full_name || undefined,
    email: email || undefined,
    company: company || undefined,
    country: country || undefined,
    phone: phone || undefined,
    message: message || undefined,
  });

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
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

start().catch((e) => {
  console.error('Failed to start server', e);
  process.exit(1);
});
