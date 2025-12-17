const path = require('path');

const bcrypt = require('bcryptjs');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { connectDb, User, Contact, Document } = require('./db');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors());

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

  try {
    const user = await User.create({
      name: name || undefined,
      email: String(email).toLowerCase(),
      password_hash: passwordHash,
    });

    const token = jwt.sign({ userId: String(user._id), email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (e) {
    if (String(e && e.code) === '11000') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Failed to create user' });
  }
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
