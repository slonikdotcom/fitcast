/* ============================================================
   FitCast — обгортка над OpenWeatherMap API
   Лаба 4: AJAX через fetch, обробка таймаутів та помилок.
   ============================================================ */

(function () {
  const CFG = window.FitCastWeatherConfig;
  const MOCK = window.FitCastWeatherMock;

  if (!CFG) {
    console.error('FitCastWeatherConfig не завантажено');
    return;
  }

  /* --- fetch з таймаутом --- */
  function fetchWithTimeout(url, timeout) {
    return new Promise(function (resolve, reject) {
      const controller = new AbortController();
      const timer = setTimeout(function () {
        controller.abort();
        reject(new Error('Таймаут запиту (' + timeout + ' мс) — спробуйте ще раз'));
      }, timeout);

      fetch(url, { signal: controller.signal })
        .then(function (response) {
          clearTimeout(timer);
          resolve(response);
        })
        .catch(function (err) {
          clearTimeout(timer);
          if (err.name === 'AbortError') {
            reject(new Error('Таймаут запиту — мережа повільна'));
          } else {
            reject(new Error('Помилка мережі: ' + err.message));
          }
        });
    });
  }

  /* --- Конвертація відповіді в простіший формат --- */
  function normalizeForecast(rawData) {
    return {
      city: rawData.city.name,
      country: rawData.city.country,
      hours: rawData.list.map(function (item) {
        return {
          dt: item.dt,
          date: item.dt_txt.substring(0, 10),
          time: item.dt_txt.substring(11, 16),
          temp: Math.round(item.main.temp),
          feelsLike: Math.round(item.main.feels_like),
          humidity: item.main.humidity,
          weatherMain: item.weather[0].main,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          wind: Math.round(item.wind.speed * 10) / 10,
          clouds: item.clouds.all,
          rain: (item.rain && item.rain['3h']) || 0,
          pop: Math.round((item.pop || 0) * 100)
        };
      })
    };
  }

  /* --- Чи "сприятлива" година для вуличного тренування --- */
  function isGoodForOutdoor(hour) {
    const G = CFG.GOOD_WEATHER;
    if (hour.temp < G.tempMin || hour.temp > G.tempMax) return false;
    if (hour.wind > G.windMax) return false;
    if (G.badConditions.indexOf(hour.weatherMain) !== -1) return false;
    return true;
  }

  /* --- Основні методи API --- */

  async function fetchByCity(city) {
    return fetchForecast({ q: city });
  }

  async function fetchByCoords(lat, lon) {
    return fetchForecast({ lat: lat, lon: lon });
  }

  async function fetchForecast(params) {
    // Якщо ключа немає — фоллбек на мок
    if (!CFG.hasValidKey()) {
      console.warn('[FitCast] API-ключ OpenWeatherMap не налаштовано — використовуються мок-дані');
      // Імітуємо мережеву затримку для реалістичного UX
      await new Promise(function (r) { setTimeout(r, 600); });
      const cityName = params.q || 'Київ (мок)';
      const raw = MOCK.generateMockForecast(cityName);
      return normalizeForecast(raw);
    }

    // Реальний запит
    const url = buildUrl(params);
    const response = await fetchWithTimeout(url, CFG.TIMEOUT);

    if (!response.ok) {
      // OWM повертає 404 для невідомих міст, 401 для невалідного ключа
      if (response.status === 404) {
        throw new Error('Місто не знайдено — перевір назву');
      }
      if (response.status === 401) {
        throw new Error('API-ключ невалідний або ще не активований (зачекай ~10 хв після реєстрації)');
      }
      if (response.status === 429) {
        throw new Error('Перевищено ліміт запитів — спробуй за хвилину');
      }
      throw new Error('Помилка сервера: HTTP ' + response.status);
    }

    const data = await response.json();
    return normalizeForecast(data);
  }

  function buildUrl(params) {
    const u = new URL(CFG.API_URL);
    Object.keys(params).forEach(function (k) {
      u.searchParams.append(k, params[k]);
    });
    u.searchParams.append('appid', CFG.API_KEY);
    u.searchParams.append('units', CFG.UNITS);
    u.searchParams.append('lang', CFG.LANG);
    return u.toString();
  }

  /* --- Geolocation API --- */
  function getCurrentCoords(timeout) {
    timeout = timeout || 10000;
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error('Браузер не підтримує геолокацію'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        function (err) {
          const messages = {
            1: 'Доступ до геолокації заборонено — дозволь у налаштуваннях браузера',
            2: 'Не вдалося визначити локацію',
            3: 'Таймаут геолокації'
          };
          reject(new Error(messages[err.code] || 'Помилка геолокації'));
        },
        { timeout: timeout, enableHighAccuracy: false, maximumAge: 600000 }
      );
    });
  }

  window.FitCastWeatherApi = {
    fetchByCity: fetchByCity,
    fetchByCoords: fetchByCoords,
    getCurrentCoords: getCurrentCoords,
    isGoodForOutdoor: isGoodForOutdoor
  };
})();
