const mongoose = require('mongoose');

async function connectDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  await mongoose.connect(connectionString, {
    serverSelectionTimeoutMS: 15000,
  });

  const conn = mongoose.connection;
  console.log(`MongoDB connected: host=${conn.host} db=${conn.name}`);
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, unique: true, required: true, index: true },
    password_hash: { type: String },
    provider: { type: String, default: 'local' },
    google_sub: { type: String, index: true },
    verified: { type: Boolean, default: false },
    verify_token: { type: String, index: true },
    verify_token_expires_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const ContactSchema = new mongoose.Schema(
  {
    full_name: { type: String },
    email: { type: String },
    company: { type: String },
    country: { type: String },
    phone: { type: String },
    message: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const DocumentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    doc_type: { type: String },
    pages: { type: Number },
    status: { type: String, default: 'Processed' },
    uploaded_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
const Document = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

module.exports = {
  connectDb,
  User,
  Contact,
  Document,
};
