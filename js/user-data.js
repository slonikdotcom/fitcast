/* ============================================================
   FitCast — дані користувача (профіль)
   Зараз: localStorage (тимчасово, для демонстрації)
   У Лабі 5: тут будуть запити до /api/profile на сервер
   ============================================================ */

(function () {
  const STORAGE_KEY = 'fitcast.profile';

  const DEFAULT_PROFILE = {
    name:        'Тома',
    email:       'toma@example.com',
    city:        'Kyiv',
    joinedDate:  '2026-05-01',     // ISO дата реєстрації
    avatar:      null,             // data URL фото профілю або null
    weatherSettings: {
      tempMin: 10,
      tempMax: 28,
      windMax: 10,
      rain:    'none'              // 'none' | 'light' | 'any'
    }
  };

  /* --- Load / Save --- */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Мердж з дефолтом — на випадок якщо в збереженому профілі
        // не вистачає полів (старі версії)
        return Object.assign({}, DEFAULT_PROFILE, parsed, {
          weatherSettings: Object.assign({},
            DEFAULT_PROFILE.weatherSettings,
            parsed.weatherSettings || {}
          )
        });
      }
    } catch (e) {
      console.warn('[FitCast] Не вдалося прочитати профіль:', e);
    }
    return Object.assign({}, DEFAULT_PROFILE);
  }

  function persist(profile) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      return true;
    } catch (e) {
      // Найчастіша помилка — QuotaExceeded (профіль з великим аватаром)
      console.error('[FitCast] Не вдалося зберегти профіль:', e);
      return false;
    }
  }

  let PROFILE = load();

  /* --- API --- */

  function get() {
    return Object.assign({}, PROFILE, {
      weatherSettings: Object.assign({}, PROFILE.weatherSettings)
    });
  }

  function update(changes) {
    PROFILE = Object.assign({}, PROFILE, changes);
    persist(PROFILE);
    return get();
  }

  function updateWeatherSettings(changes) {
    PROFILE.weatherSettings = Object.assign({}, PROFILE.weatherSettings, changes);
    persist(PROFILE);
    return get();
  }

  function setAvatar(dataUrl) {
    PROFILE.avatar = dataUrl || null;
    return persist(PROFILE);
  }

  function removeAvatar() {
    PROFILE.avatar = null;
    persist(PROFILE);
  }

  /* Дата реєстрації у форматі "травня 2026" */
  function formatJoinedDate() {
    const months = ['січня','лютого','березня','квітня','травня','червня',
                    'липня','серпня','вересня','жовтня','листопада','грудня'];
    const [y, m] = PROFILE.joinedDate.split('-').map(Number);
    return `${months[m - 1]} ${y}`;
  }

  /* Перша літера імені для аватара */
  function getInitial() {
    return (PROFILE.name || 'X').trim().charAt(0).toUpperCase();
  }

  /* Очистити (для дебагу/виходу) */
  function reset() {
    PROFILE = Object.assign({}, DEFAULT_PROFILE);
    persist(PROFILE);
  }

  window.FitCastUser = {
    get, update, updateWeatherSettings,
    setAvatar, removeAvatar,
    formatJoinedDate, getInitial,
    reset
  };
})();
