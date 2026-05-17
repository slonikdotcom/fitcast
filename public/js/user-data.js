/* ============================================================
   FitCast — клієнт для API профілю (/api/profile)
   Лаба 5: реальні запити до сервера.
   API сумісний з версією на localStorage, але методи ASYNC.
   ============================================================ */

(function () {
  let CACHE = null;
  let LOADING = null;

  /* --- Серверний формат (snake_case) → клієнтський (camelCase) --- */
  function fromServer(p) {
    return {
      id:        p.id,
      name:      p.name,
      email:     p.email,
      city:      p.city,
      avatar:    p.avatar,
      joinedDate: p.joined_date,
      weatherSettings: {
        tempMin:   p.temp_min,
        tempMax:   p.temp_max,
        windMax:   p.wind_max,
        rain:      p.rain_preference,
        hourStart: p.hour_start,
        hourEnd:   p.hour_end
      }
    };
  }

  async function load() {
    if (CACHE) return CACHE;
    if (LOADING) return LOADING;
    LOADING = (async () => {
      const resp = await fetch('/api/profile', { credentials: 'same-origin' });
      if (resp.status === 401) {
        window.location.href = '/login';
        return null;
      }
      if (!resp.ok) throw new Error('Не вдалося завантажити профіль');
      const data = await resp.json();
      CACHE = fromServer(data.profile);
      LOADING = null;
      return CACHE;
    })();
    return LOADING;
  }

  async function get() {
    await load();
    return JSON.parse(JSON.stringify(CACHE));
  }

  async function update(changes) {
    const resp = await fetch('/api/profile', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes)
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Помилка оновлення профілю');
    }
    const data = await resp.json();
    CACHE = fromServer(data.profile);
    return get();
  }

  async function updateWeatherSettings(weather) {
    return update({ weatherSettings: weather });
  }

  async function setAvatar(dataUrl) {
    try {
      await update({ avatar: dataUrl });
      return true;
    } catch (e) {
      console.warn('[FitCastUser] не вдалося зберегти аватар:', e.message);
      return false;
    }
  }

  async function removeAvatar() {
    return update({ avatar: null });
  }

  /* --- Локальні утиліти --- */
  function formatJoinedDate(profile) {
    const months = ['січня','лютого','березня','квітня','травня','червня',
                    'липня','серпня','вересня','жовтня','листопада','грудня'];
    const d = new Date(profile.joinedDate);
    if (isNaN(d.getTime())) return '';
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function getInitial(profile) {
    return ((profile && profile.name) || 'X').trim().charAt(0).toUpperCase();
  }

  function invalidate() {
    CACHE = null;
    LOADING = null;
  }

  window.FitCastUser = {
    get, update, updateWeatherSettings,
    setAvatar, removeAvatar,
    formatJoinedDate, getInitial,
    invalidate
  };
})();
