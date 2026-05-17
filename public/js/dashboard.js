/* ============================================================
   FitCast — дашборд
   Лаба 5: контент рендериться на сервері через React SSR
   (/api/ssr/dashboard), клієнт лише отримує готовий HTML.
   ============================================================ */

(function () {
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const greetingHost = document.getElementById('dashboardGreeting');
    const workoutsHost = document.getElementById('workoutsToday');

    // Лоадер (поки чекаємо SSR-відповідь)
    if (greetingHost) greetingHost.textContent = 'Завантажуємо…';
    if (workoutsHost) workoutsHost.innerHTML = '<div class="workout-empty">Завантажуємо…</div>';

    try {
      const resp = await fetch('/api/ssr/dashboard', { credentials: 'same-origin' });
      if (resp.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!resp.ok) throw new Error('SSR-помилка');

      const data = await resp.json();

      // Динамічна тема (вночі — темна, на основі серверного часу)
      applyTheme(data.theme);

      // Вставляємо серверно-зрендерені фрагменти
      if (greetingHost) greetingHost.outerHTML = data.greetingHtml;
      if (workoutsHost) workoutsHost.outerHTML = data.workoutsHtml;
    } catch (err) {
      console.error('Dashboard SSR error:', err);
      if (workoutsHost) {
        workoutsHost.innerHTML = '<div class="workout-empty">Помилка завантаження. ' +
                                  '<button onclick="location.reload()">Спробувати ще</button></div>';
      }
    }
  }

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme || 'light');
  }
})();
