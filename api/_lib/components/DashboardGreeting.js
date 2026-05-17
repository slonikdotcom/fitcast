/* ============================================================
   <DashboardGreeting> — серверно-рендерене привітання
   Показує: ім'я з БД + аватар + кількість тренувань сьогодні
   ============================================================ */

const React = require('react');
const h = React.createElement;

function DashboardGreeting(props) {
  const { user, todayCount } = props;
  const initial = (user.name || 'X').charAt(0).toUpperCase();

  const avatarChild = user.avatar
    ? h('img', { src: user.avatar, alt: '', className: 'ssr-greeting__avatar-img' })
    : h('span', { className: 'ssr-greeting__avatar-letter' }, initial);

  return h('div', { className: 'ssr-greeting' },
    h('div', { className: 'ssr-greeting__avatar' + (user.avatar ? ' ssr-greeting__avatar--photo' : '') }, avatarChild),
    h('div', { className: 'ssr-greeting__text' },
      h('h1', { className: 'ssr-greeting__title' }, 'Вітаю, ', user.name),
      h('p', { className: 'ssr-greeting__sub' },
        todayCount > 0
          ? `Заплановано тренувань на сьогодні: ${todayCount}`
          : 'Сьогодні тренувань ще не заплановано'
      )
    )
  );
}

module.exports = DashboardGreeting;
