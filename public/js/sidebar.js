// Бічна панель і logout.
(function () {
  // Чекаємо, доки DOM повністю завантажиться
  document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const burger  = document.getElementById('burgerBtn');

    if (!sidebar || !burger) return; // сторінка без sidebar (наприклад, лендінг)

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (!sidebar.contains(e.target) && !burger.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });

    const logoutLink = sidebar.querySelector('a[href*="login"]');
    if (logoutLink && logoutLink.textContent.trim().toLowerCase().includes('вийти')) {
      logoutLink.addEventListener('click', async function (e) {
        e.preventDefault();
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (_) { /* не критично — все одно перенаправляємо */ }
        window.location.href = '/login';
      });
    }
  });
})();
