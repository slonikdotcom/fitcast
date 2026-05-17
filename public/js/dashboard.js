/* ============================================================
   FitCast — дашборд
   Динамічно рендерить картки сьогоднішніх тренувань.
   Кожна картка — посилання на add-workout.html?id=X (редагування).
   ============================================================ */

(function () {
  document.addEventListener('DOMContentLoaded', init);

  /* Підставити ім'я зі збереженого профілю */
  function renderGreeting() {
    const U = window.FitCastUser;
    const greetingEl = document.getElementById('dashboardGreeting');
    if (!U || !greetingEl) return;
    const profile = U.get();
    greetingEl.textContent = 'Вітаю, ' + profile.name;
  }

  function init() {
    renderGreeting();

    const D = window.FitCastWorkouts;
    if (!D) {
      console.error('FitCastWorkouts не завантажено (перевір workouts-data.js)');
      return;
    }

    const container = document.getElementById('workoutsToday');
    if (!container) return;

    const todays = D.getToday();

    if (todays.length === 0) {
      container.innerHTML = '<div class="workout-empty">Сьогодні тренувань ще не заплановано. ' +
                            '<a href="add-workout.html">Додати тренування →</a></div>';
      return;
    }

    container.innerHTML = ''; // очистити (якщо лишилось)
    todays.forEach(function (w) {
      const meta = D.getTypeMeta(w.type);
      const link = document.createElement('a');
      link.href = 'add-workout.html?id=' + w.id;
      link.className = 'workout-card workout-card--link';
      link.setAttribute('aria-label',
        'Редагувати тренування: ' + meta.label + ', ' + D.formatTimeRange(w));
      link.innerHTML =
        '<span class="workout-card__time">' + D.formatTimeRange(w) + '</span> ' +
        '<span class="workout-card__type">' + meta.emoji + ' ' + meta.label.toLowerCase() + '</span>' +
        '<span class="workout-card__hint">Натисни, щоб редагувати →</span>';
      container.appendChild(link);
    });
  }
})();
