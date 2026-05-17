/* ============================================================
   /api/profile
   GET — повертає профіль поточного користувача
   PUT — оновити name/email/city/weather settings/avatar
   ============================================================ */

const { query } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');
const V = require('../_lib/validation');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') return res.status(200).json({ profile: user });
  if (req.method === 'PUT') return update(req, res, user);

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Метод не дозволений' });
};

async function update(req, res, user) {
  const body = req.body || {};
  const sets = [];
  const params = [];
  let idx = 1;

  if (body.name !== undefined) {
    if (!V.isName(body.name)) return res.status(400).json({ error: "Невірне ім'я" });
    sets.push(`name = $${idx++}`); params.push(body.name.trim());
  }
  if (body.email !== undefined) {
    if (!V.isEmail(body.email)) return res.status(400).json({ error: 'Невірний email' });
    sets.push(`email = $${idx++}`); params.push(body.email.trim().toLowerCase());
  }
  if (body.city !== undefined) {
    if (typeof body.city !== 'string' || body.city.length === 0 || body.city.length > 50) {
      return res.status(400).json({ error: 'Невірне місто' });
    }
    sets.push(`city = $${idx++}`); params.push(body.city);
  }
  if (body.avatar !== undefined) {
    if (body.avatar !== null && body.avatar !== '' && !V.isImageDataUrl(body.avatar)) {
      return res.status(400).json({ error: 'Аватар: зображення до 5 МБ' });
    }
    sets.push(`avatar = $${idx++}`); params.push(body.avatar || null);
  }

  // Weather settings — можна оновлювати окремо
  const ws = body.weatherSettings || body.weather_settings || {};
  if (ws.tempMin !== undefined) {
    sets.push(`temp_min = $${idx++}`); params.push(parseInt(ws.tempMin, 10));
  }
  if (ws.tempMax !== undefined) {
    sets.push(`temp_max = $${idx++}`); params.push(parseInt(ws.tempMax, 10));
  }
  if (ws.windMax !== undefined) {
    sets.push(`wind_max = $${idx++}`); params.push(parseInt(ws.windMax, 10));
  }
  if (ws.rain !== undefined) {
    if (!V.isRainPref(ws.rain)) return res.status(400).json({ error: 'Невірне налаштування опадів' });
    sets.push(`rain_preference = $${idx++}`); params.push(ws.rain);
  }

  if (sets.length === 0) {
    return res.status(400).json({ error: 'Нема полів для оновлення' });
  }

  params.push(user.id);
  try {
    const rows = await query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}
       RETURNING id, name, email, city, avatar, joined_date,
                 temp_min, temp_max, wind_max, rain_preference`,
      params
    );
    return res.status(200).json({ profile: rows[0] });
  } catch (err) {
    if (err.code === '23505') { // unique_violation на email
      return res.status(409).json({ error: 'Email вже використовується' });
    }
    console.error('[profile:update] error:', err);
    return res.status(500).json({ error: 'Не вдалося оновити профіль' });
  }
}
