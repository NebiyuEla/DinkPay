import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/admin', express.static(path.join(workspaceRoot, 'admin')));

const PORT = Number(process.env.PORT || 5000);
const CHAPA_API_BASE = 'https://api.chapa.co/v1';
const FRONTEND_URL = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 24;
const CHAPA_PENDING_GRACE_MS = 1000 * 60 * 5;
const BOT_SYNC_TOKEN = process.env.BOT_SYNC_TOKEN || 'local-dink-bot-sync';
const ENABLE_DIRECT_TELEGRAM_PUSH = process.env.DIRECT_TELEGRAM_PUSH !== 'false';
const ORDER_ALERT_ADMIN_TELEGRAM_ID = String(process.env.ORDER_ALERT_ADMIN_TELEGRAM_ID || '626003565').trim();
const BOT_SCRIPT_PATH = path.join(workspaceRoot, 'DinkPayment.py');
const SERVICES_FILE_PATH = path.join(workspaceRoot, 'backend', 'data', 'services.json');
const UPLOADS_DIR = path.join(workspaceRoot, 'backend', 'uploads');
const CURRENT_TERMS_VERSION = 'march-2026';
app.use('/uploads', express.static(UPLOADS_DIR));
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || (() => {
  try {
    const botSource = fs.readFileSync(BOT_SCRIPT_PATH, 'utf8');
    return (
      botSource.match(/API_KEY\s*=\s*['"]([^'"]+)['"]/)?.[1] ||
      botSource.match(/API_KEY\s*=\s*os\.getenv\(\s*["']TELEGRAM_BOT_TOKEN["']\s*,\s*['"]([^'"]+)['"]\s*\)/)?.[1] ||
      ''
    );
  } catch (error) {
    return '';
  }
})();
const PAYMENT_SYNC_INTERVAL_MS = 30000;

const adminSessions = new Map();
const paymentSyncCache = new Map();

const allowedOrderStatuses = new Set(['pending', 'processing', 'completed', 'cancelled']);
const allowedPaymentStatuses = new Set(['pending', 'paid', 'failed', 'refunded']);
const allowedFormatStyles = new Set(['plain', 'bold', 'italic', 'code']);
const legacyServiceIconPathMap = new Map([
  ['/icons/youtube.svg', '/icons/youtube.png'],
  ['/icons/telegram-stars.svg', '/icons/tgstars.png'],
  ['/icons/duolingo.svg', '/icons/duolingo.png'],
  ['/icons/instagram-services.svg', '/icons/igsvs.svg']
]);

let serviceCatalogSeeded = false;

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: true },
    telegramId: { type: String, unique: true, sparse: true },
    telegramUsername: String,
    botStartedAt: Date,
    botStartRequired: { type: Boolean, default: false },
    isBotBanned: { type: Boolean, default: false },
    botBanReason: String,
    botBannedAt: Date,
    referredByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    referredByCode: String,
    referralAppliedAt: Date,
    termsAcceptedVersion: String,
    termsAcceptedAt: Date
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user: {
      fullName: String,
      email: String,
      phone: String
    },
    service: {
      id: String,
      name: String,
      icon: String,
      fallback: String,
      color: String,
      discountPercent: Number
    },
    plan: {
      name: String,
      price: Number,
      originalPrice: Number
    },
    credentials: {
      type: Map,
      of: String,
      default: {}
    },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    paymentStatus: { type: String, default: 'pending' },
    paymentMethod: { type: String, default: 'chapa' },
    transactionId: { type: String, unique: true, sparse: true },
    checkoutUrl: String,
    chapaStatus: String,
    chapaReference: String,
    paymentVerifiedAt: Date,
    paidAt: Date,
    completedAt: Date,
    adminNote: String
  },
  { timestamps: true }
);

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    formatStyle: { type: String, default: 'plain' },
    attachment: {
      url: String,
      kind: String,
      name: String,
      mimeType: String
    },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const serviceInputSchema = new mongoose.Schema(
  {
    type: String,
    label: String,
    placeholder: String
  },
  { _id: false }
);

const servicePlanSchema = new mongoose.Schema(
  {
    name: String,
    price: Number
  },
  { _id: false }
);

const referralPrizeSchema = new mongoose.Schema(
  {
    place: String,
    title: String,
    reward: String
  },
  { _id: false }
);

const referralHistorySchema = new mongoose.Schema(
  {
    name: String,
    joinedAt: String,
    via: String,
    status: String
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    icon: String,
    fallback: String,
    color: String,
    category: String,
    sortOrder: { type: Number, default: 999 },
    discountPercent: { type: Number, default: 0 },
    popular: { type: Boolean, default: false },
    requiresCredentials: { type: Boolean, default: false },
    inputs: { type: [serviceInputSchema], default: [] },
    plans: { type: [servicePlanSchema], default: [] }
  },
  { timestamps: true }
);

const adminSettingsSchema = new mongoose.Schema(
  {
    globalDiscountPercent: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const referralCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Referral Campaign' },
    description: {
      type: String,
      default: 'Invite friends, grow your reach, and earn 5% commission on each successful order.'
    },
    endsAt: Date,
    commissionPercent: { type: Number, default: 5 },
    targetInvites: { type: Number, default: 50 },
    minimumPrizeInvites: { type: Number, default: 50 },
    active: { type: Boolean, default: true },
    shareBaseUrl: { type: String, default: 'https://t.me/DinkPaymentBot' },
    shareMessage: {
      type: String,
      default: 'Join the DINK Pay Referral Campaign and start inviting today.'
    },
    prizes: { type: [referralPrizeSchema], default: [] }
  },
  { timestamps: true }
);

const referralProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    points: { type: Number, default: 0 },
    inviteCount: { type: Number, default: 0 },
    targetInvites: { type: Number, default: 0 },
    successfulOrders: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    commissionPercentOverride: { type: Number, default: null },
    referralCode: String,
    notes: String,
    history: { type: [referralHistorySchema], default: [] }
  },
  { timestamps: true }
);

const botSessionSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true, trim: true },
    telegramUsername: String,
    firstName: String,
    lastName: String,
    startParam: String,
    referralCode: String,
    startedAt: Date
  },
  { timestamps: true }
);

const telegramAccessBlockSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true, trim: true },
    status: { type: String, default: 'banned' },
    reason: String
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Service = mongoose.model('Service', serviceSchema);
const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
const ReferralCampaign = mongoose.model('ReferralCampaign', referralCampaignSchema);
const ReferralProfile = mongoose.model('ReferralProfile', referralProfileSchema);
const BotSession = mongoose.model('BotSession', botSessionSchema);
const TelegramAccessBlock = mongoose.model('TelegramAccessBlock', telegramAccessBlockSchema);

const createUserToken = (userId) => `dummy-token-${userId}`;

const generateOrderId = () =>
  `ORD-${Date.now().toString().slice(-8)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

const generateTxRef = () =>
  `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedPassword) => {
  if (!storedPassword) return false;

  if (!storedPassword.includes(':')) {
    return password === storedPassword;
  }

  try {
    const [salt, hash] = storedPassword.split(':');
    const comparison = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(comparison, 'hex'));
  } catch (error) {
    return false;
  }
};

const getUserIdFromRequest = (req) => {
  const token = req.headers.authorization?.split(' ')[1] || '';
  if (!token.startsWith('dummy-token-')) {
    return null;
  }

  return token.replace('dummy-token-', '');
};

const requireUser = async (req, res, next) => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.telegramId) {
      const accessBlock = await getTelegramAccessBlock(user.telegramId);
      if (accessBlock?.telegramId) {
        return res.status(403).json({
          success: false,
          message:
            accessBlock.status === 'deleted'
              ? 'This Telegram account was removed from DINK Pay. Contact admin if you need access again.'
              : accessBlock.reason || 'This Telegram account is blocked from using DINK Pay right now.'
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const createAdminSession = () => {
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, {
    createdAt: Date.now()
  });
  return token;
};

const pruneAdminSessions = () => {
  const now = Date.now();
  for (const [token, session] of adminSessions.entries()) {
    if (now - session.createdAt > ADMIN_SESSION_TTL_MS) {
      adminSessions.delete(token);
    }
  }
};

const requireAdmin = (req, res, next) => {
  pruneAdminSessions();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ success: false, message: 'Admin authentication required' });
  }

  req.adminSession = adminSessions.get(token);
  next();
};

const requireBotSync = (req, res, next) => {
  const token = req.headers['x-bot-token'];
  if (!token || token !== BOT_SYNC_TOKEN) {
    return res.status(401).json({ success: false, message: 'Bot authentication required' });
  }

  next();
};

const splitFullName = (fullName = '') => {
  const [firstName = 'Customer', ...rest] = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName,
    lastName: rest.join(' ')
  };
};

const sanitizeCheckoutText = (value = '', fallback = 'Customer') => {
  const cleaned = String(value || '')
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || fallback;
};

const getSafeCheckoutEmail = (user) => {
  if (user?.telegramId) {
    return `cust${String(user.telegramId).replace(/\D/g, '')}@gmail.com`;
  }

  const email = (user?.email || '').trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (isValidEmail) {
    return email;
  }

  return `customer-${String(user?._id || Date.now())}@gmail.com`;
};

const normalizePhoneNumber = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (raw.startsWith('tg-')) {
    return raw;
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  if (digits.startsWith('251')) {
    return `+${digits}`;
  }

  if (digits.startsWith('09') && digits.length === 10) {
    return `+251${digits.slice(1)}`;
  }

  if (digits.startsWith('9') && digits.length === 9) {
    return `+251${digits}`;
  }

  if (raw.startsWith('+')) {
    return `+${digits}`;
  }

  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return raw;
};

const isValidPhoneNumber = (value = '', { allowBlank = false, allowTelegram = false } = {}) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return allowBlank;
  }

  if (raw.startsWith('tg-')) {
    return allowTelegram && /^tg-\d+$/.test(raw);
  }

  return /^\+\d{8,15}$/.test(normalizePhoneNumber(raw));
};

const isValidEmailAddress = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim().toLowerCase());

const normalizeMessage = (value, fallback) => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (value && typeof value === 'object') {
    if (typeof value.message === 'string' && value.message.trim()) {
      return value.message;
    }

    const parts = Object.values(value)
      .filter((entry) => typeof entry === 'string' && entry.trim())
      .join(', ');

    if (parts) {
      return parts;
    }
  }

  return fallback;
};

const extractChapaErrorMessage = (payload, fallback = 'Unable to start Chapa checkout') => {
  const parts = [];
  const seen = new Set();

  const collect = (value) => {
    if (!value) {
      return;
    }

    if (typeof value === 'string') {
      const text = value.trim();
      if (!text || seen.has(text)) {
        return;
      }

      seen.add(text);
      parts.push(text);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }

    if (typeof value === 'object') {
      ['message', 'detail', 'error', 'errors', 'data', 'description'].forEach((key) => {
        if (key in value) {
          collect(value[key]);
        }
      });

      Object.values(value).forEach((entry) => {
        if (parts.length < 6) {
          collect(entry);
        }
      });
    }
  };

  collect(payload);
  return parts.length > 0 ? parts.slice(0, 4).join(' • ') : fallback;
};

const getBackendBaseUrl = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const protocol = forwardedProto || req.protocol;
  const host = forwardedHost || req.get('host');
  return `${protocol}://${host}`;
};

const getFrontendBaseUrl = (req) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin) {
    return origin.replace(/\/$/, '');
  }

  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin.replace(/\/$/, '');
    } catch (error) {
      return FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    }
  }

  return FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
};

const buildUrl = (base, pathname, query = {}) => {
  const url = new URL(pathname, `${base.replace(/\/$/, '')}/`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const normalizeBoolean = (value) =>
  value === true || value === 'true' || value === 1 || value === '1';

const parseMoneyValue = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }

  const normalized = String(value ?? '')
    .trim()
    .replace(/,/g, '')
    .replace(/\betb\b/gi, '')
    .replace(/\s+/g, '');

  if (!normalized) {
    return NaN;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const normalizeDiscountPercent = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(99, Math.max(0, Math.round(parsed * 100) / 100));
};

const applyDiscountToAmount = (amount, discountPercent = 0) => {
  const numericAmount = parseMoneyValue(amount);
  const normalizedDiscount = normalizeDiscountPercent(discountPercent, 0);

  if (!Number.isFinite(numericAmount)) {
    return NaN;
  }

  if (normalizedDiscount <= 0) {
    return numericAmount;
  }

  return Math.max(0.01, Math.round(numericAmount * (1 - normalizedDiscount / 100) * 100) / 100);
};

const getEffectiveDiscountPercent = (serviceDiscountPercent = 0, globalDiscountPercent = 0) =>
  Math.max(
    normalizeDiscountPercent(serviceDiscountPercent, 0),
    normalizeDiscountPercent(globalDiscountPercent, 0)
  );

const getUpcomingReferralDeadline = () => {
  const now = new Date();
  const currentYearTarget = new Date(now.getFullYear(), 3, 19, 23, 59, 59);
  return now > currentYearTarget
    ? new Date(now.getFullYear() + 1, 3, 19, 23, 59, 59)
    : currentYearTarget;
};

const getDefaultReferralPrizes = () => [
  { place: '1st', title: 'Grand Prize', reward: '20,000 ETB cash reward' },
  { place: '2nd', title: 'Champion Bonus', reward: '12,000 ETB cash reward' },
  { place: '3rd', title: 'Growth Reward', reward: '7,500 ETB bonus payout' },
  { place: '4th', title: 'Top Performer', reward: '5,000 ETB service credit' },
  { place: '5th', title: 'Momentum Prize', reward: '2,500 ETB service credit' }
];

const normalizeCountValue = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.round(parsed));
};

const normalizeOptionalPercent = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return normalizeDiscountPercent(value, fallback ?? 0);
};

const sanitizeReferralPrizeList = (value) => {
  const prizes = Array.isArray(value) ? value : [];
  const normalized = prizes
    .map((prize, index) => ({
      place: String(prize?.place || `${index + 1}`).trim(),
      title: String(prize?.title || '').trim(),
      reward: String(prize?.reward || '').trim()
    }))
    .filter((prize) => prize.title && prize.reward);

  return normalized.length > 0 ? normalized.slice(0, 5) : getDefaultReferralPrizes();
};

const sanitizeReferralHistory = (value) => {
  const history = Array.isArray(value) ? value : [];
  return history
    .map((entry) => ({
      name: String(entry?.name || '').trim(),
      joinedAt: String(entry?.joinedAt || '').trim(),
      via: String(entry?.via || '').trim(),
      status: String(entry?.status || '').trim() || 'Joined'
    }))
    .filter((entry) => entry.name && entry.joinedAt)
    .slice(0, 20);
};

const buildReferralSeed = (user = {}) => {
  const source = String(user.telegramId || user._id || user.id || user.email || user.fullName || 'dinkpay');
  return Array.from(source).reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0
  );
};

const buildDefaultReferralStats = (user = {}) => {
  const seed = buildReferralSeed(user);
  const referralCodeSource = String(
    user.telegramId ||
      user._id ||
      user.id ||
      user.email ||
      user.fullName ||
      `dink-${seed}`
  )
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 18);

  return {
    inviteCount: 0,
    successfulOrders: 0,
    earnings: 0,
    points: 0,
    referralCode: `ref_${referralCodeSource || seed}`,
    history: []
  };
};

const buildReferralLink = (shareBaseUrl, referralCode) => {
  const fallbackUrl = `https://t.me/DinkPaymentBot?start=${encodeURIComponent(referralCode)}&startapp=${encodeURIComponent(referralCode)}`;

  try {
    const url = new URL(String(shareBaseUrl || '').trim() || fallbackUrl);
    if (/t\.me$/i.test(url.hostname) || url.hostname.toLowerCase() === 't.me') {
      url.searchParams.set('start', referralCode);
      url.searchParams.set('startapp', referralCode);
    } else {
      url.searchParams.set('ref', referralCode);
    }
    return url.toString();
  } catch (error) {
    return fallbackUrl;
  }
};

const normalizeTelegramId = (value) => String(value || '').trim();

const extractReferralCode = (value = '') => {
  let raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  try {
    raw = decodeURIComponent(raw);
  } catch (error) {
    raw = String(value || '').trim();
  }

  raw = raw.replace(/^\/start\s+/i, '').trim();

  if (raw.includes('start=')) {
    raw = raw.split('start=').pop() || raw;
  } else if (raw.includes('startapp=')) {
    raw = raw.split('startapp=').pop() || raw;
  } else if (raw.includes('ref=')) {
    raw = raw.split('ref=').pop() || raw;
  }

  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
};

const formatReferralHistoryDate = (value = new Date()) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const buildBotAccessState = (user = null, block = null) => ({
  hasTelegramAccount: Boolean(user?.telegramId || block?.telegramId),
  banned: Boolean(user?.isBotBanned || block?.telegramId),
  reason: String(user?.botBanReason || block?.reason || '').trim(),
  startRequired: Boolean(user?.botStartRequired),
  startedAt: user?.botStartedAt || null
});

const serializeAdminUser = (user = {}) => ({
  _id: String(user._id || ''),
  fullName: user.fullName || '',
  email: user.email || '',
  phone: user.phone || '',
  telegramId: user.telegramId || '',
  telegramUsername: user.telegramUsername || '',
  createdAt: user.createdAt,
  access: buildBotAccessState(user)
});

const upsertBotSession = async ({
  telegramId,
  telegramUsername = '',
  firstName = '',
  lastName = '',
  startParam = ''
}) => {
  const normalizedTelegramId = normalizeTelegramId(telegramId);
  if (!normalizedTelegramId) {
    return null;
  }

  const referralCode = extractReferralCode(startParam);
  return BotSession.findOneAndUpdate(
    { telegramId: normalizedTelegramId },
    {
      $set: {
        telegramUsername: String(telegramUsername || '').trim(),
        firstName: String(firstName || '').trim(),
        lastName: String(lastName || '').trim(),
        startParam: String(startParam || '').trim(),
        referralCode,
        startedAt: new Date()
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

const getTelegramAccessBlock = async (telegramId) => {
  const normalizedTelegramId = normalizeTelegramId(telegramId);
  if (!normalizedTelegramId) {
    return null;
  }

  return TelegramAccessBlock.findOne({ telegramId: normalizedTelegramId }).lean();
};

const saveTelegramAccessBlock = async ({ telegramId, status = 'banned', reason = '' }) => {
  const normalizedTelegramId = normalizeTelegramId(telegramId);
  if (!normalizedTelegramId) {
    return null;
  }

  return TelegramAccessBlock.findOneAndUpdate(
    { telegramId: normalizedTelegramId },
    {
      $set: {
        status: String(status || 'banned').trim().toLowerCase() || 'banned',
        reason: String(reason || '').trim()
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).lean();
};

const clearTelegramAccessBlock = async (telegramId) => {
  const normalizedTelegramId = normalizeTelegramId(telegramId);
  if (!normalizedTelegramId) {
    return;
  }

  await TelegramAccessBlock.deleteOne({ telegramId: normalizedTelegramId });
};

const getOrCreateReferralProfile = async (user, campaign = null) => {
  if (!user?._id) {
    return null;
  }

  const campaignState = serializeReferralCampaign(campaign || (await getReferralCampaign()));
  const defaults = buildReferralStateForUser(user, campaignState, null);

  return ReferralProfile.findOneAndUpdate(
    { userId: user._id },
    {
      $setOnInsert: {
        referralCode: defaults.referralCode,
        targetInvites: campaignState.targetInvites
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

const findReferrerByReferralCode = async (referralCode) => {
  const normalizedCode = extractReferralCode(referralCode);
  if (!normalizedCode) {
    return null;
  }

  const existingProfile = await ReferralProfile.findOne({ referralCode: normalizedCode }).lean();
  if (existingProfile?.userId) {
    const user = await User.findById(existingProfile.userId)
      .select('fullName email telegramId telegramUsername createdAt')
      .lean();

    if (user) {
      return {
        user,
        profile: existingProfile,
        referralCode: normalizedCode
      };
    }
  }

  const users = await User.find().select('fullName email telegramId telegramUsername createdAt').lean();
  const matchedUser = users.find((user) => buildDefaultReferralStats(user).referralCode === normalizedCode);
  if (!matchedUser) {
    return null;
  }

  const campaign = await getReferralCampaign();
  const profile = await getOrCreateReferralProfile(matchedUser, campaign);

  return {
    user: matchedUser,
    profile: profile?.toJSON ? profile.toJSON() : profile,
    referralCode: normalizedCode
  };
};

const applyReferralCodeToUser = async (user, rawReferralCode, source = 'Telegram invite link') => {
  const referralCode = extractReferralCode(rawReferralCode);
  if (!user?._id || !referralCode) {
    return { applied: false, reason: 'missing-referral' };
  }

  if (user.referredByUserId || user.referredByCode) {
    return { applied: false, reason: 'already-linked' };
  }

  const referrer = await findReferrerByReferralCode(referralCode);
  if (!referrer?.user?._id) {
    return { applied: false, reason: 'invalid-referral' };
  }

  if (String(referrer.user._id) === String(user._id)) {
    return { applied: false, reason: 'self-referral' };
  }

  if (user.telegramId && referrer.user.telegramId && String(referrer.user.telegramId) === String(user.telegramId)) {
    return { applied: false, reason: 'self-referral' };
  }

  const campaign = await getReferralCampaign();
  const joinedAt = formatReferralHistoryDate(new Date());
  const referrerProfile = await getOrCreateReferralProfile(referrer.user, campaign);

  await ReferralProfile.updateOne(
    { _id: referrerProfile._id },
    {
      $set: {
        referralCode: String(referrerProfile.referralCode || referrer.referralCode).trim(),
        targetInvites:
          normalizeCountValue(referrerProfile.targetInvites, campaign.targetInvites) || campaign.targetInvites
      },
      $inc: {
        inviteCount: 1,
        points: 1
      },
      $push: {
        history: {
          $each: [
            {
              name: user.fullName || user.email || `User ${user._id}`,
              joinedAt,
              via: source,
              status: 'Joined'
            }
          ],
          $slice: -20
        }
      }
    }
  );

  user.referredByUserId = referrer.user._id;
  user.referredByCode = referrer.referralCode;
  user.referralAppliedAt = new Date();
  await user.save();

  await createNotification({
    userId: referrer.user._id,
    title: 'Referral joined',
    message: `${user.fullName || 'A new customer'} joined through your referral link.`,
    type: 'success'
  });

  return {
    applied: true,
    referrerUserId: referrer.user._id,
    referralCode: referrer.referralCode
  };
};

const getReferralCampaign = async () =>
  ReferralCampaign.findOneAndUpdate(
    {},
    {
      $setOnInsert: {
        endsAt: getUpcomingReferralDeadline(),
        prizes: getDefaultReferralPrizes()
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

const serializeReferralCampaign = (campaign) => ({
  title: campaign?.title || 'Referral Campaign',
  description:
    campaign?.description ||
    'Invite friends, grow your reach, and earn 5% commission on each successful order.',
  endsAt: campaign?.endsAt || getUpcomingReferralDeadline(),
  commissionPercent: normalizeDiscountPercent(campaign?.commissionPercent, 5),
  targetInvites: normalizeCountValue(campaign?.targetInvites, 50) || 50,
  minimumPrizeInvites: normalizeCountValue(campaign?.minimumPrizeInvites, 50) || 50,
  active: Boolean(campaign?.active ?? true),
  shareBaseUrl: String(campaign?.shareBaseUrl || 'https://t.me/DinkPaymentBot').trim() || 'https://t.me/DinkPaymentBot',
  shareMessage:
    String(campaign?.shareMessage || 'Join the DINK Pay Referral Campaign and start inviting today.').trim() ||
    'Join the DINK Pay Referral Campaign and start inviting today.',
  prizes: sanitizeReferralPrizeList(campaign?.prizes)
});

const buildReferralStateForUser = (user = {}, campaign, profile = null) => {
  const fallback = buildDefaultReferralStats(user);
  const campaignState = serializeReferralCampaign(campaign);
  const inviteCount = normalizeCountValue(profile?.inviteCount, fallback.inviteCount);
  const targetInvites = normalizeCountValue(profile?.targetInvites, campaignState.targetInvites) || campaignState.targetInvites;
  const successfulOrders = normalizeCountValue(profile?.successfulOrders, fallback.successfulOrders);
  const earnings = Number.isFinite(Number(profile?.earnings)) ? Math.max(0, Number(profile.earnings)) : fallback.earnings;
  const points = normalizeCountValue(profile?.points, fallback.points);
  const commissionPercent =
    profile?.commissionPercentOverride === null || profile?.commissionPercentOverride === undefined || profile?.commissionPercentOverride === ''
      ? campaignState.commissionPercent
      : normalizeDiscountPercent(profile.commissionPercentOverride, campaignState.commissionPercent);
  const referralCode =
    String(profile?.referralCode || '').trim() ||
    fallback.referralCode;
  const history = Array.isArray(profile?.history) && profile.history.length > 0
    ? sanitizeReferralHistory(profile.history)
    : fallback.history;

  return {
    points,
    inviteCount,
    targetInvites,
    successfulOrders,
    earnings,
    commissionPercent,
    referralCode,
    referralLink: buildReferralLink(campaignState.shareBaseUrl, referralCode),
    notes: String(profile?.notes || '').trim(),
    history
  };
};

const serializeReferralUserForAdmin = (user = {}, campaign, profile = null) => {
  const state = buildReferralStateForUser(user, campaign, profile);
  const minimumPrizeInvites = normalizeCountValue(campaign?.minimumPrizeInvites, 50) || 50;

  return {
    userId: String(user._id),
    fullName: user.fullName || 'Customer',
    email: user.email || '',
    phone: user.phone || '',
    telegramUsername: user.telegramUsername || '',
    telegramId: user.telegramId || '',
    createdAt: user.createdAt,
    points: state.points,
    inviteCount: state.inviteCount,
    targetInvites: state.targetInvites,
    successfulOrders: state.successfulOrders,
    earnings: state.earnings,
    commissionPercent: state.commissionPercent,
    commissionPercentOverride:
      profile?.commissionPercentOverride === null || profile?.commissionPercentOverride === undefined
        ? null
        : normalizeDiscountPercent(profile.commissionPercentOverride, state.commissionPercent),
    eligibleForPrize: state.inviteCount >= minimumPrizeInvites,
    referralCode: state.referralCode,
    referralLink: state.referralLink,
    notes: state.notes,
    history: state.history
  };
};

const getReferralLeaderboard = async (campaign, { includeUserId = null, limit = 5 } = {}) => {
  const [users, profiles] = await Promise.all([
    User.find().select('fullName email telegramId telegramUsername createdAt').lean(),
    ReferralProfile.find().lean()
  ]);
  const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  const ranked = users
    .map((user) => serializeReferralUserForAdmin(user, campaign, profileMap.get(String(user._id))))
    .filter((user) => user.eligibleForPrize)
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }
      if (right.inviteCount !== left.inviteCount) {
        return right.inviteCount - left.inviteCount;
      }
      return left.fullName.localeCompare(right.fullName);
    });

  const topEntries = ranked.slice(0, limit).map((entry, index) => ({
    badge: `#${index + 1}`,
    userId: entry.userId,
    name: entry.fullName,
    invites: entry.inviteCount,
    points: entry.points,
    earnings: entry.earnings
  }));

  if (includeUserId && !topEntries.some((entry) => entry.userId === String(includeUserId))) {
    const userEntry = ranked.find((entry) => entry.userId === String(includeUserId));
    if (userEntry) {
      topEntries.push({
        badge: `#${ranked.findIndex((entry) => entry.userId === String(includeUserId)) + 1}`,
        userId: userEntry.userId,
        name: userEntry.fullName,
        invites: userEntry.inviteCount,
        points: userEntry.points,
        earnings: userEntry.earnings
      });
    }
  }

  return topEntries;
};

const getAdminSettings = async () =>
  AdminSettings.findOneAndUpdate(
    {},
    { $setOnInsert: { globalDiscountPercent: 0 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

const decoratePublicService = (service, globalDiscountPercent = 0) => {
  const normalizedService = sanitizeServicePayload(service);
  const serviceDiscountPercent = normalizeDiscountPercent(normalizedService.discountPercent, 0);
  const normalizedGlobalDiscount = normalizeDiscountPercent(globalDiscountPercent, 0);

  return {
    ...normalizedService,
    serviceDiscountPercent,
    globalDiscountPercent: normalizedGlobalDiscount,
    discountPercent: getEffectiveDiscountPercent(serviceDiscountPercent, normalizedGlobalDiscount)
  };
};

const normalizeServiceSortOrder = (value, fallback = 999) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.round(parsed));
};

const normalizeServiceIconPath = (icon = '') => {
  const trimmed = String(icon || '').trim();
  if (!trimmed) {
    return '';
  }

  return legacyServiceIconPathMap.get(trimmed) || trimmed;
};

const sanitizeServicePayload = (payload = {}) => {
  const id = String(payload.id || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const name = String(payload.name || '').trim();
  const icon = normalizeServiceIconPath(payload.icon);
  const fallback = String(payload.fallback || '').trim();
  const color = String(payload.color || '#0b2d22').trim() || '#0b2d22';
  const category = String(payload.category || 'general').trim() || 'general';
  const sortOrder = normalizeServiceSortOrder(payload.sortOrder ?? payload.displayOrder ?? payload.order, 999);
  const discountPercent = normalizeDiscountPercent(payload.discountPercent ?? payload.discount ?? payload.salePercent, 0);
  const popular = normalizeBoolean(payload.popular);
  const requiresCredentials = normalizeBoolean(payload.requiresCredentials);

  const inputs = Array.isArray(payload.inputs)
    ? payload.inputs
        .map((input) => ({
          type: String(input?.type || 'text').trim() || 'text',
          label: String(input?.label || '').trim(),
          placeholder: String(input?.placeholder || '').trim()
        }))
        .filter((input) => input.label)
    : [];

  const plans = Array.isArray(payload.plans)
    ? payload.plans
        .map((plan) => ({
          name: String(plan?.name || '').trim(),
          price: parseMoneyValue(plan?.price),
          ...(plan?.quality ? { quality: String(plan.quality).trim() } : {})
        }))
        .filter((plan) => plan.name && Number.isFinite(plan.price) && plan.price > 0)
    : [];

  if (!id || !name || !icon || plans.length === 0) {
    throw new Error('Service id, name, icon, and at least one plan are required');
  }

  return {
    id,
    name,
    icon,
    fallback: fallback || name.charAt(0).toUpperCase(),
    color,
    category,
    sortOrder,
    discountPercent,
    popular,
    requiresCredentials,
    inputs,
    plans
  };
};

const readServiceCatalogSnapshot = () => {
  try {
    if (!fs.existsSync(SERVICES_FILE_PATH)) {
      return [];
    }

    const raw = fs.readFileSync(SERVICES_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((service, index) =>
          sanitizeServicePayload({
            ...service,
            sortOrder: service?.sortOrder ?? service?.displayOrder ?? service?.order ?? index + 1
          })
        )
      : [];
  } catch (error) {
    console.error('Unable to read services snapshot:', error);
    return [];
  }
};

const persistServiceCatalogSnapshot = (services = []) => {
  try {
    fs.mkdirSync(path.dirname(SERVICES_FILE_PATH), { recursive: true });
    fs.writeFileSync(
      SERVICES_FILE_PATH,
      JSON.stringify(services.map((service) => sanitizeServicePayload(service)), null, 2)
    );
  } catch (error) {
    console.error('Unable to persist services snapshot:', error);
  }
};

const listServicesFromDatabase = async () => {
  const services = await Service.find().sort({ sortOrder: 1, createdAt: 1, name: 1 }).lean();
  return services.map((service) => sanitizeServicePayload(service));
};

const listPublicServicesFromDatabase = async () => {
  const [services, settings] = await Promise.all([listServicesFromDatabase(), getAdminSettings()]);
  return services.map((service) => decoratePublicService(service, settings?.globalDiscountPercent));
};

const ensureServiceCatalogSeeded = async () => {
  if (serviceCatalogSeeded) {
    return;
  }

  const count = await Service.countDocuments();

  if (count === 0) {
    const seedServices = readServiceCatalogSnapshot();
    if (seedServices.length > 0) {
      await Service.insertMany(seedServices, { ordered: false });
      persistServiceCatalogSnapshot(seedServices);
    }
    serviceCatalogSeeded = true;
    return;
  }

  const snapshotServices = readServiceCatalogSnapshot();
  const snapshotOrderMap = new Map(
    snapshotServices.map((service, index) => [service.id, normalizeServiceSortOrder(service.sortOrder, index + 1)])
  );
  const services = await Service.find().sort({ createdAt: 1, name: 1 });
  let changed = false;

  const existingServiceIds = new Set(services.map((service) => service.id));
  const missingServices = snapshotServices.filter((service) => !existingServiceIds.has(service.id));
  if (missingServices.length > 0) {
    await Service.insertMany(missingServices, { ordered: false });
    changed = true;
  }

  for (const [index, service] of services.entries()) {
    const normalized = sanitizeServicePayload({
      ...service.toJSON(),
      sortOrder: service.sortOrder ?? snapshotOrderMap.get(service.id) ?? index + 1
    });
    const serviceChanged =
      normalized.icon !== (service.icon || '') ||
      normalized.fallback !== (service.fallback || '') ||
      normalized.color !== (service.color || '') ||
      normalized.category !== (service.category || '') ||
      normalized.sortOrder !== normalizeServiceSortOrder(service.sortOrder, index + 1) ||
      normalized.discountPercent !== normalizeDiscountPercent(service.discountPercent, 0) ||
      normalized.popular !== Boolean(service.popular) ||
      normalized.requiresCredentials !== Boolean(service.requiresCredentials) ||
      JSON.stringify(normalized.inputs) !== JSON.stringify(service.inputs || []) ||
      JSON.stringify(normalized.plans) !== JSON.stringify(service.plans || []);

    if (!serviceChanged) {
      continue;
    }

    Object.assign(service, normalized);
    await service.save();
    changed = true;
  }

  if (changed) {
    persistServiceCatalogSnapshot(await listServicesFromDatabase());
  }

  serviceCatalogSeeded = true;
};

const loadServiceCatalog = async () => {
  await ensureServiceCatalogSeeded();
  return listPublicServicesFromDatabase();
};

const loadAdminServiceCatalog = async () => {
  await ensureServiceCatalogSeeded();
  return listServicesFromDatabase();
};

const normalizeFormatStyle = (value) =>
  allowedFormatStyles.has(String(value || '').trim().toLowerCase())
    ? String(value).trim().toLowerCase()
    : 'plain';

const sanitizeNotificationAttachment = (attachment) => {
  if (!attachment?.url) {
    return undefined;
  }

  return {
    url: String(attachment.url),
    kind: String(attachment.kind || 'file'),
    name: String(attachment.name || 'attachment'),
    mimeType: String(attachment.mimeType || 'application/octet-stream')
  };
};

const escapeTelegramHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const formatTelegramNotification = ({ title, message, type = 'info', formatStyle = 'plain' }) => {
  const prefix = type === 'success' ? '✅' : type === 'error' ? '⚠️' : '🔔';
  const safeTitle = escapeTelegramHtml(title || 'DINK Pay');
  const safeMessage = escapeTelegramHtml(message || '');
  const normalizedStyle = normalizeFormatStyle(formatStyle);

  if (normalizedStyle === 'bold') {
    return `<b>${prefix} ${safeTitle}</b>\n\n<b>${safeMessage}</b>`;
  }

  if (normalizedStyle === 'italic') {
    return `<b>${prefix} ${safeTitle}</b>\n\n<i>${safeMessage}</i>`;
  }

  if (normalizedStyle === 'code') {
    return `<b>${prefix} ${safeTitle}</b>\n\n<pre>${safeMessage}</pre>`;
  }

  return `<b>${prefix} ${safeTitle}</b>\n\n${safeMessage}`;
};

const detectAttachmentKind = (mimeType = '', fileName = '') => {
  const normalizedMime = String(mimeType || '').toLowerCase();
  const normalizedName = String(fileName || '').toLowerCase();

  if (normalizedMime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(normalizedName)) {
    return 'photo';
  }

  if (normalizedMime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/.test(normalizedName)) {
    return 'audio';
  }

  return 'file';
};

const saveAdminAttachment = ({ attachment, baseUrl }) => {
  if (!attachment?.dataUrl) {
    return undefined;
  }

  const match = String(attachment.dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Attachment format is invalid');
  }

  const mimeType = String(attachment.mimeType || match[1] || 'application/octet-stream');
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length) {
    throw new Error('Attachment is empty');
  }

  if (buffer.length > 8 * 1024 * 1024) {
    throw new Error('Attachment must be smaller than 8 MB');
  }

  const originalName = String(attachment.name || 'attachment').trim() || 'attachment';
  const safeBaseName = originalName.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const extension = path.extname(safeBaseName) || (mimeType.includes('/') ? `.${mimeType.split('/')[1].replace(/[^a-z0-9]+/gi, '')}` : '');
  const finalName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${extension || ''}`;
  const uploadDir = path.join(UPLOADS_DIR, 'admin');

  fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, finalName);
  fs.writeFileSync(filePath, buffer);

  const relativeUrl = `/uploads/admin/${finalName}`;
  return {
    url: `${baseUrl.replace(/\/$/, '')}${relativeUrl}`,
    relativeUrl,
    path: filePath,
    kind: detectAttachmentKind(mimeType, originalName),
    name: safeBaseName,
    mimeType
  };
};

const sendTelegramBotMessage = async ({
  telegramId,
  title,
  message,
  type = 'info',
  formatStyle = 'plain',
  attachment
}) => {
  if (!TELEGRAM_BOT_TOKEN || !telegramId || !title || !message) {
    return false;
  }

  try {
    const formattedMessage = formatTelegramNotification({ title, message, type, formatStyle });
    let response;

    if (attachment?.kind && (attachment?.path || attachment?.url)) {
      const form = new FormData();
      const method =
        attachment.kind === 'photo'
          ? 'sendPhoto'
          : attachment.kind === 'audio'
            ? 'sendAudio'
            : 'sendDocument';
      const field =
        attachment.kind === 'photo'
          ? 'photo'
          : attachment.kind === 'audio'
            ? 'audio'
            : 'document';

      form.set('chat_id', String(telegramId));
      if (attachment.path && fs.existsSync(attachment.path)) {
        const fileBuffer = fs.readFileSync(attachment.path);
        form.set(
          field,
          new Blob([fileBuffer], { type: attachment.mimeType || 'application/octet-stream' }),
          attachment.name || 'attachment'
        );
      } else if (attachment.url) {
        form.set(field, attachment.url);
      }
      form.set('caption', formattedMessage);
      form.set('parse_mode', 'HTML');

      response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
        method: 'POST',
        body: form
      });
    } else {
      response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: String(telegramId),
          text: formattedMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
    }

    return response.ok;
  } catch (error) {
    console.error('Telegram send error:', error);
    return false;
  }
};

const notifyAdminPaidOrder = async (order, source = 'payment') => {
  if (!ORDER_ALERT_ADMIN_TELEGRAM_ID || !order) {
    return false;
  }

  const customerName = order.user?.fullName || 'Unknown customer';
  const serviceName = order.service?.name || 'Unknown service';
  const planName = order.plan?.name || 'Plan not set';
  const amount = `${Number(order.totalAmount || order.plan?.price || 0).toLocaleString()} ETB`;
  const orderRef = order.orderId || 'No order id';
  const txRef = order.transactionId || 'No tx ref';
  const paidAt = order.paidAt ? new Date(order.paidAt).toLocaleString('en-US', { hour12: true }) : 'Just now';
  const sourceLabel = source === 'admin' ? 'Marked paid by admin' : 'Paid via Chapa';

  return sendTelegramBotMessage({
    telegramId: ORDER_ALERT_ADMIN_TELEGRAM_ID,
    title: 'Paid order received',
    message: `${sourceLabel}\nCustomer: ${customerName}\nService: ${serviceName}\nPlan: ${planName}\nAmount: ${amount}\nOrder ID: ${orderRef}\nTransaction: ${txRef}\nPaid at: ${paidAt}\nPlease deliver the service.`,
    type: 'success',
    formatStyle: 'bold'
  });
};

const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  formatStyle = 'plain',
  attachment
}) => {
  if (!userId) return null;

  const storedAttachment = sanitizeNotificationAttachment(attachment);
  const normalizedStyle = normalizeFormatStyle(formatStyle);

  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    formatStyle: normalizedStyle,
    ...(storedAttachment ? { attachment: storedAttachment } : {}),
    read: false
  });

  const recipient = ENABLE_DIRECT_TELEGRAM_PUSH
    ? await User.findById(userId).select('telegramId isBotBanned botStartRequired').lean()
    : null;
  if (recipient?.telegramId && !recipient.isBotBanned && !recipient.botStartRequired) {
    await sendTelegramBotMessage({
      telegramId: recipient.telegramId,
      title,
      message,
      type,
      formatStyle: normalizedStyle,
      attachment
    });
  }

  return notification;
};

const createBulkNotifications = async ({
  userIds,
  title,
  message,
  type = 'info',
  formatStyle = 'plain',
  attachment
}) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return;
  }

  const storedAttachment = sanitizeNotificationAttachment(attachment);
  const normalizedStyle = normalizeFormatStyle(formatStyle);

  await Notification.insertMany(
    userIds.map((userId) => ({
      userId,
      title,
      message,
      type,
      formatStyle: normalizedStyle,
      ...(storedAttachment ? { attachment: storedAttachment } : {}),
      read: false
    }))
  );

  if (ENABLE_DIRECT_TELEGRAM_PUSH) {
    const telegramUsers = await User.find({
      _id: { $in: userIds },
      telegramId: { $exists: true, $ne: null },
      isBotBanned: { $ne: true },
      botStartRequired: { $ne: true }
    })
      .select('telegramId')
      .lean();

    await Promise.allSettled(
      telegramUsers.map((user) =>
        sendTelegramBotMessage({
          telegramId: user.telegramId,
          title,
          message,
          type,
          formatStyle: normalizedStyle,
          attachment
        })
      )
    );
  }
};

const getPublicUser = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    telegramId: user.telegramId,
    telegramUsername: user.telegramUsername,
    referredByCode: user.referredByCode || '',
    termsAcceptedVersion: user.termsAcceptedVersion,
    termsAcceptedAt: user.termsAcceptedAt
  };
};

const serializeOrder = (order) => {
  if (!order) return null;
  const json = typeof order.toJSON === 'function' ? order.toJSON() : { ...order };
  const credentials = order.credentials instanceof Map
    ? Object.fromEntries(order.credentials.entries())
    : json.credentials || {};

  return {
    ...json,
    credentials
  };
};

const isOrderInPaymentGraceWindow = (order, now = Date.now()) => {
  if (!order || order.paymentMethod !== 'chapa' || order.paymentStatus !== 'pending') {
    return false;
  }

  const createdAt = new Date(order.createdAt).getTime();
  if (!Number.isFinite(createdAt)) {
    return false;
  }

  return now - createdAt < CHAPA_PENDING_GRACE_MS;
};

const filterVisibleOrders = (orders = []) =>
  orders.filter((order) => !isOrderInPaymentGraceWindow(order));

const shouldSyncPaymentNow = (txRef) => {
  const lastSyncedAt = paymentSyncCache.get(txRef) || 0;
  if (Date.now() - lastSyncedAt < PAYMENT_SYNC_INTERVAL_MS) {
    return false;
  }

  paymentSyncCache.set(txRef, Date.now());
  return true;
};

const verifyChapaTransaction = async (txRef) => {
  if (!process.env.CHAPA_SECRET_KEY) {
    throw new Error('CHAPA_SECRET_KEY is missing');
  }

  const response = await fetch(`${CHAPA_API_BASE}/transaction/verify/${encodeURIComponent(txRef)}`, {
    headers: {
      Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to verify payment with Chapa');
  }

  return data;
};

const syncOrderPaymentStatus = async (txRef) => {
  const verification = await verifyChapaTransaction(txRef);
  const chapaData = verification?.data || {};
  const paymentState = chapaData.status || verification.status || 'pending';
  const order = await Order.findOne({ transactionId: txRef });

  if (!order) {
    return {
      success: false,
      paymentState,
      message: 'Order not found',
      verification
    };
  }

  const nextUpdate = {
    chapaStatus: paymentState,
    chapaReference: chapaData.reference || chapaData.ref_id || order.chapaReference || undefined,
    paymentVerifiedAt: new Date()
  };

  let notification;

  if (paymentState === 'success' || paymentState === 'paid') {
    const wasPaid = order.paymentStatus === 'paid';
    order.paymentStatus = 'paid';
    order.chapaStatus = 'success';
    order.paymentVerifiedAt = nextUpdate.paymentVerifiedAt;
    order.paidAt = order.paidAt || new Date();
    order.chapaReference = nextUpdate.chapaReference || order.chapaReference;

    await order.save();

    if (!wasPaid) {
      notification = await createNotification({
        userId: order.userId,
        title: 'Payment received',
        message: `We have confirmed your payment for ${order.service?.name || 'your order'}. Admin will now process it.`,
        type: 'success'
      });
      await notifyAdminPaidOrder(order, 'chapa');
    }
  } else if (paymentState === 'failed') {
    const wasFailed = order.paymentStatus === 'failed';
    order.paymentStatus = 'failed';
    order.chapaStatus = 'failed';
    order.paymentVerifiedAt = nextUpdate.paymentVerifiedAt;
    order.chapaReference = nextUpdate.chapaReference || order.chapaReference;

    await order.save();

    if (!wasFailed) {
      notification = await createNotification({
        userId: order.userId,
        title: 'Payment failed',
        message: `Your payment for ${order.service?.name || 'your order'} was not completed. Please try again.`,
        type: 'error'
      });
    }
  } else {
    order.chapaStatus = paymentState;
    order.paymentVerifiedAt = nextUpdate.paymentVerifiedAt;
    order.chapaReference = nextUpdate.chapaReference || order.chapaReference;
    await order.save();
  }

  return {
    success: true,
    order,
    notification,
    paymentState,
    verification
  };
};

const syncPendingChapaOrders = async (filter = {}) => {
  const pendingOrders = await Order.find({
    paymentMethod: 'chapa',
    paymentStatus: 'pending',
    transactionId: { $exists: true, $ne: null },
    status: { $ne: 'cancelled' },
    ...filter
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('transactionId');

  await Promise.allSettled(
    pendingOrders
      .filter((order) => shouldSyncPaymentNow(order.transactionId))
      .map((order) => syncOrderPaymentStatus(order.transactionId))
  );
};

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DINK Pay API is running',
    status: 'online',
    endpoints: {
      register: '/api/auth/register',
      login: '/api/auth/login',
      checkout: '/api/orders/checkout',
      userOrders: '/api/orders/user',
      notifications: '/api/notifications',
      admin: '/admin'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend is working' });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = req.body;
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!isValidEmailAddress(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (!isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number like +2519XXXXXXXX' });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: normalizedPhone }]
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      phone: normalizedPhone,
      password: hashPassword(password)
    });

    await createNotification({
      userId: user._id,
      title: 'Welcome to DINK Pay',
      message: 'Your account is ready. Pick a service, pay through Chapa, and we will handle the rest.',
      type: 'success'
    });

    res.json({
      success: true,
      user: await getPublicUser(user._id),
      token: createUserToken(user._id)
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.password.includes(':')) {
      user.password = hashPassword(password);
      await user.save();
    }

    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      user: {
        ...(await getPublicUser(user._id)),
        orders: orders.map(serializeOrder)
      },
      token: createUserToken(user._id)
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/telegram', async (req, res, next) => {
  try {
    const { telegramId, firstName, lastName, username, startParam } = req.body;
    const normalizedTelegramId = normalizeTelegramId(telegramId);

    if (!normalizedTelegramId) {
      return res.status(400).json({ success: false, message: 'Telegram user is required' });
    }

    const accessBlock = await getTelegramAccessBlock(normalizedTelegramId);
    if (accessBlock?.telegramId) {
      return res.status(403).json({
        success: false,
        message:
          accessBlock.status === 'deleted'
            ? 'This Telegram account was removed from DINK Pay. Contact admin if you need access again.'
            : accessBlock.reason || 'This Telegram account is blocked from using DINK Pay right now.'
      });
    }

    const existingSession = startParam
      ? await upsertBotSession({
          telegramId: normalizedTelegramId,
          telegramUsername: username,
          firstName,
          lastName,
          startParam
        })
      : await BotSession.findOne({ telegramId: normalizedTelegramId }).lean();
    const explicitReferralCode = extractReferralCode(startParam);
    let user = await User.findOne({ telegramId: normalizedTelegramId });
    const providedFullName = `${firstName || ''} ${lastName || ''}`.trim();
    const normalizedUsername = String(username || '').trim();

    if (!user) {
      user = await User.create({
        fullName: providedFullName || `Telegram User ${normalizedTelegramId}`,
        email: `cust${String(normalizedTelegramId).replace(/\D/g, '')}@gmail.com`,
        phone: `tg-${normalizedTelegramId}`,
        password: hashPassword(crypto.randomBytes(12).toString('hex')),
        telegramId: normalizedTelegramId,
        telegramUsername: normalizedUsername || undefined,
        ...(existingSession?.startedAt ? { botStartedAt: existingSession.startedAt } : {})
      });

      await createNotification({
        userId: user._id,
        title: 'Welcome to DINK Pay',
        message: 'You are signed in with Telegram. Complete payments in Chapa and we will notify you here.',
        type: 'success'
      });
    } else {
      let changed = false;

      if (providedFullName && user.fullName !== providedFullName) {
        user.fullName = providedFullName;
        changed = true;
      }

      if (normalizedUsername && user.telegramUsername !== normalizedUsername) {
        user.telegramUsername = normalizedUsername;
        changed = true;
      }

      if (!user.botStartedAt && existingSession?.startedAt) {
        user.botStartedAt = existingSession.startedAt;
        changed = true;
      }

      if (changed) {
        await user.save();
      }
    }

    const referralCandidate =
      explicitReferralCode ||
      extractReferralCode(existingSession?.referralCode || existingSession?.startParam || '');
    await applyReferralCodeToUser(user, referralCandidate);

    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      user: {
        ...(await getPublicUser(user._id)),
        orders: orders.map(serializeOrder)
      },
      token: createUserToken(user._id)
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/user/terms', requireUser, async (req, res, next) => {
  try {
    const accepted = req.body?.accepted === true;
    const version = String(req.body?.version || CURRENT_TERMS_VERSION).trim().toLowerCase() || CURRENT_TERMS_VERSION;

    if (!accepted) {
      return res.status(400).json({ success: false, message: 'You must accept the terms to continue' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.termsAcceptedVersion = version;
    user.termsAcceptedAt = new Date();
    await user.save();

    res.json({
      success: true,
      user: await getPublicUser(user._id)
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/user/profile', requireUser, async (req, res, next) => {
  try {
    const nextFullName = String(req.body?.fullName || '').trim();
    const nextEmail = String(req.body?.email || '').trim().toLowerCase();
    const nextPhone = normalizePhoneNumber(req.body?.phone || '');
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!nextFullName || !nextEmail) {
      return res.status(400).json({ success: false, message: 'Username and email are required' });
    }

    if (!isValidEmailAddress(nextEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (!isValidPhoneNumber(nextPhone, { allowBlank: true })) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number like +2519XXXXXXXX' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existingUser = await User.findOne({
      _id: { $ne: user._id },
      email: nextEmail
    }).lean();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'That email is already in use' });
    }

    if (nextPhone) {
      const phoneOwner = await User.findOne({
        _id: { $ne: user._id },
        phone: nextPhone
      }).lean();

      if (phoneOwner) {
        return res.status(400).json({ success: false, message: 'That phone number is already in use' });
      }
    }

    user.fullName = nextFullName;
    user.email = nextEmail;
    user.phone = nextPhone || undefined;

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }

      if (!user.telegramId && !verifyPassword(currentPassword, user.password)) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      user.password = hashPassword(newPassword);
    }

    await user.save();
    await Order.updateMany(
      { userId: user._id },
      {
        $set: {
          'user.fullName': user.fullName,
          'user.email': user.email,
          'user.phone': user.phone
        }
      }
    );

    res.json({
      success: true,
      user: await getPublicUser(user._id)
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders/checkout', requireUser, async (req, res, next) => {
  try {
    const { service, plan, credentials = {}, returnMode } = req.body;

    if (!service?.name || !plan?.name || !plan?.price) {
      return res.status(400).json({ success: false, message: 'Service and plan are required' });
    }

    const catalog = await loadServiceCatalog();
    const selectedService = catalog.find((item) => item.id === service.id);
    if (!selectedService) {
      return res.status(400).json({ success: false, message: 'Selected service was not found' });
    }

    const selectedPlan = selectedService.plans.find((item) => item.name === plan.name);
    if (!selectedPlan) {
      return res.status(400).json({ success: false, message: 'Selected plan was not found' });
    }

    if (!process.env.CHAPA_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Chapa is not configured on the server' });
    }

    const originalPlanPrice = parseMoneyValue(selectedPlan.price);
    const checkoutAmount = applyDiscountToAmount(originalPlanPrice, selectedService.discountPercent);
    if (!Number.isFinite(checkoutAmount) || checkoutAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Selected plan price is invalid' });
    }

    const orderId = generateOrderId();
    const txRef = generateTxRef();
    const { firstName, lastName } = splitFullName(req.user.fullName);
    const safeFirstName = sanitizeCheckoutText(firstName, 'Customer').slice(0, 40);
    const safeLastName = sanitizeCheckoutText(lastName || firstName, 'Customer').slice(0, 40);
    const returnUrl =
      returnMode === 'telegram-external'
        ? buildUrl(getBackendBaseUrl(req), '/api/chapa/return', { tx_ref: txRef })
        : buildUrl(getFrontendBaseUrl(req), '/', { payment: 'return', tx_ref: txRef });
    const checkoutPayload = {
      amount: checkoutAmount.toFixed(2),
      currency: 'ETB',
      email: getSafeCheckoutEmail(req.user),
      first_name: safeFirstName,
      last_name: safeLastName,
      tx_ref: txRef,
      callback_url: buildUrl(getBackendBaseUrl(req), '/api/chapa/callback', { tx_ref: txRef }),
      return_url: returnUrl,
      customization: {
        title: 'DINK Pay',
        description: 'Secure ETB checkout'
      }
    };

    const chapaResponse = await fetch(`${CHAPA_API_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutPayload)
    });

    const rawChapaBody = await chapaResponse.text();
    let chapaData = {};

    try {
      chapaData = rawChapaBody ? JSON.parse(rawChapaBody) : {};
    } catch (error) {
      chapaData = { message: rawChapaBody || '' };
    }

    if (!chapaResponse.ok || chapaData?.status !== 'success') {
      console.error('Chapa initialization failed', {
        status: chapaResponse.status,
        response: chapaData,
        serviceId: selectedService.id,
        planName: selectedPlan.name,
        amount: checkoutPayload.amount
      });

      return res.status(400).json({
        success: false,
        message: extractChapaErrorMessage(chapaData, 'Unable to start Chapa checkout')
      });
    }

    const order = await Order.create({
      orderId,
      userId: req.user._id,
      user: {
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone
      },
      service: {
        id: selectedService.id,
        name: selectedService.name,
        icon: selectedService.icon,
        fallback: selectedService.fallback,
        color: selectedService.color,
        discountPercent: normalizeDiscountPercent(selectedService.discountPercent, 0)
      },
      plan: {
        name: selectedPlan.name,
        price: checkoutAmount,
        originalPrice: originalPlanPrice
      },
      credentials,
      totalAmount: checkoutAmount,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'chapa',
      transactionId: txRef,
      checkoutUrl: chapaData?.data?.checkout_url,
      chapaStatus: 'pending',
      chapaReference: chapaData?.data?.reference || chapaData?.data?.ref_id
    });

    res.json({
      success: true,
      order: serializeOrder(order),
      checkoutUrl: chapaData?.data?.checkout_url,
      tx_ref: txRef
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders/create', requireUser, async (req, res, next) => {
  try {
    const { service, plan, credentials = {}, totalAmount } = req.body;

    if (!service?.name || !plan?.name) {
      return res.status(400).json({ success: false, message: 'Service and plan are required' });
    }

    const catalog = await loadServiceCatalog();
    const selectedService = catalog.find((item) => item.id === service.id);
    const selectedPlan = selectedService?.plans.find((item) => item.name === plan.name);
    if (!selectedService || !selectedPlan) {
      return res.status(400).json({ success: false, message: 'Selected service or plan was not found' });
    }

    const selectedPlanPrice = parseMoneyValue(selectedPlan.price);
    const discountedPlanPrice = applyDiscountToAmount(selectedPlanPrice, selectedService.discountPercent);
    const orderAmount = discountedPlanPrice;

    const order = await Order.create({
      orderId: generateOrderId(),
      userId: req.user._id,
      user: {
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone
      },
      service: {
        id: selectedService.id,
        name: selectedService.name,
        icon: selectedService.icon,
        fallback: selectedService.fallback,
        color: selectedService.color,
        discountPercent: normalizeDiscountPercent(selectedService.discountPercent, 0)
      },
      plan: {
        name: selectedPlan.name,
        price: Number.isFinite(discountedPlanPrice) ? discountedPlanPrice : 0,
        originalPrice: Number.isFinite(selectedPlanPrice) ? selectedPlanPrice : 0
      },
      credentials,
      totalAmount: Number.isFinite(orderAmount) ? orderAmount : 0,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'manual'
    });

    await createNotification({
      userId: req.user._id,
      title: 'Order created',
      message: `Your ${service.name} order has been created.`,
      type: 'info'
    });

    res.json({ success: true, order: serializeOrder(order) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/orders/user', requireUser, async (req, res, next) => {
  try {
    await syncPendingChapaOrders({ userId: req.user._id });
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders: filterVisibleOrders(orders).map(serializeOrder) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/services', async (req, res, next) => {
  try {
    res.json({ success: true, services: await loadServiceCatalog() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/referrals/me', requireUser, async (req, res, next) => {
  try {
    const [campaign, profile] = await Promise.all([
      getReferralCampaign(),
      ReferralProfile.findOne({ userId: req.user._id }).lean()
    ]);
    const campaignState = serializeReferralCampaign(campaign);
    const referralState = buildReferralStateForUser(req.user, campaignState, profile);
    const leaderboard = await getReferralLeaderboard(campaignState, { includeUserId: req.user._id, limit: 5 });

    res.json({
      success: true,
      referral: {
        campaign: campaignState,
        progress: {
          invites: referralState.inviteCount,
          targetInvites: referralState.targetInvites
        },
        earnings: {
          earnings: referralState.earnings,
          successfulOrders: referralState.successfulOrders,
          points: referralState.points,
          commissionPercent: referralState.commissionPercent
        },
        referralCode: referralState.referralCode,
        referralLink: referralState.referralLink,
        history: referralState.history,
        leaderboard
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/referrals/apply', requireUser, async (req, res, next) => {
  try {
    const code = extractReferralCode(req.body?.code || req.body?.referralCode || '');
    if (!code) {
      return res.status(400).json({ success: false, message: 'Referral code is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const result = await applyReferralCodeToUser(
      user,
      code,
      String(req.body?.source || 'Mini app referral link').trim() || 'Mini app referral link'
    );

    const [campaign, profile] = await Promise.all([
      getReferralCampaign(),
      ReferralProfile.findOne({ userId: user._id }).lean()
    ]);

    res.json({
      success: true,
      applied: Boolean(result.applied),
      referral: buildReferralStateForUser(user, serializeReferralCampaign(campaign), profile)
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/notifications', requireUser, async (req, res, next) => {
  try {
    await syncPendingChapaOrders({ userId: req.user._id });
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
});

app.put('/api/notifications/:id/read', requireUser, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
});

app.put('/api/notifications/read-all', requireUser, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/chapa/verify/:txRef', async (req, res, next) => {
  try {
    const result = await syncOrderPaymentStatus(req.params.txRef);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
        paymentState: result.paymentState
      });
    }

    const paid = result.order?.paymentStatus === 'paid';

    res.json({
      success: paid,
      paymentState: result.paymentState,
      order: serializeOrder(result.order),
      verification: result.verification
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/chapa/callback', async (req, res, next) => {
  try {
    const txRef = req.query.tx_ref || req.query.trx_ref;

    if (!txRef) {
      return res.status(400).json({ success: false, message: 'Missing tx_ref' });
    }

    const result = await syncOrderPaymentStatus(String(txRef));
    res.json({
      success: result.success,
      paymentState: result.paymentState,
      order: serializeOrder(result.order)
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/chapa/return', async (req, res) => {
  const txRef = String(req.query.tx_ref || req.query.trx_ref || '').trim();

  if (txRef) {
    try {
      await syncOrderPaymentStatus(txRef);
    } catch (error) {
      console.error('Chapa return sync error:', error);
    }
  }

  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DINK Pay</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Arial, sans-serif;
        background: linear-gradient(180deg, #07111f 0%, #0d1a2d 50%, #091322 100%);
        color: #f4f8ff;
        padding: 24px;
      }
      .card {
        width: min(440px, 100%);
        border-radius: 24px;
        padding: 28px;
        background: rgba(7, 20, 39, 0.84);
        border: 1px solid rgba(149, 255, 196, 0.18);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
        text-align: center;
      }
      .title {
        margin: 0 0 12px;
        font-size: 28px;
        font-weight: 700;
      }
      .copy {
        margin: 0;
        color: rgba(244, 248, 255, 0.72);
        line-height: 1.6;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-top: 22px;
        padding: 14px 18px;
        border-radius: 999px;
        border: 0;
        background: linear-gradient(135deg, #7dffb4, #2ce277);
        color: #091322;
        font-weight: 700;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1 class="title">Payment submitted</h1>
      <p class="copy">You can close this page and return to the original DINK Pay mini app. Your payment status will update there automatically.</p>
      <button class="button" onclick="window.close()">Close page</button>
    </main>
  </body>
</html>`);
});

app.post('/api/chapa/webhook', async (req, res, next) => {
  try {
    const txRef = req.body?.tx_ref || req.body?.trx_ref;
    if (txRef) {
      await syncOrderPaymentStatus(String(txRef));
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  const token = createAdminSession();
  res.json({
    success: true,
    token,
    admin: {
      username: ADMIN_USERNAME
    }
  });
});

app.post('/api/admin/auth/logout', requireAdmin, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    adminSessions.delete(token);
  }

  res.json({ success: true });
});

app.get('/api/admin/users', requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select(
        'fullName email phone telegramId telegramUsername botStartedAt botStartRequired isBotBanned botBanReason botBannedAt createdAt'
      )
      .lean();
    res.json({ success: true, users: users.map(serializeAdminUser) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/users/:id/profile', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer id' });
    }

    const user = await User.findById(req.params.id)
      .select(
        'fullName email phone telegramId telegramUsername botStartedAt botStartRequired isBotBanned botBanReason botBannedAt createdAt'
      );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await syncPendingChapaOrders({ userId: user._id });

    const orders = filterVisibleOrders(
      await Order.find({ userId: user._id }).sort({ createdAt: -1 }).lean()
    ).map(serializeOrder);

    const paidOrders = orders.filter((order) => order.paymentStatus === 'paid').length;
    const totalSpent = orders
      .filter((order) => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    res.json({
      success: true,
      profile: {
        user: serializeAdminUser(user),
        orders,
        stats: {
          totalOrders: orders.length,
          paidOrders,
          activeOrders: orders.filter((order) => order.paymentStatus === 'paid' && !['completed', 'cancelled'].includes(order.status)).length,
          totalSpent
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer id' });
    }

    const user = await User.findById(req.params.id)
      .select('telegramId fullName email')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const deleteReason = String(req.body?.reason || 'Removed by admin').trim() || 'Removed by admin';

    await Promise.all([
      Order.deleteMany({ userId: user._id }),
      Notification.deleteMany({ userId: user._id }),
      ReferralProfile.deleteOne({ userId: user._id }),
      user.telegramId ? BotSession.deleteOne({ telegramId: user.telegramId }) : Promise.resolve()
    ]);

    if (user.telegramId) {
      await saveTelegramAccessBlock({
        telegramId: user.telegramId,
        status: 'deleted',
        reason: deleteReason
      });
    }

    await User.deleteOne({ _id: user._id });

    res.json({
      success: true,
      message: `${user.fullName || user.email || 'Customer'} was removed from DINK Pay.`
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/users/:id/access', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer id' });
    }

    const action = String(req.body?.action || '').trim().toLowerCase();
    const reason = String(req.body?.reason || '').trim();
    const user = await User.findById(req.params.id).select(
      'fullName email phone telegramId telegramUsername botStartedAt botStartRequired isBotBanned botBanReason botBannedAt createdAt'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (!['ban', 'unban', 'clear_start'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Unsupported bot access action' });
    }

    if (!user.telegramId) {
      return res.status(400).json({ success: false, message: 'This customer is not linked to Telegram yet' });
    }

    let responseMessage = 'Customer access updated.';

    if (action === 'ban') {
      user.isBotBanned = true;
      user.botBanReason = reason || 'Blocked by admin';
      user.botBannedAt = new Date();
      await saveTelegramAccessBlock({
        telegramId: user.telegramId,
        status: 'banned',
        reason: user.botBanReason
      });
      responseMessage = 'Customer is now banned from using the bot.';
    }

    if (action === 'unban') {
      user.isBotBanned = false;
      user.botBanReason = undefined;
      user.botBannedAt = undefined;
      await clearTelegramAccessBlock(user.telegramId);
      responseMessage = 'Customer can use the bot again.';
    }

    if (action === 'clear_start') {
      user.botStartRequired = true;
      user.botStartedAt = undefined;
      await BotSession.deleteOne({ telegramId: user.telegramId });
      responseMessage = 'Bot start was cleared. The customer must send /start again.';
    }

    await user.save();

    res.json({
      success: true,
      message: responseMessage,
      user: serializeAdminUser(user)
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/referrals', requireAdmin, async (req, res, next) => {
  try {
    const [campaign, users, profiles] = await Promise.all([
      getReferralCampaign(),
      User.find()
        .sort({ createdAt: -1 })
        .select('fullName email phone telegramId telegramUsername createdAt')
        .lean(),
      ReferralProfile.find().lean()
    ]);

    const campaignState = serializeReferralCampaign(campaign);
    const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
    const referralUsers = users
      .map((user) => serializeReferralUserForAdmin(user, campaignState, profileMap.get(String(user._id))))
      .sort((left, right) => {
        if (right.points !== left.points) {
          return right.points - left.points;
        }
        if (right.inviteCount !== left.inviteCount) {
          return right.inviteCount - left.inviteCount;
        }
        return left.fullName.localeCompare(right.fullName);
      });

    const stats = referralUsers.reduce(
      (summary, user) => ({
        totalUsers: summary.totalUsers + 1,
        totalPoints: summary.totalPoints + Number(user.points || 0),
        totalInvites: summary.totalInvites + Number(user.inviteCount || 0),
        totalEarnings: summary.totalEarnings + Number(user.earnings || 0)
      }),
      {
        totalUsers: 0,
        totalPoints: 0,
        totalInvites: 0,
        totalEarnings: 0
      }
    );

    res.json({
      success: true,
      campaign: campaignState,
      users: referralUsers,
      leaderboard: referralUsers.slice(0, 5).map((user, index) => ({
        badge: `#${index + 1}`,
        userId: user.userId,
        name: user.fullName,
        invites: user.inviteCount,
        points: user.points,
        earnings: user.earnings
      })),
      stats: {
        ...stats,
        averageCommissionPercent:
          referralUsers.length > 0
            ? Math.round(
                (referralUsers.reduce((sum, user) => sum + Number(user.commissionPercent || 0), 0) /
                  referralUsers.length) *
                  100
              ) / 100
            : campaignState.commissionPercent
      }
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/referrals/campaign', requireAdmin, async (req, res, next) => {
  try {
    const campaign = await getReferralCampaign();

    if (typeof req.body?.title === 'string') {
      campaign.title = req.body.title.trim() || campaign.title;
    }

    if (typeof req.body?.description === 'string') {
      campaign.description = req.body.description.trim() || campaign.description;
    }

    if (req.body?.endsAt) {
      const nextEndDate = new Date(req.body.endsAt);
      if (Number.isNaN(nextEndDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid campaign end date' });
      }
      campaign.endsAt = nextEndDate;
    }

    if (req.body?.commissionPercent !== undefined) {
      campaign.commissionPercent = normalizeDiscountPercent(req.body.commissionPercent, 5);
    }

    if (req.body?.targetInvites !== undefined) {
      campaign.targetInvites = normalizeCountValue(req.body.targetInvites, 50) || 50;
    }

    if (req.body?.minimumPrizeInvites !== undefined) {
      campaign.minimumPrizeInvites = normalizeCountValue(req.body.minimumPrizeInvites, 50) || 50;
    }

    if (req.body?.active !== undefined) {
      campaign.active = normalizeBoolean(req.body.active);
    }

    if (typeof req.body?.shareBaseUrl === 'string') {
      campaign.shareBaseUrl = req.body.shareBaseUrl.trim() || 'https://t.me/DinkPaymentBot';
    }

    if (typeof req.body?.shareMessage === 'string') {
      campaign.shareMessage =
        req.body.shareMessage.trim() || 'Join the DINK Pay Referral Campaign and start inviting today.';
    }

    if (req.body?.prizes !== undefined) {
      campaign.prizes = sanitizeReferralPrizeList(req.body.prizes);
    }

    await campaign.save();

    res.json({
      success: true,
      campaign: serializeReferralCampaign(campaign)
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/referrals/users/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer id' });
    }

    const user = await User.findById(req.params.id)
      .select('fullName email phone telegramId telegramUsername createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const campaign = await getReferralCampaign();
    const profile = await ReferralProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          points: normalizeCountValue(req.body?.points, 0),
          inviteCount: normalizeCountValue(req.body?.inviteCount, 0),
          targetInvites: normalizeCountValue(req.body?.targetInvites, 0),
          successfulOrders: normalizeCountValue(req.body?.successfulOrders, 0),
          earnings: Number.isFinite(Number(req.body?.earnings)) ? Math.max(0, Number(req.body.earnings)) : 0,
          commissionPercentOverride: normalizeOptionalPercent(req.body?.commissionPercentOverride, null),
          referralCode: String(req.body?.referralCode || '').trim(),
          notes: String(req.body?.notes || '').trim(),
          history: sanitizeReferralHistory(req.body?.history)
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    ).lean();

    res.json({
      success: true,
      user: serializeReferralUserForAdmin(user, serializeReferralCampaign(campaign), profile)
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/referrals/data', requireAdmin, async (req, res, next) => {
  try {
    await ReferralProfile.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/referrals/users/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer id' });
    }

    await ReferralProfile.findOneAndDelete({ userId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/services', requireAdmin, async (req, res, next) => {
  try {
    res.json({ success: true, services: await loadAdminServiceCatalog() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/services', requireAdmin, async (req, res, next) => {
  try {
    await ensureServiceCatalogSeeded();
    const service = sanitizeServicePayload(req.body);

    const existing = await Service.findOne({ id: service.id }).select('_id').lean();
    if (existing) {
      return res.status(400).json({ success: false, message: 'A service with that id already exists' });
    }

    const created = await Service.create(service);
    persistServiceCatalogSnapshot(await listServicesFromDatabase());
    res.json({ success: true, service: sanitizeServicePayload(created.toJSON()) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Invalid service payload' });
  }
});

app.put('/api/admin/services/:serviceId', requireAdmin, async (req, res, next) => {
  try {
    await ensureServiceCatalogSeeded();
    const existing = await Service.findOne({ id: req.params.serviceId });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const service = sanitizeServicePayload(req.body);
    const duplicate = await Service.findOne({
      id: service.id,
      _id: { $ne: existing._id }
    })
      .select('_id')
      .lean();

    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Another service already uses that id' });
    }

    Object.assign(existing, service);
    await existing.save();
    persistServiceCatalogSnapshot(await listServicesFromDatabase());
    res.json({ success: true, service: sanitizeServicePayload(existing.toJSON()) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Invalid service payload' });
  }
});

app.delete('/api/admin/services/:serviceId', requireAdmin, async (req, res, next) => {
  try {
    await ensureServiceCatalogSeeded();
    const deleted = await Service.findOneAndDelete({ id: req.params.serviceId }).lean();
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    persistServiceCatalogSnapshot(await listServicesFromDatabase());
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/orders', requireAdmin, async (req, res, next) => {
  try {
    await syncPendingChapaOrders();
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const liveUsers = await User.find({
      _id: {
        $in: [
          ...new Set(
            orders
              .map((order) => String(order.userId || '').trim())
              .filter((userId) => mongoose.Types.ObjectId.isValid(userId))
          )
        ]
      }
    })
      .select('fullName email phone')
      .lean();
    const liveUserMap = new Map(liveUsers.map((user) => [String(user._id), user]));

    const hydratedOrders = await Promise.all(
      orders.map(async (order) => {
        if (order.userId) {
          const liveUser = liveUserMap.get(String(order.userId));
          if (!liveUser) {
            return null;
          }

          order.user = {
            fullName: liveUser.fullName,
            email: liveUser.email,
            phone: liveUser.phone
          };
        }

        return serializeOrder(order);
      })
    );

    res.json({ success: true, orders: filterVisibleOrders(hydratedOrders.filter(Boolean)) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/orders/:id', requireAdmin, async (req, res, next) => {
  try {
    const { status, paymentStatus, adminNote, user, service, plan, totalAmount, credentials } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;

    if (status) {
      if (!allowedOrderStatuses.has(status)) {
        return res.status(400).json({ success: false, message: 'Invalid order status' });
      }
      order.status = status;
      if (status === 'completed') {
        order.completedAt = new Date();
      }
    }

    if (paymentStatus) {
      if (!allowedPaymentStatuses.has(paymentStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid payment status' });
      }
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        order.paidAt = order.paidAt || new Date();
        order.chapaStatus = 'success';
      } else {
        order.chapaStatus = paymentStatus === 'failed' ? 'failed' : paymentStatus;
        order.paidAt = undefined;
      }
    }

    if (typeof adminNote === 'string') {
      order.adminNote = adminNote.trim();
    }

    if (user && typeof user === 'object') {
      order.user = {
        ...order.user,
        ...(typeof user.fullName === 'string' ? { fullName: user.fullName.trim() || order.user?.fullName } : {}),
        ...(typeof user.email === 'string' ? { email: user.email.trim() || order.user?.email } : {}),
        ...(typeof user.phone === 'string' ? { phone: user.phone.trim() || order.user?.phone } : {})
      };
    }

    if (service && typeof service === 'object') {
      order.service = {
        ...order.service,
        ...(typeof service.name === 'string' ? { name: service.name.trim() || order.service?.name } : {}),
        ...(typeof service.icon === 'string' ? { icon: service.icon.trim() || order.service?.icon } : {}),
        ...(typeof service.fallback === 'string' ? { fallback: service.fallback.trim() || order.service?.fallback } : {}),
        ...(typeof service.color === 'string' ? { color: service.color.trim() || order.service?.color } : {})
      };
    }

    if (plan && typeof plan === 'object') {
      const nextPlanPrice = parseMoneyValue(plan.price);
      order.plan = {
        ...order.plan,
        ...(typeof plan.name === 'string' ? { name: plan.name.trim() || order.plan?.name } : {}),
        ...(Number.isFinite(nextPlanPrice) ? { price: nextPlanPrice } : {})
      };
    }

    const nextTotalAmount = parseMoneyValue(totalAmount);
    if (Number.isFinite(nextTotalAmount) && nextTotalAmount >= 0) {
      order.totalAmount = nextTotalAmount;
    }

    if (credentials && typeof credentials === 'object' && !Array.isArray(credentials)) {
      order.credentials = Object.fromEntries(
        Object.entries(credentials).map(([key, value]) => [key, String(value ?? '').trim()])
      );
    }

    await order.save();

    const messages = [];
    let notificationType = 'info';

    if (paymentStatus && paymentStatus !== previousPaymentStatus) {
      if (paymentStatus === 'paid') {
        messages.push(`Your payment for ${order.service?.name || 'your order'} has been marked as paid.`);
        notificationType = 'success';
        await notifyAdminPaidOrder(order, 'admin');
      } else if (paymentStatus === 'failed') {
        messages.push(`We could not confirm payment for ${order.service?.name || 'your order'}.`);
        notificationType = 'error';
      }
    }

    if (status && status !== previousStatus) {
      if (status === 'processing') {
        messages.push(`Admin is now processing your ${order.service?.name || 'order'}.`);
        notificationType = 'success';
      } else if (status === 'completed') {
        messages.push(`Your ${order.service?.name || 'order'} is complete.`);
        notificationType = 'success';
      } else if (status === 'cancelled') {
        messages.push(`Your ${order.service?.name || 'order'} has been cancelled.`);
        notificationType = 'error';
      } else {
        messages.push(`Your ${order.service?.name || 'order'} status is now ${status}.`);
      }
    }

    if (messages.length > 0 && order.adminNote) {
      messages.push(`Note: ${order.adminNote}`);
    }

    if (messages.length > 0) {
      await createNotification({
        userId: order.userId,
        title: 'Order updated',
        message: messages.join(' '),
        type: notificationType
      });
    }

    res.json({ success: true, order: serializeOrder(order) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/broadcast', requireAdmin, async (req, res, next) => {
  try {
    const { userId, title, message, type = 'info', formatStyle = 'plain' } = req.body;
    const attachment = saveAdminAttachment({
      attachment: req.body?.attachment,
      baseUrl: getBackendBaseUrl(req)
    });

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    if (!userId || userId === 'all') {
      const users = await User.find().select('_id').lean();
      await createBulkNotifications({
        userIds: users.map((user) => user._id),
        title,
        message,
        type,
        formatStyle,
        attachment
      });
    } else {
      await createNotification({
        userId,
        title,
        message,
        type,
        formatStyle,
        attachment
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/stats', requireAdmin, async (req, res, next) => {
  try {
    await syncPendingChapaOrders();
    const orders = filterVisibleOrders(await Order.find().lean());
    const settings = await getAdminSettings();
    const total = orders.length;
    const unpaid = orders.filter((order) => order.paymentStatus !== 'paid').length;
    const paid = orders.filter((order) => order.paymentStatus === 'paid').length;
    const processing = orders.filter((order) => order.status === 'processing').length;
    const completed = orders.filter((order) => order.status === 'completed').length;
    const users = await User.countDocuments();
    const revenue = orders
      .filter((order) => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    res.json({
      success: true,
      stats: {
        total,
        unpaid,
        paid,
        processing,
        completed,
        users,
        revenue,
        globalDiscountPercent: normalizeDiscountPercent(settings?.globalDiscountPercent, 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/settings', requireAdmin, async (req, res, next) => {
  try {
    const settings = await getAdminSettings();
    settings.globalDiscountPercent = normalizeDiscountPercent(req.body?.globalDiscountPercent, 0);
    await settings.save();

    res.json({
      success: true,
      settings: {
        globalDiscountPercent: normalizeDiscountPercent(settings.globalDiscountPercent, 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/bot/users/:telegramId/access', requireBotSync, async (req, res, next) => {
  try {
    const telegramId = normalizeTelegramId(req.params.telegramId);
    if (!telegramId) {
      return res.status(400).json({ success: false, message: 'Telegram user is required' });
    }

    const accessBlock = await getTelegramAccessBlock(telegramId);
    const user = await User.findOne({ telegramId })
      .select('telegramId botStartedAt botStartRequired isBotBanned botBanReason')
      .lean();

    res.json({
      success: true,
      access: buildBotAccessState(user, accessBlock)
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/bot/users/:telegramId/start', requireBotSync, async (req, res, next) => {
  try {
    const telegramId = normalizeTelegramId(req.params.telegramId);
    if (!telegramId) {
      return res.status(400).json({ success: false, message: 'Telegram user is required' });
    }

    const accessBlock = await getTelegramAccessBlock(telegramId);
    if (accessBlock?.telegramId) {
      return res.json({
        success: true,
        access: buildBotAccessState(null, accessBlock),
        linked: false
      });
    }

    const session = await upsertBotSession({
      telegramId,
      telegramUsername: req.body?.username,
      firstName: req.body?.firstName,
      lastName: req.body?.lastName,
      startParam: req.body?.startParam
    });

    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.json({
        success: true,
        access: {
          ...buildBotAccessState(null),
          startedAt: session?.startedAt || new Date()
        },
        linked: false
      });
    }

    let changed = false;
    const normalizedUsername = String(req.body?.username || '').trim();

    if (normalizedUsername && user.telegramUsername !== normalizedUsername) {
      user.telegramUsername = normalizedUsername;
      changed = true;
    }

    if (!user.botStartedAt || user.botStartRequired) {
      user.botStartedAt = session?.startedAt || new Date();
      changed = true;
    }

    if (user.botStartRequired) {
      user.botStartRequired = false;
      changed = true;
    }

    if (changed) {
      await user.save();
    }

    await applyReferralCodeToUser(user, session?.referralCode || req.body?.startParam, 'Telegram bot /start');

    res.json({
      success: true,
      access: buildBotAccessState(user),
      linked: true
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/bot/users/:telegramId/orders', requireBotSync, async (req, res, next) => {
  try {
    const telegramId = normalizeTelegramId(req.params.telegramId);
    if (!telegramId) {
      return res.status(400).json({ success: false, message: 'Telegram user is required' });
    }

    const accessBlock = await getTelegramAccessBlock(telegramId);
    if (accessBlock?.telegramId) {
      return res.json({ success: true, orders: [], access: buildBotAccessState(null, accessBlock) });
    }

    const user = await User.findOne({ telegramId })
      .select('_id telegramId botStartedAt botStartRequired isBotBanned botBanReason')
      .lean();
    if (!user) {
      return res.json({ success: true, orders: [] });
    }

    if (user.isBotBanned || user.botStartRequired) {
      return res.json({ success: true, orders: [], access: buildBotAccessState(user) });
    }

    await syncPendingChapaOrders({ userId: user._id });

    const limit = Math.min(Math.max(Number(req.query.limit || 8), 1), 20);
    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, orders: filterVisibleOrders(orders).map(serializeOrder), access: buildBotAccessState(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/bot/users/:telegramId/notifications', requireBotSync, async (req, res, next) => {
  try {
    const telegramId = normalizeTelegramId(req.params.telegramId);
    if (!telegramId) {
      return res.status(400).json({ success: false, message: 'Telegram user is required' });
    }

    const accessBlock = await getTelegramAccessBlock(telegramId);
    if (accessBlock?.telegramId) {
      return res.json({ success: true, notifications: [], access: buildBotAccessState(null, accessBlock) });
    }

    const user = await User.findOne({ telegramId })
      .select('_id telegramId botStartedAt botStartRequired isBotBanned botBanReason')
      .lean();
    if (!user) {
      return res.json({ success: true, notifications: [] });
    }

    if (user.isBotBanned || user.botStartRequired) {
      return res.json({ success: true, notifications: [], access: buildBotAccessState(user) });
    }

    await syncPendingChapaOrders({ userId: user._id });

    const limit = Math.min(Math.max(Number(req.query.limit || 8), 1), 20);
    const notifications = await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, notifications, access: buildBotAccessState(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(workspaceRoot, 'admin', 'index.html'));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: normalizeMessage(error.message, 'Internal server error')
  });
});

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dinkpay')
  .then(async () => {
    console.log('MongoDB connected');
    await ensureServiceCatalogSeeded();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
