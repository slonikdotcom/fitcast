/* ============================================================
   FitCast — логіка сторінки історії тренувань
   - Динамічний рендер карток з window.FitCastWorkouts
   - Реальна фільтрація (тип, дата, місце, тривалість)
   - Прев'ю фото — через спільний photo-preview.js
   - Кнопки "Зберегти" нотатки/mood — пишуть у localStorage
   ============================================================ */

(function () {
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    renderAllCards();
    updateStatsTable();
    initAccordion();
    initMoodButtons();
    initFilters();
    initSaveButtons();
  }

  /* ============================================================
     ДИНАМІЧНИЙ РЕНДЕР КАРТОК
     ============================================================ */
  function renderAllCards() {
    const D = window.FitCastWorkouts;
    const container = document.getElementById('workoutList');
    if (!D || !container) return;

    const workouts = D.getAll();
    if (workouts.length === 0) {
      container.innerHTML =
        '<div class="workout-empty">Поки немає тренувань. ' +
        '<a href="add-workout.html">Додати перше →</a></div>';
      return;
    }

    container.innerHTML = workouts.map(renderCard).join('');

    // Підключаємо прев'ю фото до щойно створених file-input'ів
    if (window.FitCastPhotoPreview) {
      window.FitCastPhotoPreview.attachAll();
    }
  }

  function renderCard(w) {
    const D = window.FitCastWorkouts;
    const type  = D.getTypeMeta(w.type);
    const place = D.getPlaceMeta(w.place);
    const [y, mo, d] = w.date.split('-');
    const moodOptions = ['💪 Відмінно', '😊 Добре', '😐 Нормально', '😴 Втомився'];

    const moodHtml = moodOptions.map(function (m) {
      const selected = w.mood === m ? ' selected' : '';
      return '<span class="mood-btn' + selected + '">' + escapeHtml(m) + '</span>';
    }).join('');

    const typeName = w.type === 'other' && w.typeCustom
      ? escapeHtml(w.typeCustom)
      : type.label;

    return (
      '<div class="wcard" ' +
        'data-id="' + w.id + '" ' +
        'data-type="' + escapeAttr(w.type) + '" ' +
        'data-date="' + escapeAttr(w.date) + '" ' +
        'data-place="' + escapeAttr(w.place) + '" ' +
        'data-duration="' + w.duration + '">' +
        '<div class="wcard__header">' +
          '<div class="wcard__main">' +
            '<span class="wcard__emoji">' + type.emoji + '</span>' +
            '<div>' +
              '<div class="wcard__title">' + typeName + '</div>' +
              '<div class="wcard__meta">' + d + '.' + mo + '.' + y +
                ' &nbsp;·&nbsp; ' + escapeHtml(w.timeStart) +
                ' &nbsp;·&nbsp; ' + w.duration + ' хв</div>' +
            '</div>' +
          '</div>' +
          '<div class="wcard__right">' +
            '<span class="badge badge--' + place.badge + '">' + place.label + '</span>' +
            '<span class="wcard__arrow">▼</span>' +
          '</div>' +
        '</div>' +
        '<div class="wcard__body">' +
          '<div class="wcard__mood-label">Самопочуття після:</div>' +
          '<div class="mood-group">' + moodHtml + '</div>' +
          '<div class="form__group" style="margin-top:16px;">' +
            '<label class="form__label">Нотатки</label>' +
            '<textarea placeholder="Як пройшло тренування?">' + escapeHtml(w.notes || '') + '</textarea>' +
          '</div>' +
          '<div class="form__group">' +
            '<label class="form__label">Фото з тренування</label>' +
            '<input type="file" accept="image/*" />' +
            (w.photo ? '<div class="photo-saved">Збережено раніше: ' + escapeHtml(w.photo) + '</div>' : '') +
          '</div>' +
          '<div class="wcard__actions">' +
            '<a href="add-workout.html?id=' + w.id + '" class="wcard__edit-link">✏️ Редагувати у формі</a>' +
            '<button class="form__btn" data-action="save">Зберегти</button>' +
            '<button class="form__btn form__btn--danger" data-action="delete">🗑 Видалити</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ============================================================
     АКОРДЕОН
     ============================================================ */
  function initAccordion() {
    document.querySelectorAll('.wcard__header').forEach(function (header) {
      header.addEventListener('click', function () {
        const card = header.closest('.wcard');
        const isOpen = card.classList.contains('open');
        document.querySelectorAll('.wcard').forEach(c => c.classList.remove('open'));
        if (!isOpen) card.classList.add('open');
      });
    });
  }

  /* ============================================================
     MOOD-КНОПКИ
     ============================================================ */
  function initMoodButtons() {
    document.querySelectorAll('.mood-group').forEach(function (group) {
      group.addEventListener('click', function (e) {
        const btn = e.target.closest('.mood-btn');
        if (!btn) return;
        group.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  /* ============================================================
     ФІЛЬТРИ
     ============================================================ */
  function initFilters() {
    const form = document.querySelector('.filters');
    if (!form) return;

    const typeSelect  = form.querySelector('#filter-type');
    const fromInput   = form.querySelector('#filter-from');
    const toInput     = form.querySelector('#filter-to');
    const placeSelect = form.querySelector('#filter-place');
    const minInput    = form.querySelector('#filter-min');

    /* ПОДІЯ: submit (натискання "Фільтрувати") */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      applyFilters();
    });

    /* ПОДІЯ: reset (натискання "Скинути") */
    form.addEventListener('reset', function () {
      setTimeout(applyFilters, 0);
    });

    applyFilters();

    function applyFilters() {
      const f = {
        type:  typeSelect.value,
        from:  fromInput.value,
        to:    toInput.value,
        place: placeSelect.value,
        min:   parseInt(minInput.value, 10) || 0
      };

      const V = window.FitCastValidation;
      if (f.from && f.to && f.from > f.to) {
        if (V) V.showFormMessage(form, 'Дата "Від" не може бути пізнішою за "До"', 'error');
        return;
      }
      if (V) V.hideFormMessage(form);

      const cards = document.querySelectorAll('#workoutList .wcard');
      let visibleCount = 0;
      cards.forEach(function (card) {
        const matches = cardMatchesFilters(card, f);
        card.hidden = !matches;
        if (matches) visibleCount++;
      });

      updateCounter(visibleCount, cards.length, f);
      updateEmptyState(visibleCount);
    }

    function cardMatchesFilters(card, f) {
      const cardType  = card.dataset.type;
      const cardDate  = card.dataset.date;
      const cardPlace = card.dataset.place;
      const cardDur   = parseInt(card.dataset.duration, 10);
      if (f.type && cardType !== f.type) return false;
      if (f.from && cardDate < f.from) return false;
      if (f.to   && cardDate > f.to)   return false;
      if (f.place === 'outdoor' && cardPlace !== 'outdoor') return false;
      if (f.place === 'indoor'  && cardPlace === 'outdoor') return false;
      if (f.min > 0 && cardDur < f.min) return false;
      return true;
    }

    function updateCounter(visible, total, f) {
      const counter = document.getElementById('filtersCount');
      if (!counter) return;
      const hasActiveFilter = f.type || f.from || f.to || f.place || f.min > 0;
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

    function updateEmptyState(visible) {
      const empty = document.getElementById('emptyState');
      const list  = document.getElementById('workoutList');
      if (!empty || !list) return;
      if (visible === 0) {
        empty.hidden = false;
        list.style.display = 'none';
      } else {
        empty.hidden = true;
        list.style.display = '';
      }
    }
  }

  /* ============================================================
     КНОПКИ ЗБЕРЕГТИ / ВИДАЛИТИ — event delegation
     ============================================================ */
  function initSaveButtons() {
    const list = document.getElementById('workoutList');
    if (!list) return;

    list.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const card = btn.closest('.wcard');
      if (!card) return;
      const action = btn.dataset.action;
      const id = card.dataset.id;

      if (action === 'save') {
        handleSave(card, btn, id);
      } else if (action === 'delete') {
        handleDelete(card, id);
      }
    });
  }

  function handleSave(card, btn, id) {
    const moodEl = card.querySelector('.mood-btn.selected');
    const mood   = moodEl ? moodEl.textContent.trim() : null;
    const notes  = (card.querySelector('textarea') || {}).value || '';
    const fileEl = card.querySelector('input[type="file"]');
    const photo  = fileEl && fileEl.files && fileEl.files[0]
                 ? fileEl.files[0].name : undefined;

    const changes = { mood: mood, notes: notes };
    if (photo !== undefined) changes.photo = photo;

    const D = window.FitCastWorkouts;
    if (D) D.update(id, changes);

    const origText = btn.textContent;
    btn.textContent = '✓ Збережено';
    btn.classList.add('form__btn--success');
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = origText;
      btn.classList.remove('form__btn--success');
      btn.disabled = false;
    }, 1800);
  }

  function handleDelete(card, id) {
    if (!confirm('Видалити це тренування? Дію не можна скасувати.')) return;
    const D = window.FitCastWorkouts;
    if (D) D.remove(id);
    card.style.opacity = '0';
    card.style.transform = 'translateX(-20px)';
    setTimeout(function () {
      card.remove();
      updateStatsTable();
      // оновити лічильник
      const form = document.querySelector('.filters');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 250);
  }

  /* ============================================================
     ЗВЕДЕНА ТАБЛИЦЯ — оновлюється динамічно
     ============================================================ */
  function updateStatsTable() {
    const D = window.FitCastWorkouts;
    if (!D) return;
    const tbody = document.querySelector('.table-wrap tbody');
    if (!tbody) return;

    const all = D.getAll();
    // Групуємо за типом
    const byType = {};
    all.forEach(function (w) {
      if (!byType[w.type]) byType[w.type] = [];
      byType[w.type].push(w);
    });

    const rows = Object.keys(byType).map(function (type) {
      const list = byType[type];
      const meta = D.getTypeMeta(type);
      const total = list.reduce((s, w) => s + w.duration, 0);
      const avg = Math.round(total / list.length);
      // Беремо найчастіше місце
      const places = list.map(w => w.place);
      const placeMode = places.sort((a, b) =>
        places.filter(p => p === a).length - places.filter(p => p === b).length
      ).pop();
      const placeMeta = D.getPlaceMeta(placeMode);
      return (
        '<tr>' +
          '<td>' + meta.emoji + ' ' + meta.label + '</td>' +
          '<td>' + list.length + '</td>' +
          '<td>' + total + ' хв</td>' +
          '<td>' + avg + ' хв</td>' +
          '<td><span class="badge badge--' + placeMeta.badge + '">' + placeMeta.label + '</span></td>' +
        '</tr>'
      );
    });
    tbody.innerHTML = rows.join('') || '<tr><td colspan="5" style="text-align:center; color: var(--text-light);">Поки немає даних</td></tr>';
  }

  /* ============================================================
     ХЕЛПЕРИ
     ============================================================ */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }
})();
