/* ============================================================
   FitCast — дані про тренування
   Зараз: localStorage (тимчасово, для демонстрації CRUD-флоу)
   У Лабі 5: тут будуть fetch-запити до /api/workouts на сервер
   ============================================================ */

(function () {
  const STORAGE_KEY = 'fitcast.workouts';
  const TODAY = '2026-05-17';

  /* --- Метадані типів та місць --- */
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

  /* --- Стартові дані (seed) — використовуються при першому запуску --- */
  const SEED_WORKOUTS = [
    { id: 1, type: 'gym',  date: TODAY,        timeStart: '07:15', duration: 105, place: 'gym',
      notes: 'Силове, верх тіла', mood: null, photo: null },
    { id: 2, type: 'run',  date: TODAY,        timeStart: '15:20', duration: 80,  place: 'outdoor',
      notes: 'Біг на дворі', mood: null, photo: null },
    { id: 3, type: 'run',  date: '2026-05-16', timeStart: '07:15', duration: 45,  place: 'outdoor',
      notes: 'Чудова погода, відчував себе добре', mood: '💪 Відмінно', photo: null },
    { id: 4, type: 'gym',  date: '2026-05-15', timeStart: '18:00', duration: 60,  place: 'gym',
      notes: 'Силове тренування, груди та спина', mood: null, photo: null },
    { id: 5, type: 'bike', date: '2026-05-14', timeStart: '09:30', duration: 90,  place: 'outdoor',
      notes: 'Маршрут через парк, 24 км', mood: '😊 Добре', photo: null },
    { id: 6, type: 'yoga', date: '2026-05-13', timeStart: '07:00', duration: 30,  place: 'home',
      notes: 'Ранкова практика', mood: '😐 Нормально', photo: null },
    { id: 7, type: 'run',  date: '2026-05-12', timeStart: '06:45', duration: 50,  place: 'outdoor',
      notes: 'Інтервальний біг, 6 км', mood: null, photo: null }
  ];

  /* ============================================================
     LOAD / SAVE
     ============================================================ */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[FitCast] Не вдалося прочитати localStorage:', e);
    }
    // Перший запуск → seed
    save(SEED_WORKOUTS);
    return SEED_WORKOUTS.slice();
  }

  function save(workouts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
      return true;
    } catch (e) {
      console.error('[FitCast] Не вдалося зберегти у localStorage:', e);
      return false;
    }
  }

  /* --- Внутрішній кеш (не звертатись до localStorage щоразу) --- */
  let WORKOUTS = load();

  function getNextId() {
    if (WORKOUTS.length === 0) return 1;
    return Math.max.apply(null, WORKOUTS.map(w => w.id)) + 1;
  }

  /* ============================================================
     CRUD
     ============================================================ */
  function create(data) {
    const w = Object.assign({
      id: getNextId(),
      mood: null,
      photo: null,
      notes: ''
    }, data);
    WORKOUTS.push(w);
    save(WORKOUTS);
    return w;
  }

  function update(id, changes) {
    const num = parseInt(id, 10);
    const idx = WORKOUTS.findIndex(w => w.id === num);
    if (idx === -1) return null;
    WORKOUTS[idx] = Object.assign({}, WORKOUTS[idx], changes);
    save(WORKOUTS);
    return WORKOUTS[idx];
  }

  function remove(id) {
    const num = parseInt(id, 10);
    const before = WORKOUTS.length;
    WORKOUTS = WORKOUTS.filter(w => w.id !== num);
    if (WORKOUTS.length !== before) {
      save(WORKOUTS);
      return true;
    }
    return false;
  }

  /* Очистити все і повернути до seed (для дебагу) */
  function resetToSeed() {
    WORKOUTS = SEED_WORKOUTS.slice();
    save(WORKOUTS);
  }

  /* ============================================================
     READ
     ============================================================ */
  function getById(id) {
    const num = parseInt(id, 10);
    return WORKOUTS.find(w => w.id === num) || null;
  }

  function getToday() {
    return WORKOUTS.filter(w => w.date === TODAY)
                   .sort((a, b) => a.timeStart.localeCompare(b.timeStart));
  }

  function getAll() {
    return WORKOUTS.slice().sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.timeStart.localeCompare(b.timeStart);
    });
  }

  /* ============================================================
     УТИЛІТИ ФОРМАТУВАННЯ
     ============================================================ */
  function calcTimeEnd(timeStart, durationMin) {
    const [h, m] = timeStart.split(':').map(Number);
    const totalMin = h * 60 + m + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return String(endH).padStart(2, '0') + ':' + String(endM).padStart(2, '0');
  }

  function formatTimeRange(workout) {
    return workout.timeStart + '–' + calcTimeEnd(workout.timeStart, workout.duration);
  }

  function formatMeta(workout) {
    const [y, mo, d] = workout.date.split('-');
    return `${d}.${mo}.${y} · ${workout.timeStart} · ${workout.duration} хв`;
  }

  function getTypeMeta(type) {
    return TYPE_META[type] || TYPE_META.other;
  }

  function getPlaceMeta(place) {
    return PLACE_META[place] || PLACE_META.other;
  }

  /* ============================================================
     ЕКСПОРТ
     ============================================================ */
  window.FitCastWorkouts = {
    TODAY,
    // CRUD
    getById, getToday, getAll,
    create, update, remove, resetToSeed,
    // Формат
    calcTimeEnd, formatTimeRange, formatMeta,
    getTypeMeta, getPlaceMeta
  };
})();
