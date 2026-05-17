// Підлаштовує публічні сторінки під залогіненого користувача.
// «Почати» / «Створити акаунт» → /dashboard; кнопки «Вхід» і «Реєстрація» ховаються.

(function () {
  document.addEventListener('DOMContentLoaded', async function () {
    let user = null;
    try {
      const resp = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (resp.ok) {
        const data = await resp.json();
        user = data.user;
      }
    } catch (_) { /* offline або помилка — лишаємо публічний вигляд */ }

    if (!user) return;

    document.body.classList.add('is-authed');

    // Усі посилання, що ведуть на реєстрацію або вхід, перевести на дашборд
    document.querySelectorAll('a[href*="register"], a[href*="login"]').forEach(function (a) {
      const isNavLogin = a.classList.contains('navbar__btn');
      if (isNavLogin) {
        a.hidden = true; // у верхній панелі лендингу ховаємо кнопки «Вхід» і «Реєстрація»
        return;
      }
      a.href = '/dashboard';
      // CTA-кнопки лендингу й about — поміняти текст
      if (a.classList.contains('hero__btn')) a.textContent = 'У дашборд';
    });

    // На лендингу area-map'и ведуть на register — перевести на dashboard
    document.querySelectorAll('area[href*="register"]').forEach(function (area) {
      area.href = '/dashboard';
    });

    // Якщо у нав-барі лишилось лише посилання «Про FitCast» — додамо невелику плашку з імʼям
    const navbar = document.querySelector('.navbar__links');
    if (navbar && !navbar.querySelector('.navbar__user')) {
      const li = document.createElement('li');
      li.className = 'navbar__user';
      li.innerHTML = '<a href="/dashboard" class="navbar__btn">' +
                     'Вітаю, ' + escapeHtml(user.name) + ' →</a>';
      navbar.appendChild(li);
    }

    // About-сторінка: підлаштувати CTA-блок під вже залогіненого
    const aboutTitle = document.querySelector('.about-cta__title');
    const aboutSub   = document.querySelector('.about-cta__sub');
    if (aboutTitle) aboutTitle.textContent = 'Радий тебе бачити, ' + user.name + '!';
    if (aboutSub)   aboutSub.textContent   = 'Поверни до своїх тренувань — твій дашборд чекає.';
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
