# FitCast

Веб-застосунок для трекінгу тренувань з урахуванням погодних умов.
Курсова робота: Подпала Тамара, КМ-32.

## Стек

- **Frontend:** Vanilla JS + React (через CDN+Babel) + CSS
- **Backend:** Node.js serverless-функції на Vercel
- **DB:** PostgreSQL (Neon)
- **Auth:** bcrypt + JWT в HTTP-only cookies
- **External API:** OpenWeatherMap (прогноз погоди)

## Структура

```
fitcast/
├── api/                    # Serverless-функції Vercel
│   ├── _lib/               # Хелпери (db, auth, ssr) — не endpoint'и
│   ├── auth/               # /api/auth/register, /login, /logout, /me
│   ├── workouts/           # CRUD тренувань
│   ├── profile/            # Профіль і аватар
│   └── ssr/                # React SSR-фрагменти
├── public/                 # Статичні файли (HTML, CSS, JS)
│   ├── *.html
│   ├── style.css
│   └── js/
├── scripts/                # CLI-скрипти (міграції БД тощо)
├── package.json
├── vercel.json
└── .env.local              # Локальні секрети (НЕ комітимо)
```

## Локальна розробка

1. Встанови залежності:
   ```bash
   npm install
   ```

2. Скопіюй `.env.example` у `.env.local` та заповни:
   ```bash
   cp .env.example .env.local
   ```

3. Ініціалізуй БД (створює таблиці в Neon Postgres):
   ```bash
   npm run db:init
   ```

4. Запусти dev-сервер:
   ```bash
   npm run dev
   ```

Сервер запуститься на `http://localhost:3000`.

## Deploy на Vercel

1. Запушай проект у GitHub
2. На vercel.com → Add New → Project → імпортуй репозиторій
3. У Settings → Environment Variables додай ті самі змінні, що в `.env.local`,
   але з **POOLED** connection string для `DATABASE_URL`
4. Deploy
