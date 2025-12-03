// Lade Umgebungsvariablen aus .env Datei im Root-Verzeichnis
// Im Docker Container werden Variablen über Environment gesetzt
const path = require('path');
const rootEnvPath = path.resolve(__dirname, '..', '.env');
if (process.env.NODE_ENV !== 'production' || !process.env.DATABASE_URL) {
  require('dotenv').config({ path: rootEnvPath });
}

const express = require('express');
// cors wird nicht mehr verwendet - manuelle CORS-Implementierung
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { encryptField, decryptField } = require('./utils/encryption');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
// Prisma Client - DATABASE_URL wird automatisch aus Umgebungsvariable gelesen
const prisma = new PrismaClient();

// Backend Port wird aus .env geladen (kein Fallback, muss gesetzt sein)
const PORT = Number(process.env.BACKEND_PORT);
if (!PORT) {
  console.error('❌ BACKEND_PORT ist nicht in .env gesetzt!');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const AUTH_DISABLED =
  process.env.AUTH_DISABLED === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.AUTH_DISABLED !== 'false');
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@smartpantry.app';
const DEMO_USER_NAME = process.env.DEMO_USER_NAME || 'Demo User';
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'demo123';

// API Keys (aus Umgebungsvariablen)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || '';
// Token & Quota Configuration (MUSS in .env gesetzt werden, keine Fallbacks!)
const REFRESH_TOKEN_TTL_MS = Number(process.env.REFRESH_TOKEN_TTL_MS);
if (!REFRESH_TOKEN_TTL_MS) {
  console.error('❌ REFRESH_TOKEN_TTL_MS ist nicht in .env gesetzt!');
  process.exit(1);
}

const QUOTA_RESET_INTERVAL_MS = Number(process.env.QUOTA_RESET_INTERVAL_MS);
if (!QUOTA_RESET_INTERVAL_MS) {
  console.error('❌ QUOTA_RESET_INTERVAL_MS ist nicht in .env gesetzt!');
  process.exit(1);
}

const LLM_TOKEN_COST_CHAT = Number(process.env.LLM_TOKEN_COST_CHAT);
if (!LLM_TOKEN_COST_CHAT) {
  console.error('❌ LLM_TOKEN_COST_CHAT ist nicht in .env gesetzt!');
  process.exit(1);
}

const LLM_TOKEN_COST_TRANSLATION = Number(process.env.LLM_TOKEN_COST_TRANSLATION);
if (!LLM_TOKEN_COST_TRANSLATION) {
  console.error('❌ LLM_TOKEN_COST_TRANSLATION ist nicht in .env gesetzt!');
  process.exit(1);
}

const LLM_TOKEN_COST_ANALYZE = Number(process.env.LLM_TOKEN_COST_ANALYZE);
if (!LLM_TOKEN_COST_ANALYZE) {
  console.error('❌ LLM_TOKEN_COST_ANALYZE ist nicht in .env gesetzt!');
  process.exit(1);
}

const RECIPE_CALL_COST_ANALYZE = Number(process.env.RECIPE_CALL_COST_ANALYZE);
if (!RECIPE_CALL_COST_ANALYZE) {
  console.error('❌ RECIPE_CALL_COST_ANALYZE ist nicht in .env gesetzt!');
  process.exit(1);
}

// Initialize Gemini AI (falls API Key vorhanden)
let genAI = null;
// API Key Initialisierung (nur in Development loggen)
if (process.env.NODE_ENV !== 'production') {
  console.log('\n🔑 === API-KEY INITIALISIERUNG ===');
  console.log('GEMINI_API_KEY vorhanden:', !!GEMINI_API_KEY);
  console.log('SPOONACULAR_API_KEY vorhanden:', !!SPOONACULAR_API_KEY);
}

if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Gemini AI erfolgreich initialisiert');
    }
  } catch (error) {
    console.error('❌ Fehler bei Gemini AI Initialisierung:', error.message);
  }
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ WARNING: GEMINI_API_KEY nicht gesetzt. Foto-Analyse verwendet Stub-Daten.');
  }
}

if (process.env.NODE_ENV !== 'production') {
  console.log('================================\n');
}

if (AUTH_DISABLED) {
  console.warn(
    '⚠️  DEMO MODE AKTIV: Authentifizierung ist deaktiviert. Alle geschützten Routen verwenden den Demo-User:',
    DEMO_USER_EMAIL
  );
}

// Logging-Middleware für alle Requests (vor CORS)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    'user-agent': req.headers['user-agent']?.substring(0, 50),
  });
  next();
});

// MANUELLE CORS-Implementierung für volle Kontrolle
// cors() wird NICHT verwendet, um Konflikte zu vermeiden
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Setze CORS-Header für ALLE Requests (inkl. OPTIONS)
  // WICHTIG: Header müssen VOR dem Senden der Response gesetzt werden
  if (origin) {
    // Erlaube spezifischen Origin (für credentials: true)
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback für Requests ohne Origin
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  
  // Behandle OPTIONS Preflight-Requests explizit
  // WICHTIG: Dies muss VOR allen anderen Middlewares sein
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS Preflight Request received:', req.path, 'Origin:', origin);
    console.log('✅ Sending 204 response with CORS headers');
    return res.status(204).end(); // Explizit .end() verwenden statt sendStatus()
  }
  
  next();
});
app.use(express.json());

let demoUserCache = null;

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

async function ensureDemoUser() {
  if (demoUserCache) return demoUserCache;
  const email = normalizeEmail(DEMO_USER_EMAIL);
  let existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 10);
    existing = await prisma.user.create({
      data: {
        email,
        name: DEMO_USER_NAME,
        passwordHash,
      },
    });
  }
  demoUserCache = existing;
  return existing;
}

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueAuthTokens(user, req) {
  const accessToken = generateAccessToken(user);
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
      userAgent: req?.headers?.['user-agent'] || null,
      ipAddress: req?.ip || null,
    },
  });
  return { accessToken, refreshToken, expiresAt };
}

async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function rotateRefreshToken(oldToken, req) {
  if (!oldToken) return null;
  const tokenHash = hashToken(oldToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, revokedAt: null },
  });
  if (!stored) return null;
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return null;
  }
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) return null;
  return issueAuthTokens(user, req);
}

async function resetQuotaIfNeeded(user) {
  const now = new Date();
  const shouldResetQuota = !user.quotaResetAt || new Date(user.quotaResetAt) <= now;
  const shouldResetMonthly = !user.monthlyLimitResetAt || new Date(user.monthlyLimitResetAt) <= now;
  
  if (shouldResetQuota || shouldResetMonthly) {
    const updateData = {};
    if (shouldResetQuota) {
      updateData.llmTokensUsed = 0;
      updateData.recipeCallsUsed = 0;
      updateData.quotaResetAt = new Date(Date.now() + QUOTA_RESET_INTERVAL_MS);
    }
    if (shouldResetMonthly) {
      updateData.cacheRecipeSuggestionsUsed = 0;
      updateData.chatMessagesUsed = 0;
      updateData.cacheRecipeSearchViaChatUsed = 0;
      // Reset auf ersten Tag des nächsten Monats
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      updateData.monthlyLimitResetAt = nextMonth;
    }
    return await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
  }
  return user;
}

async function consumeQuota(userId, type, amount) {
  if (AUTH_DISABLED) return;
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('USER_NOT_FOUND');
    err.status = 404;
    throw err;
  }
  user = await resetQuotaIfNeeded(user);
  const isLlm = type === 'LLM';
  const limit = isLlm ? user.quotaLlmTokens : user.quotaRecipeCalls;
  const used = isLlm ? user.llmTokensUsed : user.recipeCallsUsed;
  const field = isLlm ? 'llmTokensUsed' : 'recipeCallsUsed';
  if (used + amount > limit) {
    const err = new Error('QUOTA_EXCEEDED');
    err.status = 402;
    err.detail = isLlm
      ? 'Dein KI-Kontingent ist aufgebraucht. Bitte warte bis zum Reset oder upgrade deinen Plan.'
      : 'Dein Rezept-Kontingent ist aufgebraucht. Bitte warte bis zum Reset oder upgrade deinen Plan.';
    throw err;
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      [field]: { increment: amount },
    },
  });
}

// Helper: Erstelle GitHub Issue Template URL
function createIssueTemplateUrl(title, body) {
  try {
    return `https://github.com/Jacha93/smart-pantry/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  } catch {
    return 'https://github.com/Jacha93/smart-pantry/issues/new';
  }
}

async function consumeQuotaOrRespond(res, userId, type, amount) {
  try {
    await consumeQuota(userId, type, amount);
    return true;
  } catch (error) {
    if (error.status === 402) {
      res.status(402).json({ detail: error.detail, quota: type });
      return false;
    }
    throw error;
  }
}

// Helper: Prüfe Tier-Limits
async function checkTierLimit(userId, limitType) {
  if (AUTH_DISABLED) return { allowed: true, limit: -1, used: 0 };
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('USER_NOT_FOUND');
    err.status = 404;
    throw err;
  }

  let limit, used, count;
  
  switch (limitType) {
    case 'groceries_total':
      limit = user.maxGroceriesTotal ?? 20; // Free Tier Default
      count = await prisma.grocery.count({ where: { userId } });
      return { allowed: limit === -1 || count < limit, limit, used: count };
    
    case 'groceries_with_expiry':
      limit = user.maxGroceriesWithExpiry ?? 10; // Free Tier Default
      count = await prisma.grocery.count({ where: { userId, expiryDate: { not: null } } });
      return { allowed: limit === -1 || count < limit, limit, used: count };
    
    case 'cache_recipe_suggestions':
      limit = user.maxCacheRecipeSuggestions ?? 12; // Free Tier Default
      used = user.cacheRecipeSuggestionsUsed ?? 0;
      return { allowed: limit === -1 || used < limit, limit, used };
    
    case 'chat_messages':
      limit = user.maxChatMessages ?? 4; // Free Tier Default
      used = user.chatMessagesUsed ?? 0;
      return { allowed: limit === -1 || used < limit, limit, used };
    
    case 'cache_recipe_search_via_chat':
      limit = user.maxCacheRecipeSearchViaChat ?? 4; // Free Tier Default
      used = user.cacheRecipeSearchViaChatUsed ?? 0;
      return { allowed: limit === -1 || used < limit, limit, used };
    
    default:
      return { allowed: true, limit: -1, used: 0 };
  }
}

// Helper: Prüfe ob Benachrichtigungen erlaubt sind
async function canSendNotifications(userId) {
  if (AUTH_DISABLED) return true;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.notificationsEnabled ?? false;
}

// Helper: Verbrauche monatliches Limit
async function consumeMonthlyLimit(userId, limitType) {
  if (AUTH_DISABLED) return true;
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('USER_NOT_FOUND');
    err.status = 404;
    throw err;
  }
  user = await resetQuotaIfNeeded(user);
  
  let field;
  switch (limitType) {
    case 'cache_recipe_suggestions':
      field = 'cacheRecipeSuggestionsUsed';
      break;
    case 'chat_messages':
      field = 'chatMessagesUsed';
      break;
    case 'cache_recipe_search_via_chat':
      field = 'cacheRecipeSearchViaChatUsed';
      break;
    default:
      return true;
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      [field]: { increment: 1 },
    },
  });
  return true;
}

// Helper: Prüfe und verbrauche monatliches Limit
async function checkAndConsumeMonthlyLimit(userId, limitType) {
  const check = await checkTierLimit(userId, limitType);
  if (!check.allowed) {
    const err = new Error('MONTHLY_LIMIT_EXCEEDED');
    err.status = 402;
    err.detail = limitType === 'cache_recipe_suggestions'
      ? `Du hast dein Kontingent von ${check.limit} Rezeptvorschlägen aus dem Cache erreicht. Upgrade für mehr Vorschläge!`
      : limitType === 'chat_messages'
      ? `Du hast dein Kontingent von ${check.limit} Chat-Nachrichten erreicht. Upgrade für mehr Nachrichten!`
      : `Du hast dein Kontingent von ${check.limit} Rezeptsuche via Chat erreicht. Upgrade für mehr Suchen!`;
    err.limit = limitType;
    throw err;
  }
  await consumeMonthlyLimit(userId, limitType);
  return true;
}

async function authMiddleware(req, res, next) {
  try {
    if (AUTH_DISABLED) {
      const demoUser = await ensureDemoUser();
      req.user = { id: demoUser.id, email: demoUser.email, role: demoUser.role };
      return next();
    }
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid token' });
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    console.log('Registration request received:', {
      email: req.body?.email ? 'provided' : 'missing',
      password: req.body?.password ? 'provided' : 'missing',
      name: req.body?.name ? 'provided' : 'missing',
      bodyKeys: Object.keys(req.body || {}),
    });
    
    const { email, password, name, profile } = req.body || {};
    if (!email || !password || !name) {
      console.error('Registration failed: Missing required fields', { email: !!email, password: !!password, name: !!name });
      return res.status(400).json({ detail: 'Missing required fields: email, password, and name are required' });
    }
    
    const normalizedEmail = normalizeEmail(email);
    console.log('Checking if user exists:', normalizedEmail);
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      console.error('Registration failed: User already exists', normalizedEmail);
      return res.status(409).json({ detail: 'User already exists' });
    }
    
    console.log('Creating new user:', normalizedEmail);
    const passwordHash = await bcrypt.hash(password, 10);
    const encryptedProfile = profile ? encryptField(JSON.stringify(profile)) : null;
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: String(name).trim(),
        passwordHash,
        encryptedProfile,
        quotaResetAt: new Date(),
      },
    });
    
    console.log('User created successfully:', user.id, user.email);
    return res
      .status(201)
      .json({ id: user.id, email: user.email, name: user.name, created_at: user.createdAt });
  } catch (error) {
    console.error('Register Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ detail: error.message || 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ detail: 'Missing credentials' });
    
    const isDemoCredentials =
      normalizeEmail(email) === normalizeEmail(DEMO_USER_EMAIL) &&
      password === DEMO_USER_PASSWORD;

    if (isDemoCredentials) {
      const demoUser = await ensureDemoUser();
      const tokens = await issueAuthTokens(demoUser, req);
      return res.json({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_type: 'bearer',
        expires_in: REFRESH_TOKEN_TTL_MS / 1000,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(401).json({ detail: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ detail: 'Invalid credentials' });
    const tokens = await issueAuthTokens(user, req);
    return res.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: 'bearer',
      expires_in: REFRESH_TOKEN_TTL_MS / 1000,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ detail: 'Login failed' });
  }
});

app.post('/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body || {};
    if (!refresh_token) return res.status(400).json({ detail: 'refresh_token erforderlich' });
    const tokens = await rotateRefreshToken(refresh_token, req);
    if (!tokens) {
      return res.status(401).json({ detail: 'Refresh token ungültig' });
    }
    res.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: 'bearer',
      expires_in: REFRESH_TOKEN_TTL_MS / 1000,
    });
  } catch (error) {
    console.error('Refresh Error:', error);
    res.status(500).json({ detail: 'Konnte Token nicht erneuern' });
  }
});

app.post('/auth/logout', async (req, res) => {
  try {
    const { refresh_token } = req.body || {};
    await revokeRefreshToken(refresh_token);
    res.json({ success: true });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ detail: 'Logout fehlgeschlagen' });
  }
});

// Endpoint: User Limits abrufen
app.get('/user/limits', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    
    const totalGroceries = await prisma.grocery.count({ where: { userId: req.user.id } });
    const groceriesWithExpiry = await prisma.grocery.count({ 
      where: { userId: req.user.id, expiryDate: { not: null } } 
    });
    
    res.json({
      quotaLlmTokens: user.quotaLlmTokens,
      quotaRecipeCalls: user.quotaRecipeCalls,
      llmTokensUsed: user.llmTokensUsed,
      recipeCallsUsed: user.recipeCallsUsed,
      maxCacheRecipeSuggestions: user.maxCacheRecipeSuggestions ?? 12,
      maxChatMessages: user.maxChatMessages ?? 4,
      maxCacheRecipeSearchViaChat: user.maxCacheRecipeSearchViaChat ?? 4,
      maxGroceriesWithExpiry: user.maxGroceriesWithExpiry ?? 10,
      maxGroceriesTotal: user.maxGroceriesTotal ?? 20,
      notificationsEnabled: user.notificationsEnabled ?? false,
      hasPrioritySupport: user.hasPrioritySupport ?? false,
      currentGroceriesTotal: totalGroceries,
      currentGroceriesWithExpiry: groceriesWithExpiry,
      cacheRecipeSuggestionsUsed: user.cacheRecipeSuggestionsUsed ?? 0,
      chatMessagesUsed: user.chatMessagesUsed ?? 0,
      cacheRecipeSearchViaChatUsed: user.cacheRecipeSearchViaChatUsed ?? 0,
      quotaResetAt: user.quotaResetAt,
      monthlyLimitResetAt: user.monthlyLimitResetAt ?? user.createdAt,
    });
  } catch (error) {
    console.error('User limits error:', error);
    res.status(500).json({ detail: 'Fehler beim Abrufen der Limits' });
  }
});

app.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ detail: 'User not found' });
    const profileString = user.encryptedProfile ? decryptField(user.encryptedProfile) : null;
    const profile = profileString ? JSON.parse(profileString) : null;
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile,
      quotas: {
        llm_tokens_total: user.quotaLlmTokens,
        llm_tokens_used: user.llmTokensUsed,
        recipe_calls_total: user.quotaRecipeCalls,
        recipe_calls_used: user.recipeCallsUsed,
        reset_at: user.quotaResetAt,
      },
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ detail: 'Fehler beim Laden des Profils' });
  }
});

app.put('/me/profile', authMiddleware, async (req, res) => {
  try {
    const { profile } = req.body || {};
    if (!profile || typeof profile !== 'object') {
      return res.status(400).json({ detail: 'Profile object required' });
    }
    const encryptedProfile = encryptField(JSON.stringify(profile));
    await prisma.user.update({
      where: { id: req.user.id },
      data: { encryptedProfile },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ detail: 'Profil konnte nicht gespeichert werden' });
  }
});

// Groceries routes (protected)
app.get('/groceries', authMiddleware, async (req, res) => {
  const list = await prisma.grocery.findMany({
    where: { userId: req.user.id },
    orderBy: { addedAt: 'desc' },
  });
  res.json(
    list.map((g) => ({
      id: g.id,
      user_id: g.userId,
      name: g.name,
      quantity: g.quantity,
      unit: g.unit,
      category: g.category,
      expiry_date: g.expiryDate,
      added_date: g.addedAt,
      low_stock_threshold: g.lowStockThreshold,
      notes: g.notes,
    }))
  );
});

app.post('/groceries', authMiddleware, async (req, res) => {
  const { name, quantity, unit, category, expiry_date, low_stock_threshold, notes } = req.body || {};
  if (!name || quantity == null || !unit || !category || low_stock_threshold == null) {
    return res.status(400).json({ detail: 'Missing fields' });
  }
  
  // Prüfe Gesamt-Lebensmittel-Limit
  const totalLimit = await checkTierLimit(req.user.id, 'groceries_total');
  if (!totalLimit.allowed) {
    return res.status(402).json({ 
      detail: `Du hast das Limit von ${totalLimit.limit} Lebensmitteln erreicht. Upgrade deinen Plan für unbegrenzte Lebensmittel.`,
      limit: 'groceries_total',
      limitReached: true
    });
  }
  
  // Prüfe MHD-Limit (nur wenn expiry_date gesetzt)
  if (expiry_date) {
    const expiryLimit = await checkTierLimit(req.user.id, 'groceries_with_expiry');
    if (!expiryLimit.allowed) {
      return res.status(402).json({ 
        detail: `Du hast das Limit von ${expiryLimit.limit} Lebensmitteln mit MHD erreicht. Upgrade deinen Plan für mehr Lebensmittel mit MHD.`,
        limit: 'groceries_with_expiry',
        limitReached: true
      });
    }
  }
  
  const item = await prisma.grocery.create({
    data: {
      userId: req.user.id,
      name: String(name).trim(),
      quantity: Number(quantity),
      unit,
      category,
      expiryDate: expiry_date ? new Date(expiry_date) : null,
      lowStockThreshold: Number(low_stock_threshold),
      notes: notes || null,
    },
  });
  res.status(201).json({
    id: item.id,
    user_id: item.userId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    expiry_date: item.expiryDate,
    added_date: item.addedAt,
    low_stock_threshold: item.lowStockThreshold,
    notes: item.notes,
  });
});

app.put('/groceries/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const grocery = await prisma.grocery.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!grocery) return res.status(404).json({ detail: 'Not found' });
  const updated = await prisma.grocery.update({
    where: { id },
    data: {
      name: req.body.name ?? grocery.name,
      quantity: req.body.quantity != null ? Number(req.body.quantity) : grocery.quantity,
      unit: req.body.unit ?? grocery.unit,
      category: req.body.category ?? grocery.category,
      expiryDate: req.body.expiry_date ? new Date(req.body.expiry_date) : grocery.expiryDate,
      lowStockThreshold:
        req.body.low_stock_threshold != null
          ? Number(req.body.low_stock_threshold)
          : grocery.lowStockThreshold,
      notes: req.body.notes !== undefined ? req.body.notes : grocery.notes,
    },
  });
  res.json({
    id: updated.id,
    user_id: updated.userId,
    name: updated.name,
    quantity: updated.quantity,
    unit: updated.unit,
    category: updated.category,
    expiry_date: updated.expiryDate,
    added_date: updated.addedAt,
    low_stock_threshold: updated.lowStockThreshold,
    notes: updated.notes,
  });
});

app.delete('/groceries/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const grocery = await prisma.grocery.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!grocery) return res.status(404).json({ detail: 'Not found' });
  await prisma.grocery.delete({ where: { id } });
  res.status(204).end();
});

// Shopping lists (protected)
app.get('/shopping-lists', authMiddleware, async (req, res) => {
  const lists = await prisma.shoppingList.findMany({
    where: { userId: req.user.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(
    lists.map((list) => ({
      id: list.id,
      user_id: list.userId,
      name: list.name,
      created_at: list.createdAt,
      completed: list.completed,
      items: list.items.map((item) => ({
        id: item.id,
        list_id: item.listId,
        grocery_name: item.groceryName,
        quantity: item.quantity,
        checked: item.checked,
      })),
    }))
  );
});

app.post('/shopping-lists', authMiddleware, async (req, res) => {
  const { items, name } = req.body || {};
  const list = await prisma.shoppingList.create({
    data: {
      userId: req.user.id,
      name: name || null,
      items: {
        create:
          Array.isArray(items) && items.length
            ? items.map((it) => ({
                groceryName: it.grocery_name,
                quantity: Number(it.quantity) || 1,
              }))
            : [],
      },
    },
    include: { items: true },
  });
  res.status(201).json({
    id: list.id,
    user_id: list.userId,
    name: list.name,
    created_at: list.createdAt,
    completed: list.completed,
    items: list.items.map((item) => ({
      id: item.id,
      list_id: item.listId,
      grocery_name: item.groceryName,
      quantity: item.quantity,
      checked: item.checked,
    })),
  });
});

app.post('/shopping-lists/generate', authMiddleware, async (req, res) => {
  const userGroceries = await prisma.grocery.findMany({
    where: { userId: req.user.id },
  });
  const need = userGroceries.filter((g) => g.quantity <= g.lowStockThreshold);
  const list = await prisma.shoppingList.create({
    data: {
      userId: req.user.id,
      items: {
        create: need.map((g) => ({
          groceryName: g.name,
          quantity: Math.max(1, g.lowStockThreshold + 1 - g.quantity),
        })),
      },
    },
    include: { items: true },
  });
  res.status(201).json({
    id: list.id,
    user_id: list.userId,
    name: list.name,
    created_at: list.createdAt,
    completed: list.completed,
    items: list.items.map((item) => ({
      id: item.id,
      list_id: item.listId,
      grocery_name: item.groceryName,
      quantity: item.quantity,
      checked: item.checked,
    })),
  });
});

// DELETE must come before GET :id to avoid route conflicts
app.delete('/shopping-lists/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const list = await prisma.shoppingList.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!list) return res.status(404).json({ detail: 'Not found' });
  await prisma.shoppingList.delete({ where: { id } });
  res.status(204).end();
});

// PUT must come before GET :id to avoid route conflicts
app.put('/shopping-lists/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const list = await prisma.shoppingList.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!list) return res.status(404).json({ detail: 'List not found' });
  const updated = await prisma.shoppingList.update({
    where: { id },
    data: { name: req.body.name ?? list.name },
    include: { items: true },
  });
  res.json({
    id: updated.id,
    user_id: updated.userId,
    name: updated.name,
    created_at: updated.createdAt,
    completed: updated.completed,
    items: updated.items.map((item) => ({
      id: item.id,
      list_id: item.listId,
      grocery_name: item.groceryName,
      quantity: item.quantity,
      checked: item.checked,
    })),
  });
});

// POST /shopping-lists/:id/items must come before GET :id
app.post('/shopping-lists/:id/items', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const list = await prisma.shoppingList.findFirst({
    where: { id, userId: req.user.id },
    include: { items: true },
  });
  if (!list) return res.status(404).json({ detail: 'List not found' });
  if (list.completed) return res.status(400).json({ detail: 'Cannot add items to completed list' });
  const { grocery_name, quantity } = req.body || {};
  if (!grocery_name) return res.status(400).json({ detail: 'grocery_name is required' });
  await prisma.shoppingListItem.create({
    data: {
      listId: id,
      groceryName: String(grocery_name),
      quantity: Number(quantity) || 1,
    },
  });
  const updated = await prisma.shoppingList.findUnique({
    where: { id },
    include: { items: true },
  });
  res.status(201).json({
    id: updated.id,
    user_id: updated.userId,
    name: updated.name,
    created_at: updated.createdAt,
    completed: updated.completed,
    items: updated.items.map((item) => ({
      id: item.id,
      list_id: item.listId,
      grocery_name: item.groceryName,
      quantity: item.quantity,
      checked: item.checked,
    })),
  });
});

app.post('/shopping-lists/:id/complete', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const list = await prisma.shoppingList.findFirst({
    where: { id, userId: req.user.id },
    include: { items: true },
  });
  if (!list) return res.status(404).json({ detail: 'Not found' });
  const updated = await prisma.shoppingList.update({
    where: { id },
    data: { completed: true },
    include: { items: true },
  });
  res.json({
    id: updated.id,
    user_id: updated.userId,
    name: updated.name,
    created_at: updated.createdAt,
    completed: updated.completed,
    items: updated.items.map((item) => ({
      id: item.id,
      list_id: item.listId,
      grocery_name: item.groceryName,
      quantity: item.quantity,
      checked: item.checked,
    })),
  });
});

app.put('/shopping-lists/:listId/items/:itemId/toggle', authMiddleware, async (req, res) => {
  const listId = Number(req.params.listId);
  const itemId = Number(req.params.itemId);
  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, userId: req.user.id },
  });
  if (!list) return res.status(404).json({ detail: 'List not found' });
  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, listId },
  });
  if (!item) return res.status(404).json({ detail: 'Item not found' });
  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { checked: !item.checked },
  });
  const updatedList = await prisma.shoppingList.findUnique({
    where: { id: listId },
    include: { items: true },
  });
  res.json({
    id: updatedList.id,
    user_id: updatedList.userId,
    name: updatedList.name,
    created_at: updatedList.createdAt,
    completed: updatedList.completed,
    items: updatedList.items.map((i) => ({
      id: i.id,
      list_id: i.listId,
      grocery_name: i.groceryName,
      quantity: i.quantity,
      checked: i.checked,
    })),
  });
});

app.get('/shopping-lists/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const list = await prisma.shoppingList.findFirst({
    where: { id, userId: req.user.id },
    include: { items: true },
  });
  if (!list) return res.status(404).json({ detail: 'Not found' });
  res.json({
    id: list.id,
    user_id: list.userId,
    name: list.name,
    created_at: list.createdAt,
    completed: list.completed,
    items: list.items.map((item) => ({
      id: item.id,
      list_id: item.listId,
      grocery_name: item.groceryName,
      quantity: item.quantity,
      checked: item.checked,
    })),
  });
});

// Helper: Text mit Gemini übersetzen
async function translateTextWithGemini(text, targetLanguage) {
  if (!genAI) {
    throw new Error('Gemini API Key nicht gesetzt');
  }

  try {
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } catch (error) {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    }

    const languageName = targetLanguage === 'de' ? 'Deutsch' : 'English';
    const prompt = `Übersetze den folgenden Rezept-Text genau ins ${languageName}. 

WICHTIG:
- Übersetze NUR den Text, behalte HTML-Tags bei (falls vorhanden)
- Übersetze koch-spezifische Begriffe korrekt
- Behalte die Formatierung bei
- Falls der Text bereits auf ${languageName} ist, gib ihn unverändert zurück

Text:
${text}`;

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini Übersetzungsfehler:', error);
    throw error;
  }
}

// Helper: Google Gemini Vision für Bildanalyse
async function analyzeImageWithGemini(imageBuffer, mimeType) {
  if (!genAI) {
    throw new Error('Gemini API Key nicht gesetzt');
  }

  try {
    // Verwende Gemini 2.5 Flash für Bildanalyse (aktuellstes und schnellstes Modell)
    let model;
    try {
      // Verwende gemini-2.5-flash (aktuellste Version)
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('⚠️ gemini-2.5-flash nicht verfügbar, verwende gemini-2.5-pro');
        }
      // Fallback auf gemini-2.5-pro
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      } catch (error2) {
        console.error('❌ Weder gemini-2.5-flash noch gemini-2.5-pro verfügbar:', error2.message);
        throw new Error('Kein verfügbares Gemini 2.5 Modell gefunden');
      }
    }
    
    // Base64 encoding für Gemini
    const base64Image = imageBuffer.toString('base64');
    
    const prompt = `Du siehst ein Foto von Lebensmitteln. Analysiere das Bild und liste ALLE erkennbaren Lebensmittel auf, die sichtbar sind.

WICHTIG: 
- Gib NUR eine kommagetrennte Liste zurück (auf Englisch)
- Keine zusätzlichen Erklärungen, keine Markdown-Formatierung, keine Nummerierung
- Format: Milk, Eggs, Tomatoes, Cheese, Butter
- Nur Lebensmittelnamen, getrennt durch Kommas`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType || 'image/jpeg',
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    
    
    // Extrahiere Lebensmittel aus der Antwort
    const foods = text
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0)
      .map(f => f.replace(/^\d+\.\s*/, '')) // Entferne Nummerierung falls vorhanden
      .filter(f => !f.toLowerCase().includes('example') && !f.toLowerCase().includes('format'))
      .map(f => f.replace(/^[-•]\s*/, '')) // Entferne Bullet Points
      .filter(f => f.length > 0);


    if (foods.length === 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Keine Lebensmittel extrahiert, verwende Fallback');
      }
      return ['Milk', 'Eggs', 'Tomatoes']; // Fallback
    }

    return foods;
  } catch (error) {
    console.error('Gemini API Fehler:', error);
    throw error;
  }
}

// Helper: Spoonacular Recipe API für Rezeptvorschläge (mit KI-Lernen basierend auf gekochten Rezepten)
async function getRecipeSuggestions(ingredients, userId) {
  const userCookedRecipes = await prisma.cookedRecipe.findMany({
    where: { userId },
  });
  const cookedRecipeIds = userCookedRecipes.map((r) => r.recipeId);
  const preferredRecipeTitles = userCookedRecipes
    .filter((r) => r.rating && r.rating >= 4)
    .map((r) => r.recipeTitle.toLowerCase());
  
  if (!SPOONACULAR_API_KEY) {
    // Fallback: Stub-Daten wenn API Key fehlt
    return [
      {
        id: 1,
        title: 'Scrambled Eggs with Tomatoes',
        image: 'https://images.unsplash.com/photo-1615367424476-35335d4d2f38?w=400',
        used_ingredients: [{ name: 'Eggs', amount: 3, unit: 'pcs' }, { name: 'Tomatoes', amount: 2, unit: 'pcs' }],
        missed_ingredients: [{ name: 'Salt', amount: 1, unit: 'pinch' }],
        likes: 1245,
      },
    ];
  }

  try {
    // Hole Rezepte basierend auf Zutaten
    const ingredientsString = Array.isArray(ingredients) ? ingredients.join(',') : ingredients;
    const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
      params: {
        ingredients: ingredientsString,
        number: 3,
        ranking: 2, // Maximize used ingredients
        ignorePantry: true,
        apiKey: SPOONACULAR_API_KEY,
      },
      timeout: 10000,
    });

    let recipes = response.data || [];
    
    // KI-Lernen: Sortiere Rezepte basierend auf User-Präferenzen
    // 1. Bevorzuge ähnliche Rezepte zu bereits gekochten (wenn gut bewertet)
    // 2. Vermeide bereits gekochte Rezepte (außer sie waren sehr gut bewertet)
    recipes = recipes.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      
      // Prüfe ob Rezept ähnlich zu bevorzugten Rezepten ist
      const aIsPreferred = preferredRecipeTitles.some(pref => 
        aTitle.includes(pref.split(' ')[0]) || pref.split(' ').some(word => aTitle.includes(word))
      );
      const bIsPreferred = preferredRecipeTitles.some(pref => 
        bTitle.includes(pref.split(' ')[0]) || pref.split(' ').some(word => bTitle.includes(word))
      );
      
      // Bevorzuge ähnliche Rezepte
      if (aIsPreferred && !bIsPreferred) return -1;
      if (!aIsPreferred && bIsPreferred) return 1;
      
      // Vermeide bereits gekochte Rezepte (außer sehr gut bewertet)
      const aIsCooked = cookedRecipeIds.includes(a.id);
      const bIsCooked = cookedRecipeIds.includes(b.id);
      if (aIsCooked && !bIsCooked) return 1; // Nicht gekochte bevorzugen
      if (!aIsCooked && bIsCooked) return -1;
      
      // Ansonsten nach verwendet Ingredients sortieren
      return (b.usedIngredientCount || 0) - (a.usedIngredientCount || 0);
    });
    
    // Hole Details für jedes Rezept (für vollständige Zutatenliste)
    const recipeDetails = await Promise.all(
      recipes.slice(0, 3).map(async (recipe) => {
        try {
          const detailResponse = await axios.get(
            `https://api.spoonacular.com/recipes/${recipe.id}/information`,
            {
              params: {
                includeNutrition: false,
                apiKey: SPOONACULAR_API_KEY,
              },
              timeout: 10000,
            }
          );

          const detail = detailResponse.data;
          
          // Bestimme used und missed ingredients (sicherstellen dass Arrays vorhanden sind)
          const usedIng = (Array.isArray(recipe.usedIngredients) ? recipe.usedIngredients : []).map(ing => ({
            name: ing.name,
            amount: ing.amount || 1,
            unit: ing.unit || 'pcs',
          }));
          
          const missedIng = (Array.isArray(recipe.missedIngredients) ? recipe.missedIngredients : []).map(ing => ({
            name: ing.name,
            amount: ing.amount || 1,
            unit: ing.unit || 'pcs',
          }));

          const recipeData = {
            id: recipe.id,
            title: recipe.title || detail.title || 'Unnamed Recipe',
            image: recipe.image || detail.image || null,
            used_ingredients: usedIng,
            missed_ingredients: missedIng,
            likes: detail.aggregateLikes || 0,
            sourceUrl: detail.sourceUrl || '',
          };
          return recipeData;
        } catch (err) {
          console.error(`Fehler beim Laden von Rezept ${recipe.id}:`, err.message);
          // Fallback für fehlgeschlagene Details
          return {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image || null,
            used_ingredients: (Array.isArray(recipe.usedIngredients) ? recipe.usedIngredients : []).map(ing => ({
              name: ing.name,
              amount: ing.amount || 1,
              unit: ing.unit || 'pcs',
            })),
            missed_ingredients: (Array.isArray(recipe.missedIngredients) ? recipe.missedIngredients : []).map(ing => ({
              name: ing.name,
              amount: ing.amount || 1,
              unit: ing.unit || 'pcs',
            })),
            likes: 0,
          };
        }
      })
    );

    return recipeDetails;
  } catch (error) {
    console.error('Spoonacular API Fehler:', error.message);
    // Fallback auf Stub-Daten bei Fehler
    const fallbackRecipes = [
      {
        id: 1,
        title: 'Recipe with your ingredients',
        image: 'https://images.unsplash.com/photo-1615367424476-35335d4d2f38?w=400',
        used_ingredients: Array.isArray(ingredients) ? ingredients.slice(0, 3).map(name => ({ name, amount: 1, unit: 'pcs' })) : [],
        missed_ingredients: [],
        likes: 0,
        sourceUrl: '',
      },
    ];
    return fallbackRecipes;
  }
}

// Photo recognition mit Google Gemini + Spoonacular
app.post('/photo-recognition/analyze-fridge', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    const llmQuotaOk = await consumeQuotaOrRespond(res, req.user.id, 'LLM', LLM_TOKEN_COST_ANALYZE);
    if (!llmQuotaOk) return;
    const recipeQuotaOk = await consumeQuotaOrRespond(res, req.user.id, 'RECIPE', RECIPE_CALL_COST_ANALYZE);
    if (!recipeQuotaOk) return;

    let recognizedFoods = [];

    // Schritt 1: Bildanalyse mit Gemini
    if (genAI && GEMINI_API_KEY) {
      try {
        recognizedFoods = await analyzeImageWithGemini(req.file.buffer, req.file.mimetype);
        
        if (!recognizedFoods || recognizedFoods.length === 0) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('⚠️ Gemini hat keine Lebensmittel zurückgegeben, verwende Fallback');
          }
          recognizedFoods = ['Milk', 'Eggs', 'Tomatoes', 'Cheese', 'Butter'];
        }
      } catch (error) {
        console.error('❌ Gemini Fehler, verwende Fallback:', error.message);
        // Fallback auf Stub-Daten
        recognizedFoods = ['Milk', 'Eggs', 'Tomatoes', 'Cheese', 'Butter'];
      }
    } else {
      // Fallback wenn kein API Key gesetzt
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Gemini API Key fehlt, verwende Stub-Daten');
      }
      recognizedFoods = ['Milk', 'Eggs', 'Tomatoes', 'Cheese', 'Butter'];
    }

    // Schritt 2: Hole User's aktuelles Inventar für bessere Rezeptvorschläge
    const userGroceries = await prisma.grocery.findMany({
      where: { userId: req.user.id },
      select: { name: true },
    });
    const availableIngredients = [
      ...recognizedFoods,
      ...userGroceries.map((g) => g.name),
    ];

    console.log('🥘 Verfügbare Zutaten für Rezeptvorschläge:', availableIngredients);

    // Schritt 3: Prüfe Cache-Vorschläge-Limit
    try {
      await checkAndConsumeMonthlyLimit(req.user.id, 'cache_recipe_suggestions');
    } catch (error) {
      if (error.status === 402) {
        return res.status(402).json({ 
          detail: error.detail, 
          limit: error.limit,
          limitReached: true
        });
      }
      throw error;
    }

    // Schritt 4: Hole Rezeptvorschläge von Spoonacular (mit KI-Lernen basierend auf gekochten Rezepten)
    const recipeSuggestions = await getRecipeSuggestions(availableIngredients, req.user.id);
    console.log('✅ Rezeptvorschläge erhalten:', recipeSuggestions.length, 'Rezepte');

    // Schritt 4: Speichere Rezepte automatisch für die Rezepte-Seite
    const savedRecipeIds = [];
    for (const recipe of recipeSuggestions) {
      if (!recipe || !recipe.id) {
        if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Ungültiges Rezept übersprungen:', recipe);
      }
        continue;
      }
      
      const existing = await prisma.savedRecipe.findFirst({
        where: { userId: req.user.id, recipeId: recipe.id },
      });
      
      if (!existing) {
        const saved = await prisma.savedRecipe.create({
          data: {
            userId: req.user.id,
            recipeId: recipe.id,
            title: recipe.title || 'Unnamed Recipe',
            image: recipe.image || null,
            usedIngredients: recipe.used_ingredients || [],
            missedIngredients: recipe.missed_ingredients || [],
            likes: recipe.likes || 0,
            sourceUrl: recipe.sourceUrl || '',
          },
        });
        savedRecipeIds.push(saved.id);
      }
    }
    const totalRecipes = await prisma.savedRecipe.count({ where: { userId: req.user.id } });

    // Stelle sicher, dass immer Arrays zurückgegeben werden (auch wenn leer)
    const response = {
      recognized_foods: Array.isArray(recognizedFoods) ? recognizedFoods : [],
      recipe_suggestions: Array.isArray(recipeSuggestions) ? recipeSuggestions : [],
      message: GEMINI_API_KEY ? 'Analyse erfolgreich (Gemini + Spoonacular)' : 'Analyse erfolgreich (Stub-Daten)',
    };


    res.json(response);
  } catch (error) {
    console.error('Foto-Analyse Fehler:', error);
    res.status(500).json({ detail: 'Fehler bei der Foto-Analyse: ' + error.message });
  }
});

app.post('/photo-recognition/add-recognized-groceries', authMiddleware, async (req, res) => {
  const { food_items } = req.body || {};
  if (!Array.isArray(food_items)) return res.status(400).json({ detail: 'food_items must be array' });
  const createdItems = [];
  for (const name of food_items) {
    const item = await prisma.grocery.create({
      data: {
        userId: req.user.id,
        name: String(name),
        quantity: 1,
        unit: 'pcs',
        category: 'Other',
        lowStockThreshold: 0,
      },
    });
    createdItems.push({
      id: item.id,
      user_id: item.userId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      added_date: item.addedAt,
      low_stock_threshold: item.lowStockThreshold,
    });
  }
  res.status(201).json({ created: createdItems });
});

// Rezept-Details von Spoonacular
app.get('/photo-recognition/recipe-details/:recipeId', authMiddleware, async (req, res) => {
  try {
    const recipeId = Number(req.params.recipeId);

    if (!SPOONACULAR_API_KEY) {
      // Fallback wenn API Key fehlt
      return res.json({
        id: recipeId,
        title: `Recipe #${recipeId}`,
        ingredients: ['Sample Ingredient 1', 'Sample Ingredient 2'],
        instructions: 'Mix ingredients and cook.',
        servings: 2,
        image: null,
        sourceUrl: '',
      });
    }

    try {
      const response = await axios.get(
        `https://api.spoonacular.com/recipes/${recipeId}/information`,
        {
          params: {
            includeNutrition: false,
            apiKey: SPOONACULAR_API_KEY,
          },
          timeout: 10000,
        }
      );

      const recipe = response.data;

      res.json({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        ingredients: (recipe.extendedIngredients || []).map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          original: ing.original,
        })),
        instructions: recipe.instructions || recipe.summary || 'No instructions available',
        servings: recipe.servings || 2,
        readyInMinutes: recipe.readyInMinutes || 0,
        sourceUrl: recipe.sourceUrl || recipe.spoonacularSourceUrl || '',
      });
    } catch (error) {
      console.error('Spoonacular Detail API Fehler:', error.message);
      res.status(500).json({ detail: 'Rezept konnte nicht geladen werden' });
    }
  } catch (error) {
    console.error('Rezept-Details Fehler:', error);
    res.status(500).json({ detail: 'Fehler beim Laden der Rezept-Details' });
  }
});

// Gekochte Rezepte speichern (für KI-Lernen)
app.post('/photo-recognition/cooked-recipe', authMiddleware, async (req, res) => {
  const { recipe_id, recipe_title, rating } = req.body || {};
  if (!recipe_id || !recipe_title) {
    return res.status(400).json({ detail: 'recipe_id und recipe_title erforderlich' });
  }

  const cooked = await prisma.cookedRecipe.create({
    data: {
      userId: req.user.id,
      recipeId: Number(recipe_id),
      recipeTitle: String(recipe_title),
      rating: rating != null ? Number(rating) : null,
    },
  });
  res.status(201).json({
    id: cooked.id,
    user_id: cooked.userId,
    recipe_id: cooked.recipeId,
    recipe_title: cooked.recipeTitle,
    cooked_at: cooked.cookedAt,
    rating: cooked.rating,
  });
});

// Gekochte Rezepte abrufen (für zukünftige personalisierte Vorschläge)
app.get('/photo-recognition/cooked-recipes', authMiddleware, async (req, res) => {
  const userCooked = await prisma.cookedRecipe.findMany({
    where: { userId: req.user.id },
    orderBy: { cookedAt: 'desc' },
  });
  res.json(
    userCooked.map((r) => ({
      id: r.id,
      user_id: r.userId,
      recipe_id: r.recipeId,
      recipe_title: r.recipeTitle,
      cooked_at: r.cookedAt,
      rating: r.rating,
    }))
  );
});

// Gespeicherte Rezepte abrufen (für Rezepte-Seite)
app.get('/recipes', authMiddleware, async (req, res) => {
  
  const [userRecipes, cookedForUser] = await Promise.all([
    prisma.savedRecipe.findMany({
      where: { userId: req.user.id },
      orderBy: { savedAt: 'desc' },
    }),
    prisma.cookedRecipe.findMany({
      where: { userId: req.user.id },
    }),
  ]);
  
  const userCookedIds = new Set(cookedForUser.map((r) => r.recipeId));
  const recipesWithStatus = userRecipes.map((recipe) => ({
    id: recipe.id,
    user_id: recipe.userId,
    recipe_id: recipe.recipeId,
    title: recipe.title,
    image: recipe.image,
    used_ingredients: recipe.usedIngredients || [],
    missed_ingredients: recipe.missedIngredients || [],
    likes: recipe.likes,
    sourceUrl: recipe.sourceUrl,
    saved_at: recipe.savedAt,
    ready_in_minutes: recipe.readyInMinutes,
    servings: recipe.servings,
    instructions: recipe.instructions,
    is_custom: recipe.isCustom,
    is_cooked: userCookedIds.has(recipe.recipeId),
    cooked_info: cookedForUser.find((r) => r.recipeId === recipe.recipeId) || null,
  }));
  
  res.json(recipesWithStatus);
});

// Einzelnes Rezept löschen
app.delete('/recipes/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const recipe = await prisma.savedRecipe.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!recipe) {
    return res.status(404).json({ detail: 'Rezept nicht gefunden' });
  }
  await prisma.savedRecipe.delete({ where: { id } });
  res.json({ success: true });
});

// Eigenes Rezept hinzufügen
app.post('/recipes', authMiddleware, async (req, res) => {
  try {
    const { title, image, ready_in_minutes, servings, ingredients, instructions, is_custom } = req.body || {};
    
    if (!title || !title.trim()) {
      return res.status(400).json({ detail: 'Rezeptname erforderlich' });
    }
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ detail: 'Mindestens eine Zutat erforderlich' });
    }
    
    if (!instructions || !instructions.trim()) {
      return res.status(400).json({ detail: 'Anleitung erforderlich' });
    }
    
    const customRecipeId = -Date.now();
    
    const saved = await prisma.savedRecipe.create({
      data: {
        userId: req.user.id,
        recipeId: customRecipeId,
        title: title.trim(),
        image: image || '/smart-pantry-favicon.png',
        readyInMinutes: ready_in_minutes || 30,
        servings: servings || 4,
        usedIngredients: ingredients.map((ing, idx) => ({
          id: idx + 1,
          name: ing.name,
          amount: ing.amount || 1,
          unit: ing.unit || '',
        })),
        missedIngredients: [],
        instructions: instructions.trim(),
        likes: 0,
        sourceUrl: '',
        isCustom: is_custom ?? true,
        ingredientsJson: ingredients,
      },
    });
    
    res.status(201).json({
      id: saved.id,
      user_id: saved.userId,
      recipe_id: saved.recipeId,
      title: saved.title,
      image: saved.image,
      ready_in_minutes: saved.readyInMinutes,
      servings: saved.servings,
      used_ingredients: saved.usedIngredients || [],
      missed_ingredients: saved.missedIngredients || [],
      instructions: saved.instructions,
      likes: saved.likes,
      sourceUrl: saved.sourceUrl,
      saved_at: saved.savedAt,
      is_custom: saved.isCustom,
    });
  } catch (error) {
    console.error('❌ Fehler beim Speichern des Rezepts:', error);
    res.status(500).json({ detail: 'Fehler beim Speichern des Rezepts' });
  }
});

// Rezept-Anleitung übersetzen
app.post('/photo-recognition/translate-instructions', authMiddleware, async (req, res) => {
  try {
    const { text, targetLanguage } = req.body || {};
    
    if (!text) {
      return res.status(400).json({ detail: 'Text erforderlich' });
    }

    if (!targetLanguage || targetLanguage === 'en') {
      // Keine Übersetzung nötig
      return res.json({ translated_text: text });
    }

    if (!genAI || !GEMINI_API_KEY) {
      console.warn('Gemini API Key fehlt, keine Übersetzung möglich');
      return res.json({ translated_text: text }); // Original zurückgeben
    }

    const quotaOk = await consumeQuotaOrRespond(res, req.user.id, 'LLM', LLM_TOKEN_COST_TRANSLATION);
    if (!quotaOk) return;

    try {
      const translated = await translateTextWithGemini(text, targetLanguage);
      res.json({ translated_text: translated });
    } catch (error) {
      console.error('❌ Übersetzungsfehler:', error.message);
      // Bei Fehler Original zurückgeben
      res.json({ translated_text: text });
    }
  } catch (error) {
    console.error('Übersetzungs-Endpoint Fehler:', error);
    res.status(500).json({ detail: 'Fehler bei der Übersetzung' });
  }
});

// Rezept-Titel übersetzen
app.post('/photo-recognition/translate-title', authMiddleware, async (req, res) => {
  try {
    const { title, targetLanguage } = req.body || {};
    
    if (!title) {
      return res.status(400).json({ detail: 'Titel erforderlich' });
    }

    if (!targetLanguage || targetLanguage === 'en') {
      // Keine Übersetzung nötig
      return res.json({ translated_title: title });
    }

    if (!genAI || !GEMINI_API_KEY) {
      console.warn('Gemini API Key fehlt, keine Übersetzung möglich');
      return res.json({ translated_title: title }); // Original zurückgeben
    }

    const quotaOk = await consumeQuotaOrRespond(res, req.user.id, 'LLM', LLM_TOKEN_COST_TRANSLATION);
    if (!quotaOk) return;

    try {
      console.log('🌍 Übersetze Rezept-Titel ins', targetLanguage);
      const translated = await translateTextWithGemini(title, targetLanguage);
      // Clean up: Entferne mögliche zusätzliche Text aus der Antwort
      const cleanTitle = translated.split('\n')[0].trim().split('.')[0].trim();
      res.json({ translated_title: cleanTitle || translated });
    } catch (error) {
      console.error('❌ Titel-Übersetzungsfehler:', error.message);
      // Bei Fehler Original zurückgeben
      res.json({ translated_title: title });
    }
  } catch (error) {
    console.error('Titel-Übersetzungs-Endpoint Fehler:', error);
    res.status(500).json({ detail: 'Fehler bei der Titel-Übersetzung' });
  }
});

// Rezept-Zutaten übersetzen
app.post('/photo-recognition/translate-ingredients', authMiddleware, async (req, res) => {
  try {
    const { ingredients, targetLanguage } = req.body || {};
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ detail: 'Zutaten-Array erforderlich' });
    }

    if (!targetLanguage || targetLanguage === 'en') {
      // Keine Übersetzung nötig
      return res.json({ translated_ingredients: ingredients });
    }

    if (!genAI || !GEMINI_API_KEY) {
      console.warn('Gemini API Key fehlt, keine Übersetzung möglich');
      return res.json({ translated_ingredients: ingredients }); // Original zurückgeben
    }

    try {
      
      // Erstelle eine kommagetrennte Liste der Zutaten
      const ingredientNames = ingredients.map(ing => typeof ing === 'string' ? ing : ing.name || ing);
      
      const translationCost =
        LLM_TOKEN_COST_TRANSLATION * Math.max(1, ingredientNames.length);
      const quotaOk = await consumeQuotaOrRespond(res, req.user.id, 'LLM', translationCost);
      if (!quotaOk) return;
      
      // Übersetze jede Zutat einzeln für bessere Qualität
      const translatedNames = [];
      for (const ingName of ingredientNames) {
        try {
          const translatedText = await translateTextWithGemini(
            `Übersetze nur diesen einen Lebensmittel-Zutaten-Namen ins ${targetLanguage === 'de' ? 'Deutsche' : 'Englische'} (ohne Mengenangaben, nur der Zutaten-Name): ${ingName}`,
            targetLanguage
          );
          // Clean up: Entferne mögliche zusätzliche Text aus der Antwort
          const cleanName = translatedText.split(',')[0].trim().split('\n')[0].trim();
          translatedNames.push(cleanName || ingName);
        } catch (err) {
          // Bei Fehler Original verwenden
          translatedNames.push(ingName);
        }
      }
      
      // Mappe übersetzte Namen zurück zu den originalen Zutaten-Objekten
      const translatedIngredients = ingredients.map((ing, index) => {
        const originalName = typeof ing === 'string' ? ing : ing.name || '';
        const translatedName = translatedNames[index] || originalName;
        
        if (typeof ing === 'string') {
          return translatedName;
        }
        return {
          ...ing,
          name: translatedName
        };
      });
      
      res.json({ translated_ingredients: translatedIngredients });
    } catch (error) {
      console.error('❌ Zutaten-Übersetzungsfehler:', error.message);
      // Bei Fehler Original zurückgeben
      res.json({ translated_ingredients: ingredients });
    }
  } catch (error) {
    console.error('Zutaten-Übersetzungs-Endpoint Fehler:', error);
    res.status(500).json({ detail: 'Fehler bei der Zutaten-Übersetzung' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

// Optional Auth Middleware für Chat/Issue Endpoints
async function optionalAuthMiddleware(req, res, next) {
  try {
    if (AUTH_DISABLED) {
      const demoUser = await ensureDemoUser();
      req.user = { id: demoUser.id, email: demoUser.email, role: demoUser.role };
      req.isAuthenticated = true;
      return next();
    }
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (user) {
          req.user = { id: user.id, email: user.email, role: user.role };
          req.isAuthenticated = true;
          return next();
        }
      } catch (error) {
        console.warn('Optional auth failed:', error.message);
      }
    }
    req.isAuthenticated = false;
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.isAuthenticated = false;
    next();
  }
}

// Chat Endpoints (optional auth)
app.post('/chat/message', optionalAuthMiddleware, async (req, res) => {
  try {
    const { message, context } = req.body || {};
    const authenticated = req.isAuthenticated === true;
    
    if (!message) {
      return res.status(400).json({ detail: 'Nachricht erforderlich' });
    }

    if (!authenticated) {
      return res.json({
        response:
          '🔒 Der Smart Pantry Assistent steht vollumfänglich nur nach dem Login zur Verfügung. Melde dich an, um KI-gestützte Antworten und personalisierte Hilfe zu erhalten.',
      });
    }

    if (!req.user) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }

    if (!genAI || !GEMINI_API_KEY) {
      return res.status(503).json({ detail: 'Chat-Service nicht verfügbar' });
    }

    // Prüfe Chat-Message-Limit
    try {
      await checkAndConsumeMonthlyLimit(req.user.id, 'chat_messages');
    } catch (error) {
      if (error.status === 402) {
        return res.status(402).json({ 
          detail: error.detail, 
          limit: error.limit,
          limitReached: true
        });
      }
      throw error;
    }

    // Prüfe ob es eine Rezeptsuche ist (via Chat)
    const isRecipeSearch = /rezept|recipe|koch|kochen|zutat|ingredient/i.test(message);
    if (isRecipeSearch) {
      try {
        await checkAndConsumeMonthlyLimit(req.user.id, 'cache_recipe_search_via_chat');
      } catch (error) {
        if (error.status === 402) {
          return res.status(402).json({ 
            detail: error.detail, 
            limit: error.limit,
            limitReached: true
          });
        }
        throw error;
      }
    }

    const quotaOk = await consumeQuotaOrRespond(res, req.user.id, 'LLM', LLM_TOKEN_COST_CHAT);
    if (!quotaOk) return;

    try {
      let model;
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      } catch (error) {
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      }

      // Unterschiedliche Prompts je nach Auth-Status
      const prompt = authenticated
        ? `Du bist der Smart Pantry Assistent, ein hilfreicher Chatbot für eine Lebensmittel-Inventarverwaltungs-App.

WICHTIG:
- Antworte AUSSCHLIESSLICH zu Fragen über Smart Pantry
- Keine allgemeinen Konversationen oder Themen außerhalb der App
- Wenn Fragen nicht zur App gehören, leite höflich zum Issue-System weiter
- Sei präzise und hilfreich
- Maximal 200 Wörter pro Antwort
- Der Nutzer ist EINGELOGGT und kann alle Funktionen nutzen

Kontext: ${context || 'smart-pantry'}
Nutzer-Frage: ${message}

Antworte hilfreich und projektbezogen:`
        : `Du bist der Smart Pantry Assistent, ein hilfreicher Chatbot für eine Lebensmittel-Inventarverwaltungs-App.

WICHTIG:
- Der Nutzer ist NICHT eingeloggt (Gast)
- Antworte NUR zu ALLGEMEINEN Fragen über Smart Pantry
- Motiviere den Nutzer höflich, sich anzumelden/zu registrieren
- Erkläre die Vorteile der App und warum sich eine Anmeldung lohnt
- Bei Fragen zu spezifischen Funktionen (Lebensmittel, Rezepte, etc.): Erkläre, dass diese nur für eingeloggte Nutzer verfügbar sind
- Issue-Meldungen sind erlaubt
- Keine allgemeinen Konversationen außerhalb der App
- Sei präzise und hilfreich
- Maximal 200 Wörter pro Antwort

Kontext: ${context || 'smart-pantry'}
Nutzer-Frage: ${message}

Antworte hilfreich, projektbezogen und motiviere zur Anmeldung:`;

      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const botResponse = response.text();

      res.json({ response: botResponse });
    } catch (error) {
      console.error('Chat-Fehler:', error);
      res.status(500).json({ detail: 'Fehler bei der Chat-Antwort' });
    }
  } catch (error) {
    console.error('Chat-Endpoint Fehler:', error);
    res.status(500).json({ detail: 'Fehler beim Chat-Endpoint' });
  }
});

// GitHub Issue erstellen (optional auth)
app.post('/chat/create-issue', optionalAuthMiddleware, async (req, res) => {
  try {
    const { title, body, labels = [] } = req.body || {};
    const authenticated = req.isAuthenticated === true;
    
    if (!title || !body) {
      return res.status(400).json({ detail: 'Title und Body erforderlich' });
    }
    
    // Markiere Issue als Gast- oder User-Issue
    const userInfo = authenticated && req.user
      ? `\n\n---\n*Issue erstellt von: ${req.user.email} (User ID: ${req.user.id})*`
      : `\n\n---\n*Issue erstellt von Gast-User (nicht eingeloggt)*`;
    
    const issueBody = `${body}${userInfo}`;

    // GitHub API Token aus Umgebungsvariablen
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
    
    if (!GITHUB_TOKEN) {
      console.warn('⚠️ GITHUB_TOKEN nicht gesetzt, Issue kann nicht erstellt werden');
      // Erstelle Issue-Template URL mit vorausgefüllten Daten
      const issueTemplateUrl = createIssueTemplateUrl(title, body);
      return res.status(503).json({ 
        detail: 'GitHub Integration nicht konfiguriert',
        fallback_url: issueTemplateUrl,
        message: 'Bitte erstelle das Issue manuell über den bereitgestellten Link'
      });
    }

    try {
      // Versuche Issue zu erstellen, ignoriere Labels wenn sie nicht existieren
      const issueData = {
        title,
        body: issueBody,
      };
      
      // Füge Labels nur hinzu, wenn sie angegeben wurden (GitHub wird automatisch validieren)
      // Wenn Labels nicht existieren, wird GitHub sie ignorieren oder einen Fehler geben
      // Wir versuchen es erstmal ohne Labels, dann mit Labels falls angegeben
      if (labels && labels.length > 0) {
        // Labels je nach Auth-Status
        issueData.labels = authenticated 
          ? ['user-reported', ...labels]
          : ['guest-reported', ...labels];
      }

      const githubResponse = await axios.post(
        'https://api.github.com/repos/Jacha93/smart-pantry/issues',
        issueData,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`, // Bearer ist für neue Tokens empfohlen, funktioniert auch mit token
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      res.json({
        success: true,
        data: {
          html_url: githubResponse.data.html_url,
          number: githubResponse.data.number,
        }
      });
    } catch (error) {
      console.error('❌ GitHub API Fehler:', error.response?.data || error.message);
      
      // Wenn der Fehler wegen nicht existierender Labels ist, versuche es ohne Labels
      if (error.response?.status === 422 && error.response?.data?.errors?.some((e) => e.resource === 'Label')) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('⚠️ Label-Fehler erkannt, versuche ohne Labels...');
        }
        try {
          const githubResponse = await axios.post(
            'https://api.github.com/repos/Jacha93/smart-pantry/issues',
            {
              title,
              body: issueBody,
            },
            {
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );

          return res.json({
            success: true,
            data: {
              html_url: githubResponse.data.html_url,
              number: githubResponse.data.number,
            }
          });
        } catch (retryError) {
          console.error('❌ Retry ohne Labels fehlgeschlagen:', retryError.response?.data || retryError.message);
          // Fallback zu Issue-Template URL
          const issueTemplateUrl = createIssueTemplateUrl(title, body);
          return res.status(500).json({ 
            detail: 'Fehler beim Erstellen des GitHub Issues',
            fallback_url: issueTemplateUrl,
            github_error: retryError.response?.data?.message || retryError.message
          });
        }
      }
      
      // Erstelle Issue-Template URL mit vorausgefüllten Daten als Fallback
      const issueTemplateUrl = createIssueTemplateUrl(title, body);
      res.status(500).json({ 
        detail: 'Fehler beim Erstellen des GitHub Issues',
        fallback_url: issueTemplateUrl,
        github_error: error.response?.data?.message || error.message
      });
    }
  } catch (error) {
    console.error('Issue-Endpoint Fehler:', error);
    // Versuche auch hier eine Fallback-URL zu erstellen
    const title = req.body?.title || 'Issue';
    const body = req.body?.body || '';
    const issueTemplateUrl = createIssueTemplateUrl(title, body);
    res.status(500).json({ 
      detail: 'Fehler beim Issue-Endpoint',
      fallback_url: issueTemplateUrl
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ detail: 'Internal server error' });
});

// Error-Handling für Server-Start
let server;
try {
  // In Docker muss der Server auf 0.0.0.0 hören für Port-Mapping
  const HOST = process.env.HOSTNAME || '0.0.0.0';
  server = app.listen(PORT, HOST, () => {
    console.log(`✅ API listening on http://${HOST}:${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} ist bereits belegt!`);
      console.error(`   Bitte beende den anderen Prozess:`);
      console.error(`   kill $(lsof -t -i:${PORT})`);
      console.error(`   Oder ändere PORT in .env\n`);
    } else {
      console.error('❌ Server-Fehler:', error);
    }
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Fehler beim Starten des Servers:', error);
  process.exit(1);
}

// Graceful shutdown
async function shutdown(signal, exitCode = 0) {
  console.log(`${signal} signal received: closing HTTP server`);
  await prisma.$disconnect();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(exitCode);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Unhandled Promise Rejections abfangen
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Server nicht sofort beenden, nur loggen (für Production)
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION', 1);
});


