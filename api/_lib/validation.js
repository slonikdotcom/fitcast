/* ============================================================
   FitCast — серверна валідація вхідних даних
   ============================================================ */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX  = /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ'\- ]{2,30}$/;
const MIN_PASSWORD_LENGTH = 8;

function isEmail(s)    { return typeof s === 'string' && EMAIL_REGEX.test(s.trim()); }
function isName(s)     { return typeof s === 'string' && NAME_REGEX.test(s.trim()); }
function isPassword(s) { return typeof s === 'string' && s.length >= MIN_PASSWORD_LENGTH; }

const ALLOWED_TYPES  = ['run','gym','bike','yoga','swim','other'];
const ALLOWED_PLACES = ['outdoor','gym','home','other'];
const ALLOWED_RAIN   = ['none','light','any'];

function isWorkoutType(s)  { return ALLOWED_TYPES.includes(s); }
function isWorkoutPlace(s) { return ALLOWED_PLACES.includes(s); }
function isRainPref(s)     { return ALLOWED_RAIN.includes(s); }

function isIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}
function isTime(s) {
  return typeof s === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(s);
}
function isPositiveInt(n, max) {
  const v = parseInt(n, 10);
  return Number.isFinite(v) && v > 0 && (!max || v <= max);
}

/**
 * Перевірка data URL (для аватара, photo).
 * Дозволяємо image/* з base64, обмежуємо розмір ~6 МБ
 * (5 МБ base64 ≈ 6.7 МБ символів).
 */
function isImageDataUrl(s, maxBytes = 7_000_000) {
  if (typeof s !== 'string') return false;
  if (!s.startsWith('data:image/')) return false;
  if (s.length > maxBytes) return false;
  return true;
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  isEmail, isName, isPassword,
  isWorkoutType, isWorkoutPlace, isRainPref,
  isIsoDate, isTime, isPositiveInt,
  isImageDataUrl,
  ALLOWED_TYPES, ALLOWED_PLACES, ALLOWED_RAIN
};
