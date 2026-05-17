/* ============================================================
   FitCast — валідація форми додавання тренування
   Лаба 3: ОБОВ'ЯЗКОВЕ — валідація + 2+ події (blur, submit, change)
   Лаба 3: БОНУС — різні дії на одну подію через систему подій
              (CustomEvent workout:validate:{type}), без if-else.
   ============================================================ */

(function () {
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const form = document.querySelector('.add-card form');
    if (!form) return; // не та сторінка

    const V = window.FitCastValidation;
    if (!V) {
      console.error('FitCastValidation не завантажено');
      return;
    }

    const typeSelect    = form.querySelector('#type');
    const typeCustom    = form.querySelector('#type-custom');
    const dateInput     = form.querySelector('#date');
    const timeInput     = form.querySelector('#time-start');
    const durationInput = form.querySelector('#duration');
    const placeSelect   = form.querySelector('#place');
    const placeCustom   = form.querySelector('#place-custom');
    const notesInput    = form.querySelector('#notes');

    /* ============================================================
       РЕЖИМ РЕДАГУВАННЯ: якщо в URL є ?id=X — заповнюємо форму
       (getById тепер async — чекаємо на сервер)
       ============================================================ */
    const editId = getEditIdFromUrl();
    if (editId !== null && window.FitCastWorkouts) {
      (async () => {
        try {
          const workout = await window.FitCastWorkouts.getById(editId);
          if (workout) {
            prefillForm(workout);
            switchToEditMode(workout);
          } else {
            V.showFormMessage(form,
              'Тренування з id=' + editId + ' не знайдено. Створюємо нове.', 'info');
          }
        } catch (e) {
          V.showFormMessage(form,
            'Не вдалося завантажити тренування для редагування.', 'error');
        }
      })();
    } else {
      // Прехід з погодного віджету: ?date=YYYY-MM-DD&time=HH:MM
      // (нове тренування, але з підказкою про дату/час)
      const params = new URLSearchParams(window.location.search);
      const presetDate = params.get('date');
      const presetTime = params.get('time');
      if (presetDate && /^\d{4}-\d{2}-\d{2}$/.test(presetDate)) {
        dateInput.value = presetDate;
      }
      if (presetTime && /^\d{2}:\d{2}$/.test(presetTime)) {
        timeInput.value = presetTime;
      }
      if (presetDate || presetTime) {
        V.showFormMessage(form,
          '☀️ Сприятлива година для тренувань. Поля заповнено — обери тип і збережи.', 'info');
      }
    }

    function getEditIdFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (!id) return null;
      const num = parseInt(id, 10);
      return isNaN(num) ? null : num;
    }

    function prefillForm(w) {
      typeSelect.value = w.type;
      if (w.type === 'other') {
        typeCustom.style.display = 'block';
        typeCustom.required = true;
      }
      dateInput.value = w.date;
      timeInput.value = w.timeStart;
      durationInput.value = w.duration;
      placeSelect.value = w.place;
      if (notesInput) notesInput.value = w.notes || '';
    }

    function switchToEditMode(w) {
      const titleEl = document.getElementById('formTitle');
      const subEl   = document.getElementById('formSubtitle');
      const btnEl   = document.getElementById('submitBtn');
      const meta    = window.FitCastWorkouts.getTypeMeta(w.type);

      if (titleEl) titleEl.textContent = 'Редагування: ' + meta.emoji + ' ' + meta.label;
      if (subEl)   subEl.textContent   = 'Оновіть дані тренування від ' +
                                          formatHumanDate(w.date);
      if (btnEl)   btnEl.textContent   = 'Зберегти зміни';
      // Зберігаємо id у формі (data-атрибут) для submit
      form.dataset.editId = String(w.id);
    }

    function formatHumanDate(iso) {
      const [y, m, d] = iso.split('-');
      return d + '.' + m + '.' + y;
    }

    /* ============================================================
       ОБРОБКА "ІНШЕ" для select (винесено з інлайнового JS)
       Подія: change
       ============================================================ */
    typeSelect.addEventListener('change', function () {
      toggleCustomInput(typeSelect, typeCustom);
    });
    placeSelect.addEventListener('change', function () {
      toggleCustomInput(placeSelect, placeCustom);
    });

    function toggleCustomInput(select, customInput) {
      if (select.value === 'other') {
        customInput.style.display = 'block';
        customInput.required = true;
        customInput.focus();
      } else {
        customInput.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
        V.resetField(customInput);
      }
    }

    /* ============================================================
       ВАЛІДАЦІЯ ОКРЕМИХ ПОЛІВ — подія blur
       ============================================================ */

    durationInput.addEventListener('blur', function () {
      const v = parseInt(durationInput.value, 10);
      if (!durationInput.value) { V.resetField(durationInput); return; }
      if (isNaN(v) || v <= 0) {
        V.showError(durationInput, 'Тривалість має бути додатнім числом');
      } else if (v > 600) {
        V.showError(durationInput, 'Максимум 600 хвилин (10 годин)');
      } else {
        V.clearError(durationInput);
      }
    });

    dateInput.addEventListener('blur', function () {
      if (!dateInput.value) { V.resetField(dateInput); return; }
      // Дозволяємо тільки сьогодні та майбутнє
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const picked = new Date(dateInput.value);
      // Якщо дата в дуже далекому минулому — попередимо
      const diffDays = (today - picked) / (1000 * 60 * 60 * 24);
      if (diffDays > 365) {
        V.showError(dateInput, 'Дата задавнена більше ніж на рік');
      } else {
        V.clearError(dateInput);
      }
    });

    timeInput.addEventListener('blur', function () {
      if (!timeInput.value) { V.resetField(timeInput); return; }
      V.clearError(timeInput);
    });

    /* ============================================================
       БОНУС: РІЗНІ ВАЛІДАТОРИ ДЛЯ РІЗНИХ ТИПІВ ТРЕНУВАНЬ
       Реалізовано через CustomEvent — НЕ через if-else у submit.
       Кожен тип має свою власну функцію-слухач, зареєстровану
       на формі через addEventListener('workout:validate:{type}', ...).
       На submit ми емітимо СПЕЦИФІЧНУ подію за назвою типу — і
       спрацьовує саме потрібний обробник.
       ============================================================ */

    // Універсальні правила, що працюють завжди (загальний слухач)
    form.addEventListener('workout:validate:any', function (e) {
      const ctx = e.detail; // { duration, date, time, place }
      ctx.errors = ctx.errors || [];
      if (!ctx.date)  ctx.errors.push('Оберіть дату');
      if (!ctx.time)  ctx.errors.push('Оберіть час початку');
      if (!ctx.duration || ctx.duration <= 0) ctx.errors.push('Введіть тривалість');
    });

    // Специфічні правила для кожного типу — окремі слухачі
    form.addEventListener('workout:validate:run', function (e) {
      const ctx = e.detail;
      // Біг: мінімум 10 хв, бажано на вулиці
      if (ctx.duration < 10) {
        ctx.errors.push('Біг має тривати щонайменше 10 хвилин');
      }
      if (ctx.place === 'home') {
        ctx.warnings.push('Біг краще проводити на вулиці або в залі');
      }
    });

    form.addEventListener('workout:validate:gym', function (e) {
      const ctx = e.detail;
      // Зал: тільки в залі (попередження якщо інше)
      if (ctx.duration < 20) {
        ctx.errors.push('Силове тренування — мінімум 20 хвилин');
      }
      if (ctx.place !== 'gym') {
        ctx.warnings.push('Локація для залу зазвичай — "Зал"');
      }
    });

    form.addEventListener('workout:validate:bike', function (e) {
      const ctx = e.detail;
      // Велосипед: мінімум 15 хв
      if (ctx.duration < 15) {
        ctx.errors.push('Велотренування — мінімум 15 хвилин');
      }
      if (ctx.place === 'home') {
        ctx.warnings.push('Велосипед зазвичай на вулиці (або стаціонарний — оберіть "Зал")');
      }
    });

    form.addEventListener('workout:validate:yoga', function (e) {
      const ctx = e.detail;
      // Йога: мінімум 15 хв, максимум 180
      if (ctx.duration < 15) {
        ctx.errors.push('Йога — мінімум 15 хвилин');
      }
      if (ctx.duration > 180) {
        ctx.errors.push('Йога рідко триває більше 3 годин — перевірте тривалість');
      }
    });

    form.addEventListener('workout:validate:swim', function (e) {
      const ctx = e.detail;
      if (ctx.duration < 20) {
        ctx.errors.push('Плавання — мінімум 20 хвилин');
      }
      if (ctx.place === 'outdoor' || ctx.place === 'home') {
        ctx.warnings.push('Для плавання локація зазвичай — "Зал" (басейн)');
      }
    });

    form.addEventListener('workout:validate:other', function (e) {
      const ctx = e.detail;
      // Кастомний тип — мінімальна перевірка
      if (!ctx.typeCustom || ctx.typeCustom.length < 2) {
        ctx.errors.push('Опишіть свій тип тренування (мінімум 2 символи)');
      }
    });

    // Фінальний слухач — після всіх валідацій вирішує: зберегти чи показати помилку
    form.addEventListener('workout:validate:done', async function (e) {
      const ctx = e.detail;
      if (ctx.errors.length > 0) {
        V.showFormMessage(form, ctx.errors[0], 'error');
        return;
      }

      const editingId = form.dataset.editId;
      const verb = editingId ? 'оновлено' : 'збережено';

      // Збираємо об'єкт для збереження.
      // Фото читаємо як data URL (щоб зберегти у БД).
      const photoEl = form.querySelector('#photo');
      let photoDataUrl = null;
      if (photoEl && photoEl.files && photoEl.files[0]) {
        try {
          photoDataUrl = await readFileAsDataUrl(photoEl.files[0]);
        } catch (err) {
          V.showFormMessage(form, 'Не вдалося прочитати фото', 'error');
          return;
        }
      }

      const workoutData = {
        type:        ctx.type,
        date:        ctx.date,
        timeStart:   ctx.time,
        duration:    ctx.duration,
        place:       ctx.place,
        notes:       (notesInput && notesInput.value) || '',
        photo:       photoDataUrl
      };
      if (ctx.type === 'other' && ctx.typeCustom) {
        workoutData.typeCustom = ctx.typeCustom;
      }

      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Зберігаємо…'; }

      try {
        if (editingId) {
          await window.FitCastWorkouts.update(editingId, workoutData);
        } else {
          await window.FitCastWorkouts.create(workoutData);
        }
      } catch (err) {
        V.showFormMessage(form, err.message || ('Помилка ' + verb), 'error');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Зберегти тренування'; }
        return;
      }

      let msg = '✓ Тренування ' + verb + '!';
      if (ctx.warnings.length > 0) {
        msg = '⚠️ ' + ctx.warnings[0] + ' — тренування все одно ' + verb;
      }
      msg += ' Перенаправлення на історію…';
      V.showFormMessage(form, msg, ctx.warnings.length > 0 ? 'info' : 'success');

      setTimeout(function () { window.location.href = '/history'; }, 1200);
    });

    function readFileAsDataUrl(file) {
      return new Promise(function (resolve, reject) {
        const r = new FileReader();
        r.onload = function (ev) { resolve(ev.target.result); };
        r.onerror = function () { reject(new Error('FileReader error')); };
        r.readAsDataURL(file);
      });
    }

    /* ============================================================
       SUBMIT — диспатчимо ланцюжок CustomEvent
       Сам submit НЕ містить if-else для вибору валідатора.
       ============================================================ */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      V.hideFormMessage(form);

      // Збираємо контекст
      const type = typeSelect.value;
      const ctx = {
        type:       type,
        typeCustom: typeCustom.value.trim(),
        date:       dateInput.value,
        time:       timeInput.value,
        duration:   parseInt(durationInput.value, 10),
        place:      placeSelect.value,
        placeCustom: placeCustom.value.trim(),
        errors:     [],
        warnings:   []
      };

      if (!type) {
        V.showFormMessage(form, 'Оберіть тип тренування', 'error');
        return;
      }

      // 1. Загальна валідація
      form.dispatchEvent(new CustomEvent('workout:validate:any', { detail: ctx }));
      // 2. Специфічна для типу — назва події САМА вибирає обробник (бонус!)
      form.dispatchEvent(new CustomEvent('workout:validate:' + type, { detail: ctx }));
      // 3. Завершення
      form.dispatchEvent(new CustomEvent('workout:validate:done', { detail: ctx }));
    });
  }
})();
