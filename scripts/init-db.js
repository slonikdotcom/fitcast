#!/usr/bin/env node
/* ============================================================
   FitCast — ініціалізація БД
   Створює таблиці у Postgres (Neon), якщо їх ще немає.
   Запуск: npm run db:init
   ============================================================ */

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL не знайдено у .env.local');
    process.exit(1);
  }

  console.log('🔌 Підключаємось до Neon Postgres...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // Перевірка з'єднання
    const versionRes = await client.query('SELECT version()');
    console.log('✓ Підключено:', versionRes.rows[0].version.split(' on ')[0]);

    // Читаємо schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('📄 Виконуємо schema.sql...');

    await client.query(schema);

    // Перевіряємо що таблиці створені
    const tablesRes = await client.query(`
      SELECT table_name, (
        SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = t.table_name
      ) AS columns
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'workouts')
      ORDER BY table_name
    `);

    if (tablesRes.rows.length === 0) {
      console.error('❌ Таблиці не створено');
      process.exit(1);
    }

    console.log('\n✅ Таблиці у БД:');
    tablesRes.rows.forEach(row => {
      console.log(`   • ${row.table_name} (${row.columns} колонок)`);
    });

    client.release();
    await pool.end();

    console.log('\n🎉 Готово! БД проініціалізовано.');
    console.log('   Подивись таблиці у Neon Dashboard → Tables.');
  } catch (err) {
    console.error('\n❌ Помилка:', err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
      console.error('   Перевір DATABASE_URL у .env.local — можливо там опечатка.');
    }
    if (err.message.includes('password authentication failed')) {
      console.error('   Невірний пароль у DATABASE_URL. Скопіюй ще раз з Neon Dashboard.');
    }
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

main();
