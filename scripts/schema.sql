-- Схема Postgres для FitCast. Виконується через npm run db:init.

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  city            TEXT NOT NULL DEFAULT 'Kyiv',
  avatar          TEXT,                              -- data URL з base64 або NULL
  joined_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- налаштування погоди для визначення сприятливих годин
  temp_min        INTEGER NOT NULL DEFAULT 10,
  temp_max        INTEGER NOT NULL DEFAULT 28,
  wind_max        INTEGER NOT NULL DEFAULT 10,
  rain_preference TEXT    NOT NULL DEFAULT 'none',   -- 'none' | 'light' | 'any'
  hour_start      INTEGER NOT NULL DEFAULT 6,        -- з якої години тренуватись (0–23)
  hour_end        INTEGER NOT NULL DEFAULT 22        -- до якої години (0–24)
);

-- Якщо таблиця вже існує — додати нові колонки (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS hour_start INTEGER NOT NULL DEFAULT 6;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hour_end   INTEGER NOT NULL DEFAULT 22;

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS workouts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                         -- 'run' | 'gym' | 'bike' | 'yoga' | 'swim' | 'other'
  type_custom TEXT,                                  -- якщо type='other', тут описова назва
  date        DATE NOT NULL,
  time_start  TIME NOT NULL,
  duration    INTEGER NOT NULL CHECK (duration > 0), -- хвилини
  place       TEXT NOT NULL,                         -- 'outdoor' | 'gym' | 'home' | 'other'
  notes       TEXT,
  mood        TEXT,                                  -- emoji+текст самопочуття
  photo       TEXT,                                  -- data URL з base64 або NULL
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date
  ON workouts (user_id, date DESC, time_start);

-- Тригер для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_workouts_updated_at ON workouts;
CREATE TRIGGER trg_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
