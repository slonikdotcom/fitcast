/* ============================================================
   FitCast — конфіг для OpenWeatherMap API
   Лаба 4: підключення до зовнішнього сервісу погоди.

   📌 Як отримати API-ключ:
      1. https://openweathermap.org/api → Sign up
      2. Підтвердити email → My API keys у профілі
      3. Скопіювати ключ і вставити нижче замість 'YOUR_API_KEY_HERE'
      ⚠️ Активація нового ключа займає до ~10 хв.
   ============================================================ */

(function () {
  const CONFIG = {
    // ⚠️ Заміни цей рядок на свій ключ
    API_KEY: 'YOUR_API_KEY_HERE',

    // Базова URL OpenWeatherMap forecast endpoint
    API_URL: 'https://api.openweathermap.org/data/2.5/forecast',

    // Одиниці виміру (metric = °C, m/s)
    UNITS: 'metric',
    LANG: 'uk',

    // Таймаут запиту (мс) — 15 сек на випадок cold start Vercel
    TIMEOUT: 15000,

    // За замовчуванням
    DEFAULT_CITY: 'Kyiv',

    // Порогові значення для "сприятливих годин"
    GOOD_WEATHER: {
      tempMin: 10,     // °C
      tempMax: 25,     // °C
      windMax: 10,     // м/с
      // Якщо в погоді є дощ/сніг — не сприятливо
      badConditions: ['Rain', 'Snow', 'Thunderstorm', 'Drizzle']
    },

    // Скільки годин показувати початково (стрімінг)
    INITIAL_HOURS: 8,
    // Скільки додавати при скролі
    STREAM_CHUNK: 8
  };

  // Чи має ключ значення (а не плейсхолдер)?
  CONFIG.hasValidKey = function () {
    return CONFIG.API_KEY && CONFIG.API_KEY !== 'YOUR_API_KEY_HERE' && CONFIG.API_KEY.length > 10;
  };

  window.FitCastWeatherConfig = CONFIG;
})();
