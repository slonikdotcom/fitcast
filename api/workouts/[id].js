// /api/workouts/[id] — GET, PUT, DELETE.
const { query, queryOne } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');
const V = require('../_lib/validation');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const id = parseInt(req.query.id, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Невірний id' });
  }

  if (req.method === 'GET')    return getOne(req, res, user, id);
  if (req.method === 'PUT')    return update(req, res, user, id);
  if (req.method === 'DELETE') return remove(req, res, user, id);

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ error: 'Метод не дозволений' });
};

async function getOne(req, res, user, id) {
  try {
    const w = await queryOne(
      `SELECT id, type, type_custom, date::text, time_start::text, duration,
              place, notes, mood, photo, created_at, updated_at
       FROM workouts WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );
    if (!w) return res.status(404).json({ error: 'Тренування не знайдено' });
    return res.status(200).json({ workout: w });
  } catch (err) {
    console.error('[workouts:get] error:', err);
    return res.status(500).json({ error: 'Помилка сервера' });
  }
}

async function update(req, res, user, id) {
  const body = req.body || {};
  const allowed = ['type','type_custom','date','time_start','duration',
                   'place','notes','mood','photo'];

  // Валідація переданих полів (тільки тих, що є в body)
  if (body.type !== undefined && !V.isWorkoutType(body.type)) {
    return res.status(400).json({ error: 'Невірний тип' });
  }
  if (body.date !== undefined && !V.isIsoDate(body.date)) {
    return res.status(400).json({ error: 'Невірна дата' });
  }
  if (body.time_start !== undefined && !V.isTime(body.time_start)) {
    return res.status(400).json({ error: 'Невірний час' });
  }
  if (body.duration !== undefined && !V.isPositiveInt(body.duration, 600)) {
    return res.status(400).json({ error: 'Тривалість: 1–600 хв' });
  }
  if (body.place !== undefined && !V.isWorkoutPlace(body.place)) {
    return res.status(400).json({ error: 'Невірне місце' });
  }
  if (body.photo !== undefined && body.photo !== null && body.photo !== '' &&
      !V.isImageDataUrl(body.photo)) {
    return res.status(400).json({ error: 'Фото повинно бути зображенням до 5 МБ' });
  }

  // Будуємо динамічний UPDATE з полів, що передані
  const sets = [];
  const params = [];
  let idx = 1;
  for (const key of allowed) {
    if (body[key] !== undefined) {
      sets.push(`${key} = $${idx}`);
      params.push(body[key] === '' ? null : body[key]);
      idx++;
    }
  }
  if (sets.length === 0) {
    return res.status(400).json({ error: 'Нема полів для оновлення' });
  }

  params.push(id, user.id);
  try {
    const rows = await query(
      `UPDATE workouts SET ${sets.join(', ')}
       WHERE id = $${idx} AND user_id = $${idx + 1}
       RETURNING id, type, type_custom, date::text, time_start::text, duration,
                 place, notes, mood, photo, created_at, updated_at`,
      params
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Тренування не знайдено' });
    }
    return res.status(200).json({ workout: rows[0] });
  } catch (err) {
    console.error('[workouts:update] error:', err);
    return res.status(500).json({ error: 'Не вдалося оновити' });
  }
}

async function remove(req, res, user, id) {
  try {
    const result = await query(
      'DELETE FROM workouts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, user.id]
    );
    if (result.length === 0) {
      return res.status(404).json({ error: 'Тренування не знайдено' });
    }
    return res.status(200).json({ ok: true, id });
  } catch (err) {
    console.error('[workouts:delete] error:', err);
    return res.status(500).json({ error: 'Не вдалося видалити' });
  }
}
