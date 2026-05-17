// Клієнт /api/workouts з кешем у памʼяті.
(function () {
  const TODAY = todayIso();

  const TYPE_META = {
    run:   { emoji: '🏃', label: 'Біг' },
    gym:   { emoji: '🏋️', label: 'Зал' },
    bike:  { emoji: '🚴', label: 'Велосипед' },
    yoga:  { emoji: '🧘', label: 'Йога' },
    swim:  { emoji: '🏊', label: 'Плавання' },
    other: { emoji: '✏️', label: 'Інше' }
  };

  const PLACE_META = {
    outdoor: { label: 'Вулиця', badge: 'outdoor' },
    gym:     { label: 'Зал',    badge: 'indoor' },
    home:    { label: 'Дім',    badge: 'indoor' },
    other:   { label: 'Інше',   badge: 'indoor' }
  };

  let CACHE = null;       // масив workouts або null якщо ще не завантажено
  let LOADING = null;     // Promise завантаження (для дедуплікації паралельних викликів)

  function fromServer(w) {
    return {
      id:         w.id,
      type:       w.type,
      typeCustom: w.type_custom,
      date:       w.date,
      timeStart:  w.time_start ? w.time_start.substring(0, 5) : null, // "07:15:00" → "07:15"
      duration:   w.duration,
      place:      w.place,
      notes:      w.notes || '',
      mood:       w.mood,
      photo:      w.photo
    };
  }

  function toServer(data) {
    const out = {
      type:        data.type,
      type_custom: data.typeCustom || null,
      date:        data.date,
      time_start:  data.timeStart,
      duration:    data.duration,
      place:       data.place,
      notes:       data.notes || null,
      mood:        data.mood || null
    };
    // photo: undefined → не передаємо (зберегти попереднє при PUT);
    //       null/string → передаємо явно (очистити або оновити).
    if (data.photo !== undefined) out.photo = data.photo;
    return out;
  }

  async function getAll() {
    if (CACHE) return CACHE.slice();
    if (LOADING) return (await LOADING).slice();
    LOADING = (async () => {
      const resp = await fetch('/api/workouts', { credentials: 'same-origin' });
      if (resp.status === 401) {
        // не авторизовано — перенаправимо на логін
        window.location.href = '/login';
        return [];
      }
      if (!resp.ok) throw new Error('Не вдалося завантажити тренування');
      const data = await resp.json();
      CACHE = data.workouts.map(fromServer);
      LOADING = null;
      return CACHE;
    })();
    return (await LOADING).slice();
  }

  async function getById(id) {
    const all = await getAll();
    const num = parseInt(id, 10);
    return all.find(w => w.id === num) || null;
  }

  async function getToday() {
    const all = await getAll();
    return all.filter(w => w.date === TODAY)
              .sort((a, b) => a.timeStart.localeCompare(b.timeStart));
  }

  async function create(data) {
    const resp = await fetch('/api/workouts', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toServer(data))
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Помилка створення тренування');
    }
    const json = await resp.json();
    const created = fromServer(json.workout);
    if (CACHE) CACHE.push(created);
    return created;
  }

  async function update(id, changes) {
    const resp = await fetch(`/api/workouts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toServer(changes))
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Помилка оновлення');
    }
    const json = await resp.json();
    const updated = fromServer(json.workout);
    if (CACHE) {
      const idx = CACHE.findIndex(w => w.id === updated.id);
      if (idx !== -1) CACHE[idx] = updated;
    }
    return updated;
  }

  async function remove(id) {
    const resp = await fetch(`/api/workouts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Помилка видалення');
    }
    if (CACHE) CACHE = CACHE.filter(w => w.id !== parseInt(id, 10));
    return true;
  }

  function invalidate() {
    CACHE = null;
    LOADING = null;
  }

  function calcTimeEnd(timeStart, durationMin) {
    const [h, m] = timeStart.split(':').map(Number);
    const totalMin = h * 60 + m + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return String(endH).padStart(2, '0') + ':' + String(endM).padStart(2, '0');
  }
  function formatTimeRange(w) {
    return w.timeStart + '–' + calcTimeEnd(w.timeStart, w.duration);
  }
  function formatMeta(w) {
    const [y, mo, d] = w.date.split('-');
    return `${d}.${mo}.${y} · ${w.timeStart} · ${w.duration} хв`;
  }
  function getTypeMeta(type)  { return TYPE_META[type] || TYPE_META.other; }
  function getPlaceMeta(place){ return PLACE_META[place] || PLACE_META.other; }

  function todayIso() {
    const d = new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  window.FitCastWorkouts = {
    TODAY,
    getAll, getById, getToday,
    create, update, remove,
    invalidate,
    calcTimeEnd, formatTimeRange, formatMeta,
    getTypeMeta, getPlaceMeta
  };
})();
