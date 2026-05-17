// GET /api/ssr/history — SSR-картки історії з фільтрами.
const { query } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');
const { React, renderToHtml, getThemeByTime } = require('../_lib/ssr');
const { TYPE_META, PLACE_META } = require('../_lib/components/WorkoutListSSR');

const h = React.createElement;

function WorkoutFullCard({ w }) {
  const type  = TYPE_META[w.type] || TYPE_META.other;
  const place = PLACE_META[w.place] || PLACE_META.other;
  const [y, mo, d] = String(w.date).split('-');
  const timeStart = String(w.time_start || '').substring(0, 5);
  const title = w.type === 'other' && w.type_custom ? w.type_custom : type.label;

  return h('div', {
    className: 'wcard',
    'data-id': w.id,
    'data-type': w.type,
    'data-date': w.date,
    'data-place': w.place,
    'data-duration': w.duration
  },
    h('div', { className: 'wcard__header' },
      h('div', { className: 'wcard__main' },
        h('span', { className: 'wcard__emoji' }, type.emoji),
        h('div', null,
          h('div', { className: 'wcard__title' }, title),
          h('div', { className: 'wcard__meta' },
            d + '.' + mo + '.' + y + ' · ' + timeStart + ' · ' + w.duration + ' хв')
        )
      ),
      h('div', { className: 'wcard__right' },
        h('span', { className: 'badge badge--' + place.badge }, place.label),
        h('span', { className: 'wcard__arrow' }, '▼')
      )
    ),
    h('div', { className: 'wcard__body' },
      h('div', { className: 'wcard__mood-label' }, 'Самопочуття після:'),
      h('div', { className: 'mood-group' },
        ...['💪 Відмінно', '😊 Добре', '😐 Нормально', '😴 Втомився'].map(function (m) {
          return h('span', {
            key: m,
            className: 'mood-btn' + (w.mood === m ? ' selected' : '')
          }, m);
        })
      ),
      h('div', { className: 'form__group', style: { marginTop: 16 } },
        h('label', { className: 'form__label' }, 'Нотатки'),
        h('textarea', { defaultValue: w.notes || '', placeholder: 'Як пройшло тренування?' })
      ),
      h('div', { className: 'form__group' },
        h('label', { className: 'form__label' }, 'Фото з тренування'),
        h('div', { className: 'photo-input' + (w.photo ? ' photo-input--has-image' : '') },
          h('input', { type: 'file', accept: 'image/*', className: 'photo-input__file' }),
          h('div', { className: 'photo-input__display', role: 'button', tabIndex: 0 },
            h('img', { className: 'photo-input__img', src: w.photo || undefined, alt: 'Фото тренування' }),
            h('div', { className: 'photo-input__placeholder' },
              h('span', { className: 'photo-input__camera-icon', 'aria-hidden': 'true' }, '📷'),
              h('span', null, 'Додати фото')
            )
          ),
          h('button', { type: 'button', className: 'photo-input__remove', 'aria-label': 'Прибрати фото' }, '✕')
        )
      ),
      h('div', { className: 'wcard__actions' },
        h('a', { href: '/add-workout?id=' + w.id, className: 'wcard__edit-link' }, '✏️ Редагувати у формі'),
        h('button', { className: 'form__btn', 'data-action': 'save' }, 'Зберегти'),
        h('button', { className: 'form__btn form__btn--danger', 'data-action': 'delete' }, '🗑 Видалити')
      )
    )
  );
}

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Метод не дозволений' });
  }

  try {
    // Збираємо фільтри з query params (передаються з клієнта)
    const filters = [];
    const params = [user.id];
    let idx = 2;

    if (req.query.type) {
      filters.push(`type = $${idx++}`); params.push(req.query.type);
    }
    if (req.query.from) {
      filters.push(`date >= $${idx++}`); params.push(req.query.from);
    }
    if (req.query.to) {
      filters.push(`date <= $${idx++}`); params.push(req.query.to);
    }
    if (req.query.place === 'outdoor') {
      filters.push(`place = 'outdoor'`);
    } else if (req.query.place === 'indoor') {
      filters.push(`place != 'outdoor'`);
    }
    if (req.query.minDuration) {
      filters.push(`duration >= $${idx++}`); params.push(parseInt(req.query.minDuration, 10) || 0);
    }

    const where = filters.length > 0
      ? 'AND ' + filters.join(' AND ')
      : '';

    const workouts = await query(
      `SELECT id, type, type_custom, date::text, time_start::text, duration,
              place, notes, mood, photo
       FROM workouts
       WHERE user_id = $1 ${where}
       ORDER BY date DESC, time_start`,
      params
    );

    // Загальна кількість (без фільтрів) — для лічильника
    const totalRow = await query(
      'SELECT COUNT(*)::int AS total FROM workouts WHERE user_id = $1',
      [user.id]
    );
    const total = totalRow[0].total;

    // Серверно-рендеримо
    const listHtml = workouts.length > 0
      ? renderToHtml(h('div', null, ...workouts.map(w => h(WorkoutFullCard, { key: w.id, w }))))
      : '';

    return res.status(200).json({
      theme:    getThemeByTime(new Date()),
      listHtml: listHtml,
      total:    total,
      filtered: workouts.length
    });
  } catch (err) {
    console.error('[ssr:history] error:', err);
    return res.status(500).json({ error: 'Помилка SSR' });
  }
};
