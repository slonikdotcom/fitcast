/* ============================================================
   FitCast — React-віджет прогнозу погоди
   Лаба 4: набір компонент, AJAX через fetch, обробка помилок,
           блокування UI під час запиту, стрімінг при скролі,
           Geolocation API.
   ============================================================ */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ============================================================
   КОНТЕКСТ: глобальні утиліти через window
   ============================================================ */
const API   = window.FitCastWeatherApi;
const CFG   = window.FitCastWeatherConfig;

/* ============================================================
   ROOT — головний компонент віджета
   ============================================================ */
function WeatherWidget() {
  const [city, setCity]         = useState(CFG.DEFAULT_CITY);
  const [data, setData]         = useState(null);   // { city, country, hours: [] }
  const [loading, setLoading]   = useState(false);  // блокує UI
  const [error, setError]       = useState(null);
  const [visibleHours, setVisibleHours] = useState(CFG.INITIAL_HOURS); // стрімінг

  /* --- Запит за містом --- */
  const loadByCity = useCallback(async function (cityName) {
    setLoading(true);
    setError(null);
    setVisibleHours(CFG.INITIAL_HOURS); // скинути стрімінг
    try {
      const result = await API.fetchByCity(cityName);
      setData(result);
      setCity(result.city); // OWM може повернути нормалізовану назву
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* --- Запит за геолокацією --- */
  const loadByGeolocation = useCallback(async function () {
    setLoading(true);
    setError(null);
    setVisibleHours(CFG.INITIAL_HOURS);
    try {
      const coords = await API.getCurrentCoords();
      const result = await API.fetchByCoords(coords.lat, coords.lon);
      setData(result);
      setCity(result.city);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /* --- Початкове завантаження --- */
  useEffect(function () {
    loadByCity(CFG.DEFAULT_CITY);
  }, [loadByCity]);

  /* --- Стрімінг: підвантажити більше годин --- */
  const loadMoreHours = useCallback(function () {
    setVisibleHours(function (h) {
      if (!data) return h;
      return Math.min(h + CFG.STREAM_CHUNK, data.hours.length);
    });
  }, [data]);

  return (
    <section className="weather-widget" aria-label="Прогноз погоди для тренувань">
      <header className="weather-widget__header">
        <h2 className="section__title" style={{ marginBottom: 8 }}>
          Сприятливі години для вуличних тренувань
        </h2>
        <CitySelector
          currentCity={city}
          onSelect={loadByCity}
          onGeolocate={loadByGeolocation}
          disabled={loading}
        />
      </header>

      {error && <ErrorBanner message={error} onRetry={() => loadByCity(city)} />}

      {loading && <Loader />}

      {!loading && !error && data && (
        <WeatherForecast
          data={data}
          visibleHours={visibleHours}
          onLoadMore={loadMoreHours}
        />
      )}
    </section>
  );
}

/* ============================================================
   CitySelector — вибір міста (input + кнопки)
   ============================================================ */
function CitySelector(props) {
  const [input, setInput] = useState(props.currentCity);

  // Синхронізуємо input коли parent оновлює currentCity
  useEffect(function () {
    setInput(props.currentCity);
  }, [props.currentCity]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) props.onSelect(trimmed);
  }

  return (
    <form className="city-selector" onSubmit={handleSubmit}>
      <input
        type="text"
        className="city-selector__input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Назва міста (напр. Kyiv, Lviv)"
        disabled={props.disabled}
        aria-label="Місто"
      />
      <button
        type="submit"
        className="city-selector__btn"
        disabled={props.disabled || !input.trim()}
      >
        🔍 Знайти
      </button>
      <button
        type="button"
        className="city-selector__btn city-selector__btn--geo"
        onClick={props.onGeolocate}
        disabled={props.disabled}
        title="Визначити моє місто за геолокацією"
      >
        📍 Моє місто
      </button>
    </form>
  );
}

/* ============================================================
   Loader — заглушка під час запиту
   ============================================================ */
function Loader() {
  return (
    <div className="weather-loader" role="status" aria-live="polite">
      <div className="weather-loader__spinner" />
      <div className="weather-loader__text">Завантаження прогнозу…</div>
    </div>
  );
}

/* ============================================================
   ErrorBanner — повідомлення про помилку
   ============================================================ */
function ErrorBanner(props) {
  return (
    <div className="weather-error" role="alert">
      <div className="weather-error__icon">⚠️</div>
      <div className="weather-error__body">
        <div className="weather-error__title">Не вдалося отримати прогноз</div>
        <div className="weather-error__msg">{props.message}</div>
      </div>
      <button className="weather-error__retry" onClick={props.onRetry}>
        Спробувати ще
      </button>
    </div>
  );
}

/* ============================================================
   WeatherForecast — горизонтальний список годин зі стрімінгом
   ============================================================ */
function WeatherForecast(props) {
  const scrollRef = useRef(null);
  const data = props.data;
  const visible = data.hours.slice(0, props.visibleHours);
  const hasMore = props.visibleHours < data.hours.length;

  // Стрімінг: коли користувач доскролив до правого краю, підвантажуємо
  const handleScroll = useCallback(function () {
    const el = scrollRef.current;
    if (!el || !hasMore) return;
    const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 100;
    if (nearEnd) props.onLoadMore();
  }, [hasMore, props.onLoadMore]);

  // Підрахунок сприятливих годин у видимому списку
  const goodCount = useMemo(function () {
    return visible.filter(API.isGoodForOutdoor).length;
  }, [visible]);

  return (
    <div className="weather-forecast">
      <div className="weather-forecast__meta">
        <span className="weather-forecast__city">📍 {data.city}, {data.country}</span>
        <span className="weather-forecast__count">
          {goodCount}/{visible.length} годин сприятливі
        </span>
      </div>

      <div
        ref={scrollRef}
        className="weather-forecast__scroll"
        onScroll={handleScroll}
      >
        {visible.map((hour) => (
          <WeatherSlot
            key={hour.dt}
            hour={hour}
            isGood={API.isGoodForOutdoor(hour)}
          />
        ))}
        {hasMore && (
          <button
            className="weather-forecast__more"
            onClick={props.onLoadMore}
            aria-label="Підвантажити більше годин"
          >
            <span>→</span>
            <span style={{ fontSize: '0.7rem', marginTop: 4 }}>ще</span>
          </button>
        )}
      </div>

      {hasMore && (
        <div className="weather-forecast__hint">
          Гортай вправо — підвантажиться більше прогнозу ({data.hours.length - props.visibleHours} годин лишилось)
        </div>
      )}
    </div>
  );
}

/* ============================================================
   WeatherSlot — одна година прогнозу
   ============================================================ */
function WeatherSlot(props) {
  const h = props.hour;
  const classes = ['weather-slot'];
  if (props.isGood) classes.push('weather-slot--good');

  // Дата у форматі "Пн 12.05" якщо це не сьогодні
  const dateLabel = formatDateLabel(h.date);

  return (
    <div className={classes.join(' ')}>
      {dateLabel && <div className="weather-slot__date">{dateLabel}</div>}
      <div className="weather-slot__time">
        {h.time}{props.isGood && ' ✓'}
      </div>
      <img
        className="weather-slot__icon"
        src={`https://openweathermap.org/img/wn/${h.icon}@2x.png`}
        alt={h.description}
        width="50"
        height="50"
        loading="lazy"
      />
      <div className="weather-slot__temp">{h.temp}°C</div>
      <div className="weather-slot__desc">{h.description}</div>
      <div className="weather-slot__wind">💨 {h.wind} м/с</div>
      {h.rain > 0 && (
        <div className="weather-slot__rain">💧 {h.rain.toFixed(1)} мм</div>
      )}
    </div>
  );
}

/* --- Хелпер: "Пн 12.05" якщо дата не сьогодні --- */
function formatDateLabel(isoDate) {
  const today = new Date();
  const todayIso = today.toISOString().substring(0, 10);
  if (isoDate === todayIso) return null;

  const d = new Date(isoDate);
  const days = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];
  const dayName = days[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dayName} ${dd}.${mm}`;
}

/* ============================================================
   MOUNT — підключаємо React до сторінки
   ⚠️ Babel-standalone виконує цей код ВСЕРЕДИНІ DOMContentLoaded-
   обробника. Тому слухач 'DOMContentLoaded' тут вже не спрацює —
   треба монтувати безпосередньо, попередньо перевіривши readyState.
   ============================================================ */
function mountWeatherWidget() {
  const mountNode = document.getElementById('weatherWidgetRoot');
  if (!mountNode) return;
  // Захист від подвійного монтування (Live Server / HMR)
  if (mountNode.dataset.mounted === '1') return;
  mountNode.dataset.mounted = '1';
  const root = ReactDOM.createRoot(mountNode);
  root.render(<WeatherWidget />);
}

if (document.readyState === 'loading') {
  // На випадок, якщо скрипт раптом завантажиться раніше DOMContentLoaded
  document.addEventListener('DOMContentLoaded', mountWeatherWidget);
} else {
  // Звичайний шлях для Babel-standalone: DOM вже готовий
  mountWeatherWidget();
}
