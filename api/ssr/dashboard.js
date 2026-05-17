/* ============================================================
   GET /api/ssr/dashboard
   Серверно-рендерить React-фрагменти для дашборду:
     - привітання з ім'ям з БД (cookie сесії)
     - картки сьогоднішніх тренувань
     - тема (dark / light) залежно від серверного часу
   Повертає JSON: { theme, greetingHtml, workoutsHtml, todayCount }
   ============================================================ */

const { query } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');
const { React, renderToHtml, getThemeByTime } = require('../_lib/ssr');
const DashboardGreeting = require('../_lib/components/DashboardGreeting');
const WorkoutListSSR = require('../_lib/components/WorkoutListSSR');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Метод не дозволений' });
  }

  try {
    // Сьогоднішня дата за серверним часом
    const now = new Date();
    const today = now.getFullYear() + '-' +
                  String(now.getMonth() + 1).padStart(2, '0') + '-' +
                  String(now.getDate()).padStart(2, '0');

    // Дістаємо сьогоднішні тренування з БД
    const workouts = await query(
      `SELECT id, type, type_custom, date::text, time_start::text, duration, place
       FROM workouts
       WHERE user_id = $1 AND date = $2
       ORDER BY time_start`,
      [user.id, today]
    );

    // Серверний React-рендер
    const greetingHtml = renderToHtml(
      React.createElement(DashboardGreeting, {
        user: user,
        todayCount: workouts.length
      })
    );

    const workoutsHtml = renderToHtml(
      React.createElement(WorkoutListSSR, {
        workouts: workouts,
        emptyText: 'Сьогодні тренувань ще не заплановано.'
      })
    );

    return res.status(200).json({
      theme:        getThemeByTime(now),
      serverTime:   now.toISOString(),
      greetingHtml: greetingHtml,
      workoutsHtml: workoutsHtml,
      todayCount:   workouts.length
    });
  } catch (err) {
    console.error('[ssr:dashboard] error:', err);
    return res.status(500).json({ error: 'Помилка SSR' });
  }
};
