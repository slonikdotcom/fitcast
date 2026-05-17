/* ============================================================
   FitCast — мок-дані OpenWeatherMap forecast endpoint
   Лаба 4: реалістичні дані для розробки без активного API-ключа.

   Структура точно як у відповіді справжнього API:
   https://openweathermap.org/forecast5
   ============================================================ */

(function () {
  /**
   * Генерує мок-прогноз: 40 точок (5 днів × 8 інтервалів по 3 години).
   * Стартує від сьогоднішнього 00:00 UTC.
   */
  function generateMockForecast(cityName) {
    cityName = cityName || 'Kyiv';
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const list = [];
    // Реалістичні шаблони на 5 днів: 8 точок на день (00, 03, 06, 09, 12, 15, 18, 21 UTC)
    const dayPatterns = [
      // День 1 — теплий і сонячний
      [ {t:11,w:'Clear',d:'ясно',ws:2.5,c:5,ic:'01n'},
        {t:10,w:'Clear',d:'ясно',ws:2.0,c:0,ic:'01n'},
        {t:12,w:'Clear',d:'ясно',ws:3.0,c:10,ic:'01d'},
        {t:16,w:'Clouds',d:'небагато хмар',ws:3.5,c:25,ic:'02d'},
        {t:19,w:'Clouds',d:'мінлива хмарність',ws:4.0,c:40,ic:'03d'},
        {t:22,w:'Clouds',d:'мінлива хмарність',ws:4.5,c:55,ic:'03d'},
        {t:18,w:'Clouds',d:'розсіяні хмари',ws:3.5,c:30,ic:'04d'},
        {t:14,w:'Clear',d:'ясно',ws:2.0,c:10,ic:'01n'} ],
      // День 2 — змішаний
      [ {t:12,w:'Clouds',d:'хмарно',ws:5.0,c:75,ic:'04n'},
        {t:11,w:'Clouds',d:'хмарно',ws:4.5,c:80,ic:'04n'},
        {t:13,w:'Clouds',d:'мінлива хмарність',ws:6.0,c:60,ic:'03d'},
        {t:17,w:'Clouds',d:'небагато хмар',ws:5.5,c:40,ic:'02d'},
        {t:20,w:'Clear',d:'ясно',ws:4.0,c:15,ic:'01d'},
        {t:21,w:'Clear',d:'ясно',ws:3.5,c:10,ic:'01d'},
        {t:18,w:'Clouds',d:'мінлива хмарність',ws:4.0,c:35,ic:'03d'},
        {t:14,w:'Clouds',d:'мінлива хмарність',ws:5.0,c:50,ic:'03n'} ],
      // День 3 — дощовий
      [ {t:13,w:'Rain',  d:'легкий дощ',     ws:7.0,c:90,ic:'10n',rain:0.5},
        {t:12,w:'Rain',  d:'дощ',            ws:7.5,c:95,ic:'10n',rain:1.2},
        {t:14,w:'Rain',  d:'дощ',            ws:8.0,c:90,ic:'10d',rain:2.0},
        {t:16,w:'Rain',  d:'легкий дощ',     ws:7.5,c:85,ic:'10d',rain:0.8},
        {t:18,w:'Clouds',d:'мінлива хмарність',ws:6.0,c:60,ic:'03d'},
        {t:19,w:'Clouds',d:'хмарно',         ws:5.5,c:75,ic:'04d'},
        {t:17,w:'Rain',  d:'легкий дощ',     ws:6.5,c:80,ic:'10d',rain:0.3},
        {t:15,w:'Clouds',d:'хмарно',         ws:5.0,c:85,ic:'04n'} ],
      // День 4 — прохолодний, але без опадів
      [ {t:8, w:'Clouds',d:'мінлива хмарність',ws:4.0,c:50,ic:'03n'},
        {t:7, w:'Clouds',d:'мінлива хмарність',ws:3.5,c:55,ic:'03n'},
        {t:9, w:'Clouds',d:'розсіяні хмари',  ws:4.5,c:30,ic:'04d'},
        {t:14,w:'Clear', d:'ясно',            ws:5.0,c:15,ic:'01d'},
        {t:18,w:'Clear', d:'ясно',            ws:6.0,c:10,ic:'01d'},
        {t:19,w:'Clear', d:'ясно',            ws:5.5,c:5,ic:'01d'},
        {t:15,w:'Clouds',d:'небагато хмар',   ws:4.0,c:25,ic:'02d'},
        {t:11,w:'Clouds',d:'мінлива хмарність',ws:3.5,c:45,ic:'03n'} ],
      // День 5 — вітряний
      [ {t:10,w:'Clouds',d:'хмарно',          ws:12.0,c:80,ic:'04n'},
        {t:9, w:'Clouds',d:'хмарно',          ws:11.5,c:85,ic:'04n'},
        {t:12,w:'Clouds',d:'мінлива хмарність',ws:13.0,c:60,ic:'03d'},
        {t:15,w:'Clouds',d:'розсіяні хмари',  ws:14.0,c:40,ic:'04d'},
        {t:17,w:'Clouds',d:'мінлива хмарність',ws:13.5,c:35,ic:'03d'},
        {t:18,w:'Clouds',d:'хмарно',          ws:12.5,c:65,ic:'04d'},
        {t:16,w:'Clouds',d:'хмарно',          ws:11.0,c:75,ic:'04d'},
        {t:13,w:'Clouds',d:'хмарно',          ws:10.0,c:80,ic:'04n'} ]
    ];

    for (let day = 0; day < 5; day++) {
      const pattern = dayPatterns[day];
      for (let i = 0; i < 8; i++) {
        const dt = new Date(now);
        dt.setDate(dt.getDate() + day);
        dt.setHours(i * 3);
        const p = pattern[i];
        const item = {
          dt: Math.floor(dt.getTime() / 1000),
          dt_txt: dt.toISOString().replace('T', ' ').substring(0, 19),
          main: {
            temp: p.t,
            feels_like: p.t - 2,
            temp_min: p.t - 1,
            temp_max: p.t + 1,
            pressure: 1015,
            humidity: 60 + Math.round((p.c || 0) / 3)
          },
          weather: [{
            id: weatherIdFor(p.w),
            main: p.w,
            description: p.d,
            icon: p.ic
          }],
          clouds: { all: p.c || 0 },
          wind: { speed: p.ws, deg: 180 },
          visibility: 10000,
          pop: p.rain ? 0.6 : 0
        };
        if (p.rain) item.rain = { '3h': p.rain };
        list.push(item);
      }
    }

    return {
      cod: '200',
      message: 0,
      cnt: 40,
      list: list,
      city: {
        id: 703448,
        name: cityName,
        coord: { lat: 50.4501, lon: 30.5234 },
        country: 'UA',
        population: 2884000,
        timezone: 7200,
        sunrise: Math.floor(now.getTime() / 1000) + 4 * 3600,
        sunset:  Math.floor(now.getTime() / 1000) + 19 * 3600
      }
    };
  }

  function weatherIdFor(main) {
    const map = { Clear: 800, Clouds: 803, Rain: 500, Snow: 600, Thunderstorm: 200, Drizzle: 300 };
    return map[main] || 800;
  }

  window.FitCastWeatherMock = {
    generateMockForecast: generateMockForecast
  };
})();
