# FitCast

**Веб-застосунок для трекінгу тренувань з урахуванням погодних умов.**

Production: [fitcast-eight.vercel.app](https://fitcast-eight.vercel.app)
Курсова робота: Подпала Тамара, КМ-32

FitCast — це особистий простір для планування і логування тренувань з
вбудованим аналізом прогнозу погоди. Застосунок автоматично виділяє години,
що є найсприятливішими для занять на вулиці — за температурою, вітром і
опадами — і зберігає історію усіх занять з нотатками та фото.

## Можливості

- Реєстрація і авторизація з безпечним зберіганням паролів (bcrypt + JWT в HTTP-only cookies)
- Логування тренувань: тип, час, тривалість, локація, нотатки, фото
- Дашборд з розкладом на сьогодні і персональним привітанням (server-side rendered)
- Інтерактивний React-віджет прогнозу погоди з табами «Сьогодні / Завтра / Тиждень»
- Автоматичне визначення сприятливих годин на основі індивідуальних порогів користувача
- Історія тренувань з фільтрами, сортуванням і зведеною статистикою
- Профіль з налаштуваннями погоди (діапазон температур, вітру, годин активності) і аватаром
- Лайтбокс для перегляду фото тренувань
- Адаптивний дизайн, темна/світла тема за серверним часом доби

## Стек

- **Frontend:** Vanilla JS + React 18 (через UMD CDN та Babel-standalone), React Router 5, CSS з Flexbox і Grid
- **Backend:** Node.js serverless functions на (все через Vercel)
- **БД:** PostgreSQL на Neon
- **Auth:** bcryptjs (10 раундів) + JWT в HTTP-only cookies, TTL 7 днів
- **Зовнішнє API:** OpenWeatherMap

## Структура

```
fitcast/
├── api/                          # Serverless-функції Vercel
│   ├── _lib/
│   │   ├── auth.js               # JWT + cookies + requireAuth
│   │   ├── db.js                 # Postgres pool (Neon)
│   │   ├── ssr.js                # React renderToStaticMarkup helper
│   │   ├── validation.js         # Серверна валідація
│   │   └── components/           # SSR React-компоненти
│   ├── auth/                     # register / login / logout / me
│   ├── workouts/                 # CRUD тренувань (index.js + [id].js)
│   ├── profile/                  # Профіль і налаштування погоди
│   ├── ssr/                      # SSR-фрагменти (dashboard, history)
│   └── weather.js                # Проксі до OpenWeatherMap (ховає API-ключ)
├── public/                       # Статика
│   ├── *.html                    # 8 сторінок (лендинг, auth, дашборд тощо)
│   ├── style.css                 # Усі стилі
│   └── js/                       # Клієнтський JS і JSX-віджет погоди
├── scripts/
│   ├── schema.sql                # Postgres-схема (users, workouts, тригери, індекси)
│   └── init-db.js                # CLI: npm run db:init
├── package.json
├── vercel.json                   # Clean URLs + rewrites + cache headers
└── .env.local                    # Локальні секрети (у .gitignore)
```
