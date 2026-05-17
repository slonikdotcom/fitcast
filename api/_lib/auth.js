// JWT + cookies + requireAuth для захищених ендпоїнтів.
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const { queryOne } = require('./db');

const COOKIE_NAME = 'fitcast_session';
const TOKEN_TTL = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 днів у секундах

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      '[FitCast/auth] JWT_SECRET не задано. Згенеруй: ' +
      'node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))" ' +
      'і додай у .env.local або у Vercel Environment Variables.'
    );
  }
  return secret;
}

/**
 * Створює JWT для користувача.
 */
function signToken(userId) {
  return jwt.sign({ uid: userId }, getSecret(), { expiresIn: TOKEN_TTL });
}

/**
 * Верифікує токен. Повертає payload або null.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

/**
 * Встановлює HTTP-only cookie з токеном у response.
 */
function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const serialized = cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE
  });
  res.setHeader('Set-Cookie', serialized);
}

/**
 * Очищує cookie сесії.
 */
function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const serialized = cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  res.setHeader('Set-Cookie', serialized);
}

/**
 * Витягує userId з cookie запиту. Повертає null якщо не авторизовано.
 */
function getUserIdFromRequest(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookie.parse(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const payload = verifyToken(token);
  return payload ? payload.uid : null;
}

/**
 * Завантажує користувача з БД за токеном (без password_hash).
 */
async function getUserFromRequest(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return null;
  return queryOne(
    `SELECT id, name, email, city, avatar, joined_date,
            temp_min, temp_max, wind_max, rain_preference,
            hour_start, hour_end
     FROM users WHERE id = $1`,
    [userId]
  );
}

/**
 * Middleware-style helper: вертає 401 якщо нема валідної сесії.
 * Використовувати на початку захищених endpoint'ів.
 *   const user = await requireAuth(req, res);
 *   if (!user) return; // 401 вже відправлений
 */
async function requireAuth(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Не авторизовано. Увійди в акаунт.' });
    return null;
  }
  return user;
}

module.exports = {
  COOKIE_NAME,
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  getUserIdFromRequest,
  getUserFromRequest,
  requireAuth
};
