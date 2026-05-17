/* ============================================================
   /api/workouts
   GET  — список тренувань поточного користувача
   POST — створити нове тренування
   ============================================================ */

const { query } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');
const V = require('../_lib/validation');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return; // 401 вже відправлено

  if (req.method === 'GET') return list(req, res, user);
  if (req.method === 'POST') return create(req, res, user);

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Метод не дозволений' });
};

async function list(req, res, user) {
  try {
    const rows = await query(
      `SELECT id, type, type_custom, date::text, time_start::text, duration,
              place, notes, mood, photo, created_at, updated_at
       FROM workouts
       WHERE user_id = $1
       ORDER BY date DESC, time_start`,
      [user.id]
    );
    return res.status(200).json({ workouts: rows });
  } catch (err) {
    console.error('[workouts:list] error:', err);
    return res.status(500).json({ error: 'Не вдалося отримати тренування' });
  }
}

async function create(req, res, user) {
  const body = req.body || {};
  const { type, type_custom, date, time_start, duration, place, notes, mood, photo } = body;

  if (!V.isWorkoutType(type)) {
    return res.status(400).json({ error: 'Невірний тип тренування' });
  }
  if (!V.isIsoDate(date)) {
    return res.status(400).json({ error: 'Невірна дата (формат YYYY-MM-DD)' });
  }
  if (!V.isTime(time_start)) {
    return res.status(400).json({ error: 'Невірний час (формат HH:MM)' });
  }
  if (!V.isPositiveInt(duration, 600)) {
    return res.status(400).json({ error: 'Тривалість: 1–600 хвилин' });
  }
  if (!V.isWorkoutPlace(place)) {
    return res.status(400).json({ error: 'Невірне місце' });
  }
  if (photo !== undefined && photo !== null && photo !== '' && !V.isImageDataUrl(photo)) {
    return res.status(400).json({ error: 'Фото повинно бути зображенням до 5 МБ' });
  }

  try {
    const rows = await query(
      `INSERT INTO workouts
         (user_id, type, type_custom, date, time_start, duration, place, notes, mood, photo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, type, type_custom, date::text, time_start::text, duration,
                 place, notes, mood, photo, created_at, updated_at`,
      [
        user.id,
        type,
        type === 'other' ? (type_custom || null) : null,
        date,
        time_start,
        parseInt(duration, 10),
        place,
        notes || null,
        mood || null,
        photo || null
      ]
    );
    return res.status(201).json({ workout: rows[0] });
  } catch (err) {
    console.error('[workouts:create] error:', err);
    return res.status(500).json({ error: 'Не вдалося створити тренування' });
  }
}
