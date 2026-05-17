/* ============================================================
   FitCast — підключення до Postgres (Neon)
   Експортує єдиний pool, кешований на рівні модуля,
   щоб теплі serverless-інстанси перевикористовували з'єднання.
   ============================================================ */

const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        '[FitCast/db] DATABASE_URL не задано. ' +
        'Локально: переконайся що в .env.local є рядок DATABASE_URL=postgresql://... ' +
        'На Vercel: додай Environment Variable DATABASE_URL у Project Settings.'
      );
    }
    pool = new Pool({
      connectionString,
      // Neon вимагає SSL; рядок sslmode=require це покриває,
      // але дублюємо для надійності.
      ssl: { rejectUnauthorized: false },
      // У serverless ліпше тримати мало з'єднань на інстанс
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000
    });

    pool.on('error', (err) => {
      console.error('[FitCast/db] Unexpected error on idle client', err);
    });
  }
  return pool;
}

/**
 * Виконати SQL-запит. Параметризовані запити для захисту від SQL-ін'єкцій.
 * @example
 *   const rows = await query('SELECT * FROM users WHERE id = $1', [userId]);
 */
async function query(text, params) {
  const res = await getPool().query(text, params);
  return res.rows;
}

/**
 * Виконати запит, що очікує максимум один рядок.
 * Повертає об'єкт або null.
 */
async function queryOne(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

module.exports = { getPool, query, queryOne };
