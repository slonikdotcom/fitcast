/* ============================================================
   <WorkoutListSSR> — серверно-рендерений список тренувань
   Використовується на дашборді (сьогоднішні) та в історії (всі).
   ============================================================ */

const React = require('react');
const h = React.createElement;

const TYPE_META = {
  run:   { emoji: '🏃', label: 'Біг' },
  gym:   { emoji: '🏋️', label: 'Зал' },
  bike:  { emoji: '🚴', label: 'Велосипед' },
  yoga:  { emoji: '🧘', label: 'Йога' },
  swim:  { emoji: '🏊', label: 'Плавання' },
  other: { emoji: '✏️', label: 'Інше' }
};

const PLACE_META = {
  outdoor: { label: 'Вулиця', badge: 'outdoor' },
  gym:     { label: 'Зал',    badge: 'indoor' },
  home:    { label: 'Дім',    badge: 'indoor' },
  other:   { label: 'Інше',   badge: 'indoor' }
};

function calcTimeEnd(timeStart, durationMin) {
  const [h, m] = String(timeStart).split(':').map(Number);
  const totalMin = h * 60 + m + durationMin;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return String(endH).padStart(2, '0') + ':' + String(endM).padStart(2, '0');
}

function formatTimeRange(w) {
  const start = String(w.time_start || w.timeStart || '').substring(0, 5);
  return start + '–' + calcTimeEnd(start, w.duration);
}

function WorkoutCardCompact({ w }) {
  const type = TYPE_META[w.type] || TYPE_META.other;
  return h('a',
    { href: '/add-workout?id=' + w.id,
      className: 'workout-card workout-card--link ssr-workout-card',
      'aria-label': 'Редагувати тренування: ' + type.label + ', ' + formatTimeRange(w)
    },
    h('span', { className: 'workout-card__time' }, formatTimeRange(w)),
    ' ',
    h('span', { className: 'workout-card__type' }, type.emoji + ' ' + type.label.toLowerCase()),
    h('span', { className: 'workout-card__hint' }, 'Натисни, щоб редагувати →')
  );
}

function WorkoutListSSR({ workouts, emptyText }) {
  if (!workouts || workouts.length === 0) {
    return h('div', { className: 'workout-empty' },
      emptyText || 'Тренувань немає',
      ' ',
      h('a', { href: '/add-workout' }, 'Додати →')
    );
  }
  return h('div', { className: 'workouts-today' },
    ...workouts.map(function (w) {
      return h(WorkoutCardCompact, { key: w.id, w });
    })
  );
}

module.exports = WorkoutListSSR;
module.exports.WorkoutCardCompact = WorkoutCardCompact;
module.exports.TYPE_META = TYPE_META;
module.exports.PLACE_META = PLACE_META;
