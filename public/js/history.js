// Історія: SSR-список, фільтри, акордеон, save/delete.
(function () {
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    await loadAndRender();
    initAccordion();
    initMoodButtons();
    initFilters();
    initSaveButtons();
    await updateStatsTable();
  }

  async function loadAndRender(filters) {
    const container = document.getElementById('workoutList');
    if (!container) return;
    container.innerHTML = '<div class="workout-empty">Завантажуємо тренування…</div>';

    const params = new URLSearchParams();
    if (filters) {
      if (filters.type)  params.set('type', filters.type);
      if (filters.from)  params.set('from', filters.from);
      if (filters.to)    params.set('to', filters.to);
      if (filters.place) params.set('place', filters.place);
      if (filters.min)   params.set('minDuration', String(filters.min));
    }

    try {
      const resp = await fetch('/api/ssr/history?' + params.toString(),
                               { credentials: 'same-origin' });
      if (resp.status === 401) { window.location.href = '/login'; return; }
      if (!resp.ok) throw new Error('SSR-помилка');
      const data = await resp.json();

      document.body.setAttribute('data-theme', data.theme || 'light');

      if (data.filtered === 0) {
        const empty = document.getElementById('emptyState');
        if (empty) empty.hidden = false;
        container.style.display = 'none';
      } else {
        const empty = document.getElementById('emptyState');
        if (empty) empty.hidden = true;
        container.style.display = '';
        container.innerHTML = data.listHtml;
        if (window.FitCastPhotoPreview) window.FitCastPhotoPreview.attachAll();
      }

      updateCounter(data.filtered, data.total, filters);
    } catch (err) {
      console.error('History SSR error:', err);
      container.innerHTML = '<div class="workout-empty">Помилка завантаження. Спробуй F5.</div>';
    }
  }

  function updateCounter(visible, total, filters) {
    const counter = document.getElementById('filtersCount');
    if (!counter) return;
    const hasActiveFilter = filters && (filters.type || filters.from || filters.to || filters.place || filters.min > 0);
    if (!hasActiveFilter) {
      counter.textContent = `Всього тренувань: ${total}`;
      counter.className = 'filters__count';
    } else {
      counter.textContent = `Знайдено: ${visible} з ${total}`;
      counter.className = visible === 0
        ? 'filters__count filters__count--empty'
        : 'filters__count filters__count--filtered';
    }
  }

  function initAccordion() {
    document.addEventListener('click', function (e) {
      const header = e.target.closest('.wcard__header');
      if (!header) return;
      const card = header.closest('.wcard');
      const isOpen = card.classList.contains('open');
      document.querySelectorAll('.wcard').forEach(c => c.classList.remove('open'));
      if (!isOpen) card.classList.add('open');
    });
  }

  function initMoodButtons() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.mood-btn');
      if (!btn) return;
      const group = btn.closest('.mood-group');
      if (!group) return;
      group.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  }

  function initFilters() {
    const form = document.querySelector('.filters');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const V = window.FitCastValidation;
      const f = {
        type:  form.querySelector('#filter-type').value,
        from:  form.querySelector('#filter-from').value,
        to:    form.querySelector('#filter-to').value,
        place: form.querySelector('#filter-place').value,
        min:   parseInt(form.querySelector('#filter-min').value, 10) || 0
      };
      if (f.from && f.to && f.from > f.to) {
        if (V) V.showFormMessage(form, 'Дата "Від" не може бути пізнішою за "До"', 'error');
        return;
      }
      if (V) V.hideFormMessage(form);
      await loadAndRender(f);
    });

    form.addEventListener('reset', function () {
      setTimeout(function () { loadAndRender(null); }, 0);
    });
  }

  function initSaveButtons() {
    document.addEventListener('click', async function (e) {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const card = btn.closest('.wcard');
      if (!card) return;
      const action = btn.dataset.action;
      const id = card.dataset.id;
      if (action === 'save') return handleSave(card, btn, id);
      if (action === 'delete') return handleDelete(card, id);
    });
  }

  async function handleSave(card, btn, id) {
    const moodEl = card.querySelector('.mood-btn.selected');
    const mood   = moodEl ? moodEl.textContent.trim() : null;
    const notes  = (card.querySelector('textarea') || {}).value || '';
    const fileEl = card.querySelector('input[type="file"]');
    const photoContainer = card.querySelector('.photo-input');
    const hasNewFile = fileEl && fileEl.files && fileEl.files[0];
    const hasImage = photoContainer && photoContainer.classList.contains('photo-input--has-image');
    const hadInitialPhoto = photoContainer && photoContainer.dataset.hadInitialPhoto === '1';

    let changes = { mood: mood, notes: notes };
    if (hasNewFile) {
      try { changes.photo = await readFileAsDataUrl(fileEl.files[0]); }
      catch { alert('Не вдалося прочитати фото'); return; }
    } else if (hadInitialPhoto && !hasImage) {
      // Фото було у БД, користувач натиснув ✕ — очищуємо
      changes.photo = null;
    }
    // Інакше — photo не передаємо, бекенд лишить попереднє значення

    const origText = btn.textContent;
    btn.textContent = 'Зберігаємо…';
    btn.disabled = true;

    try {
      await window.FitCastWorkouts.update(id, changes);
      btn.textContent = '✓ Збережено';
      btn.classList.add('form__btn--success');
    } catch (e) {
      btn.textContent = '✗ Помилка';
      alert('Не вдалося зберегти: ' + e.message);
    } finally {
      setTimeout(function () {
        btn.textContent = origText;
        btn.classList.remove('form__btn--success');
        btn.disabled = false;
      }, 1800);
    }
  }

  async function handleDelete(card, id) {
    if (!confirm('Видалити це тренування?')) return;
    try {
      await window.FitCastWorkouts.remove(id);
      card.style.opacity = '0';
      card.style.transform = 'translateX(-20px)';
      setTimeout(function () {
        card.remove();
        updateStatsTable();
      }, 250);
    } catch (e) {
      alert('Не вдалося видалити: ' + e.message);
    }
  }

  async function updateStatsTable() {
    const D = window.FitCastWorkouts;
    if (!D) return;
    const tbody = document.querySelector('.table-wrap tbody');
    if (!tbody) return;

    let all;
    try { all = await D.getAll(); } catch { return; }

    const byType = {};
    all.forEach(w => {
      if (!byType[w.type]) byType[w.type] = [];
      byType[w.type].push(w);
    });

    const rows = Object.keys(byType).map(function (type) {
      const list = byType[type];
      const meta = D.getTypeMeta(type);
      const total = list.reduce((s, w) => s + w.duration, 0);
      const avg = Math.round(total / list.length);
      const places = list.map(w => w.place);
      const placeMode = places.sort((a, b) =>
        places.filter(p => p === a).length - places.filter(p => p === b).length
      ).pop();
      const placeMeta = D.getPlaceMeta(placeMode);
      return '<tr>' +
        '<td>' + meta.emoji + ' ' + meta.label + '</td>' +
        '<td>' + list.length + '</td>' +
        '<td>' + total + ' хв</td>' +
        '<td>' + avg + ' хв</td>' +
        '<td><span class="badge badge--' + placeMeta.badge + '">' + placeMeta.label + '</span></td>' +
      '</tr>';
    });
    tbody.innerHTML = rows.join('') ||
      '<tr><td colspan="5" style="text-align:center; color: var(--text-light);">Поки немає даних</td></tr>';
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const r = new FileReader();
      r.onload = function (e) { resolve(e.target.result); };
      r.onerror = function () { reject(new Error('FileReader error')); };
      r.readAsDataURL(file);
    });
  }
})();
