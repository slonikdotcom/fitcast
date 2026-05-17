// POST /api/auth/register — створює юзера, видає JWT-cookie.
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../_lib/db');
const { signToken, setAuthCookie } = require('../_lib/auth');
const V = require('../_lib/validation');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Метод не дозволений' });
  }

  const { name, email, password } = req.body || {};

  // Валідація
  if (!V.isName(name)) {
    return res.status(400).json({ error: "Ім'я: 2–30 літер, без цифр і символів" });
  }
  if (!V.isEmail(email)) {
    return res.status(400).json({ error: 'Невірний формат email' });
  }
  if (!V.isPassword(password)) {
    return res.status(400).json({ error: `Пароль має містити мінімум ${V.MIN_PASSWORD_LENGTH} символів` });
  }

  try {
    // Перевіряємо унікальність email
    const existing = await queryOne(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    if (existing) {
      return res.status(409).json({ error: 'Користувач з таким email вже існує' });
    }

    // Хешуємо пароль (10 раундів — стандарт для прод-якості)
    const passwordHash = await bcrypt.hash(password, 10);

    // Вставляємо нового користувача
    const rows = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, city, avatar, joined_date,
                 temp_min, temp_max, wind_max, rain_preference,
                 hour_start, hour_end`,
      [name.trim(), email.trim().toLowerCase(), passwordHash]
    );
    const user = rows[0];

    // Встановлюємо cookie сесії
    const token = signToken(user.id);
    setAuthCookie(res, token);

    return res.status(201).json({ user });
  } catch (err) {
    console.error('[register] error:', err);
    return res.status(500).json({ error: 'Помилка сервера. Спробуй ще раз.' });
  }
};
