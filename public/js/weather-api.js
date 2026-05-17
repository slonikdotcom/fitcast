// Клієнт /api/weather (проксі OWM), таймаут, мок-фоллбек.
(function () {
  const CFG = window.FitCastWeatherConfig;
  const MOCK = window.FitCastWeatherMock;

  if (!CFG) {
    console.error('FitCastWeatherConfig не завантажено');
    return;
  }

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

  /* Чи "сприятлива" година для вуличного тренування.
     settings — індивідуальні пороги користувача (з профілю); якщо нема — дефолти. */
  function isGoodForOutdoor(hour, settings) {
    const s = settings || {
      tempMin: CFG.GOOD_WEATHER.tempMin,
      tempMax: CFG.GOOD_WEATHER.tempMax,
      windMax: CFG.GOOD_WEATHER.windMax,
      rain:    'none'
    };
    if (hour.temp < s.tempMin || hour.temp > s.tempMax) return false;
    if (hour.wind > s.windMax) return false;

    const main = hour.weatherMain;
    const rainMm = hour.rain || 0;

    if (s.rain === 'any') {
      // Тільки гроза — завжди погано (небезпечно тренуватись)
      if (main === 'Thunderstorm') return false;
    } else if (s.rain === 'light') {
      // Легкий дощ ок, але не сильний/сніг/гроза
      if (main === 'Snow' || main === 'Thunderstorm') return false;
      if (main === 'Rain' && rainMm > 1.5) return false;
    } else {
      // 'none' (за замовчуванням) — жодних опадів
      if (['Rain', 'Drizzle', 'Snow', 'Thunderstorm'].indexOf(main) !== -1) return false;
    }
    return true;
  }

  async function fetchByCity(city) {
    return fetchForecast({ city: city });
  }

  async function fetchByCoords(lat, lon) {
    return fetchForecast({ lat: lat, lon: lon });
  }

  /* Клієнт ходить на НАШ проксі /api/weather (а не на OWM напряму).
     Так ключ ховається на сервері. Якщо проксі повертає 503
     (ключа немає на сервері) — фоллбек на мок-дані. */
  async function fetchForecast(params) {
    const qs = new URLSearchParams(params);
    let response;
    try {
      response = await fetchWithTimeout('/api/weather?' + qs.toString(), CFG.TIMEOUT);
    } catch (e) {
      throw e;
    }

    if (response.status === 503) {
      console.warn('[FitCast] Сервер каже що OWM не налаштовано — використовуються мок-дані');
      await new Promise(r => setTimeout(r, 400));
      const cityName = params.city || 'Київ (мок)';
      return normalizeForecast(MOCK.generateMockForecast(cityName));
    }
    if (!response.ok) {
      let msg;
      try { msg = (await response.json()).error; } catch { msg = null; }
      if (response.status === 404) throw new Error(msg || 'Місто не знайдено');
      if (response.status === 401) throw new Error('Не авторизовано');
      if (response.status === 429) throw new Error(msg || 'Перевищено ліміт');
      throw new Error(msg || 'Помилка сервера: HTTP ' + response.status);
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
            2: 'Не вдалося визначити локацію. Введи місто вручну вище та натисни «Знайти».',
            3: 'Таймаут геолокації. Введи місто вручну вище та натисни «Знайти».'
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
