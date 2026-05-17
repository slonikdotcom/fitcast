/* ============================================================
   POST /api/auth/login
   Body: { email, password }
   Перевіряє пароль через bcrypt.compare, встановлює сесію.
   ============================================================ */

const bcrypt = require('bcryptjs');
const { queryOne } = require('../_lib/db');
const { signToken, setAuthCookie } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Метод не дозволений' });
  }

  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'Вкажи email та пароль' });
  }

  try {
    const user = await queryOne(
      `SELECT id, name, email, password_hash, city, avatar, joined_date,
              temp_min, temp_max, wind_max, rain_preference,
              hour_start, hour_end
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    );

    // Однакове повідомлення для "немає користувача" та "неправильний пароль" —
    // це захист від email enumeration атак.
    if (!user) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }

    // Видаляємо password_hash з відповіді — не повертаємо клієнту
    delete user.password_hash;

    const token = signToken(user.id);
    setAuthCookie(res, token);

    return res.status(200).json({ user });
  } catch (err) {
    console.error('[login] error:', err);
    return res.status(500).json({ error: 'Помилка сервера. Спробуй ще раз.' });
  }
};
