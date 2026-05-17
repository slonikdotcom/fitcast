/* GET /api/weather?city=Kyiv або /api/weather?lat=50.45&lon=30.52
   Проксі до OpenWeatherMap: ховає API-ключ на сервері.
   Лаба 6: один з власних REST-ендпоїнтів, що повертає JSON. */

const { requireAuth } = require('./_lib/auth');

const OWM_URL = 'https://api.openweathermap.org/data/2.5/forecast';

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Метод не дозволений' });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === 'your-owm-key-here') {
    return res.status(503).json({
      error: 'OPENWEATHER_API_KEY не налаштовано на сервері'
    });
  }

  const { city, lat, lon, lang, units } = req.query;
  const params = new URLSearchParams({
    appid: apiKey,
    units: units || 'metric',
    lang:  lang  || 'uk'
  });
  if (city) {
    params.set('q', city);
  } else if (lat && lon) {
    params.set('lat', lat);
    params.set('lon', lon);
  } else {
    return res.status(400).json({ error: 'Вкажи city або lat+lon' });
  }

  try {
    const owmResp = await fetch(OWM_URL + '?' + params.toString());
    if (!owmResp.ok) {
      if (owmResp.status === 404) return res.status(404).json({ error: 'Місто не знайдено' });
      if (owmResp.status === 401) return res.status(503).json({ error: 'API-ключ OpenWeatherMap невалідний' });
      if (owmResp.status === 429) return res.status(429).json({ error: 'Перевищено ліміт запитів до OpenWeatherMap' });
      return res.status(502).json({ error: 'OpenWeatherMap повернув ' + owmResp.status });
    }
    const data = await owmResp.json();
    // Кешуємо відповідь на 10 хвилин (CDN-кеш Vercel)
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (err) {
    console.error('[weather] error:', err);
    return res.status(500).json({ error: 'Помилка проксі OpenWeatherMap' });
  }
};
