/* ============================================================
   FitCast — спільна логіка бічної панелі (sidebar)
   Лаба 3: винесено з інлайнового JS, єдиний скрипт на всі приватні сторінки.
   ============================================================ */

(function () {
  // Чекаємо, доки DOM повністю завантажиться
  document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const burger  = document.getElementById('burgerBtn');

    if (!sidebar || !burger) return; // сторінка без sidebar (наприклад, лендінг)

    /* --- Подія 1: клік по burger-кнопці --- */
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    /* --- Подія 2: клік поза sidebar — закрити його --- */
    document.addEventListener('click', function (e) {
      if (!sidebar.contains(e.target) && !burger.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });

    /* --- Подія 3: натискання Esc на клавіатурі --- */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  });
})();
