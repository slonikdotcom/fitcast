// Сторінка профілю: дані, налаштування погоди, аватар.
(function () {
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const mainForm = document.querySelector('.profile-card form');
    if (!mainForm) return;

    const V = window.FitCastValidation;
    const U = window.FitCastUser;
    if (!V || !U) {
      console.error('FitCastValidation або FitCastUser не завантажено');
      return;
    }

    // Завантажуємо профіль із сервера і заповнюємо все
    let profile;
    try {
      profile = await U.get();
    } catch (e) {
      console.error('Не вдалося завантажити профіль:', e);
      return;
    }
    fillProfileFromData(profile);

    // 1. Форма особистих даних
    const personalForm = findFormWithField('#new-password');
    if (personalForm) initPersonalForm(personalForm, V, U);

    // 2. Форма налаштувань погоди
    const weatherForm = findFormWithField('#temp-min');
    if (weatherForm) initWeatherForm(weatherForm, V, U);

    // 3. Аватар (авто-збереження)
    initAvatarUpload(V, U);

    // 4. Реальна статистика з тренувань користувача
    loadStats();
  }

  async function loadStats() {
    const W = window.FitCastWorkouts;
    if (!W) return;

    const totalEl = document.getElementById('stat-total');
    const hoursEl = document.getElementById('stat-hours');
    const weekEl  = document.getElementById('stat-week');

    let workouts;
    try { workouts = await W.getAll(); }
    catch (e) {
      if (totalEl) totalEl.textContent = '0';
      if (hoursEl) hoursEl.textContent = '0';
      if (weekEl)  weekEl.textContent  = '0';
      return;
    }

    const total = workouts.length;
    const totalMinutes = workouts.reduce(function (sum, w) { return sum + (w.duration || 0); }, 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Тренувань за останні 7 днів (включно з сьогодні)
    const weekAgo = new Date();
    weekAgo.setHours(0, 0, 0, 0);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekAgoIso = weekAgo.getFullYear() + '-' +
                       String(weekAgo.getMonth() + 1).padStart(2, '0') + '-' +
                       String(weekAgo.getDate()).padStart(2, '0');
    const weekCount = workouts.filter(function (w) { return w.date >= weekAgoIso; }).length;

    if (totalEl) totalEl.textContent = String(total);
    if (hoursEl) hoursEl.textContent = String(totalHours);
    if (weekEl)  weekEl.textContent  = String(weekCount);
  }

  function findFormWithField(selector) {
    const el = document.querySelector(selector);
    return el ? el.closest('form') : null;
  }

  function fillProfileFromData(profile) {
    const U = window.FitCastUser;

    // Аватар
    const avatar    = document.getElementById('userAvatar');
    const avatarImg = document.getElementById('avatarImg');
    const letterEl  = avatar && avatar.querySelector('.avatar__letter');

    if (letterEl) letterEl.textContent = U.getInitial(profile);
    if (profile.avatar && avatar && avatarImg) {
      avatarImg.src = profile.avatar;
      avatar.classList.add('avatar--has-photo');
    }

    // Ім'я та дата реєстрації
    const nameDisplay = document.querySelector('.avatar-info__name');
    const dateDisplay = document.querySelector('.avatar-info__date');
    if (nameDisplay) nameDisplay.textContent = profile.name;
    if (dateDisplay) dateDisplay.textContent = 'У FitCast з ' + U.formatJoinedDate(profile);

    // Особисті дані
    setVal('#name',  profile.name);
    setVal('#email', profile.email);
    setVal('#city',  profile.city);

    // Налаштування погоди
    const w = profile.weatherSettings || {};
    setVal('#temp-min', w.tempMin);
    setVal('#temp-max', w.tempMax);
    setVal('#wind-max', w.windMax);
    setVal('#rain',     w.rain);
    setVal('#hour-start', w.hourStart);
    setVal('#hour-end',   w.hourEnd);
    setLabel('temp-min-val', (w.tempMin || 10) + '°C');
    setLabel('temp-max-val', (w.tempMax || 28) + '°C');
    setLabel('wind-val',     (w.windMax || 10) + ' м/с');
    setLabel('hour-start-val', String(w.hourStart || 6).padStart(2,'0') + ':00');
    setLabel('hour-end-val',   String(w.hourEnd   || 22).padStart(2,'0') + ':00');
  }

  function setVal(sel, value) {
    const el = document.querySelector(sel);
    if (el && value !== undefined && value !== null) el.value = value;
  }
  function setLabel(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function initPersonalForm(form, V, U) {
    const nameInput        = form.querySelector('#name');
    const emailInput       = form.querySelector('#email');
    const cityInput        = form.querySelector('#city');
    const newPassInput     = form.querySelector('#new-password');
    const confirmPassInput = form.querySelector('#confirm-password');

    /* blur валідація — без змін */
    emailInput.addEventListener('blur', function () {
      const v = emailInput.value.trim();
      if (!v) { V.resetField(emailInput); return; }
      if (!V.isValidEmail(v)) V.showError(emailInput, 'Невірний формат email');
      else V.clearError(emailInput);
    });
    nameInput.addEventListener('blur', function () {
      const v = nameInput.value.trim();
      if (!v) { V.resetField(nameInput); return; }
      if (!V.isValidName(v)) V.showError(nameInput, "Ім'я: 2–30 літер");
      else V.clearError(nameInput);
    });
    newPassInput.addEventListener('input', function () {
      if (!newPassInput.value) {
        V.resetField(newPassInput);
        V.resetField(confirmPassInput);
        return;
      }
      if (confirmPassInput.value && confirmPassInput.value === newPassInput.value) {
        V.clearError(confirmPassInput);
      }
    });
    newPassInput.addEventListener('blur', function () {
      const v = newPassInput.value;
      if (!v) { V.resetField(newPassInput); return; }
      if (v.length < V.MIN_PASSWORD_LENGTH) {
        V.showError(newPassInput, `Мінімум ${V.MIN_PASSWORD_LENGTH} символів`);
      } else V.clearError(newPassInput);
    });
    confirmPassInput.addEventListener('blur', function () {
      const v = confirmPassInput.value;
      if (!newPassInput.value && !v) { V.resetField(confirmPassInput); return; }
      if (v !== newPassInput.value) V.showError(confirmPassInput, 'Паролі не співпадають');
      else V.clearError(confirmPassInput);
    });

    /* SUBMIT — реальне збереження на сервер */
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      let valid = true;

      const name  = nameInput.value.trim();
      const email = emailInput.value.trim();
      const city  = cityInput.value;

      if (!V.isValidName(name))   { V.showError(nameInput,  "Невірне ім'я");          valid = false; }
      if (!V.isValidEmail(email)) { V.showError(emailInput, 'Невірний формат email'); valid = false; }

      if (newPassInput.value) {
        if (newPassInput.value.length < V.MIN_PASSWORD_LENGTH) {
          V.showError(newPassInput, `Мінімум ${V.MIN_PASSWORD_LENGTH} символів`);
          valid = false;
        }
        if (newPassInput.value !== confirmPassInput.value) {
          V.showError(confirmPassInput, 'Паролі не співпадають');
          valid = false;
        }
      }

      if (!valid) {
        V.showFormMessage(form, 'Перевірте виділені поля', 'error');
        return;
      }

      try {
        const updated = await U.update({ name: name, email: email, city: city });
        // Поля паролю просто очищаємо — у Лабі 5 окремо зробимо ендпоінт зміни пароля
        newPassInput.value = '';
        confirmPassInput.value = '';

        // Оновимо відображення в блоці аватара та літеру
        const nameDisplay = document.querySelector('.avatar-info__name');
        const letterEl    = document.querySelector('.avatar__letter');
        if (nameDisplay) nameDisplay.textContent = updated.name;
        if (letterEl)    letterEl.textContent    = U.getInitial(updated);

        V.showFormMessage(form, '✓ Дані профілю збережено!', 'success');
      } catch (err) {
        V.showFormMessage(form, err.message || 'Помилка збереження', 'error');
      }
    });
  }

  function initWeatherForm(form, V, U) {
    const tempMin   = form.querySelector('#temp-min');
    const tempMax   = form.querySelector('#temp-max');
    const wind      = form.querySelector('#wind-max');
    const rain      = form.querySelector('#rain');
    const hourStart = form.querySelector('#hour-start');
    const hourEnd   = form.querySelector('#hour-end');

    bindRange(tempMin, 'temp-min-val', '°C');
    bindRange(tempMax, 'temp-max-val', '°C');
    bindRange(wind,    'wind-val',     ' м/с');
    bindHourRange(hourStart, 'hour-start-val');
    bindHourRange(hourEnd,   'hour-end-val');

    // hour_start не може бути >= hour_end
    hourStart.addEventListener('input', function () {
      if (parseInt(hourStart.value, 10) >= parseInt(hourEnd.value, 10)) {
        hourEnd.value = parseInt(hourStart.value, 10) + 1;
        const lbl = document.getElementById('hour-end-val');
        if (lbl) lbl.textContent = String(hourEnd.value).padStart(2,'0') + ':00';
      }
    });

    tempMin.addEventListener('input', function () {
      if (parseInt(tempMin.value, 10) >= parseInt(tempMax.value, 10)) {
        tempMax.value = parseInt(tempMin.value, 10) + 1;
        const lbl = document.getElementById('temp-max-val');
        if (lbl) lbl.textContent = tempMax.value + '°C';
      }
    });

    /* SUBMIT — реальне збереження налаштувань погоди на сервер */
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      try {
        await U.updateWeatherSettings({
          tempMin:   parseInt(tempMin.value, 10),
          tempMax:   parseInt(tempMax.value, 10),
          windMax:   parseInt(wind.value, 10),
          rain:      rain.value,
          hourStart: parseInt(hourStart.value, 10),
          hourEnd:   parseInt(hourEnd.value, 10)
        });
        V.showFormMessage(form, '✓ Налаштування погоди збережено!', 'success');
      } catch (err) {
        V.showFormMessage(form, err.message || 'Помилка збереження', 'error');
      }
    });

    function bindRange(input, labelId, suffix) {
      const label = document.getElementById(labelId);
      if (!input || !label) return;
      input.addEventListener('input', function () {
        label.textContent = input.value + suffix;
      });
    }
    function bindHourRange(input, labelId) {
      const label = document.getElementById(labelId);
      if (!input || !label) return;
      input.addEventListener('input', function () {
        label.textContent = String(input.value).padStart(2,'0') + ':00';
      });
    }
  }

  function initAvatarUpload(V, U) {
    const input    = document.getElementById('avatar-upload');
    const avatar   = document.getElementById('userAvatar');
    const imgEl    = document.getElementById('avatarImg');
    const removeBtn= document.getElementById('avatarRemove');
    if (!input || !avatar) return;

    const MAX_SIZE = 5 * 1024 * 1024;

    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showAvatarError('Можна завантажувати тільки зображення (JPG, PNG, WebP)');
        input.value = ''; return;
      }
      if (file.size > MAX_SIZE) {
        showAvatarError('Файл занадто великий (макс 5 МБ)');
        input.value = ''; return;
      }
      clearAvatarError();

      const reader = new FileReader();
      reader.onload = async function (e) {
        const dataUrl = e.target.result;
        showAvatarFeedback('Зберігаємо…');
        const saved = await U.setAvatar(dataUrl);
        if (!saved) {
          showAvatarError('Не вдалося зберегти фото на сервері. Спробуй менший файл.');
          return;
        }
        imgEl.src = dataUrl;
        avatar.classList.add('avatar--has-photo');
        showAvatarFeedback('✓ Фото збережено');
      };
      reader.onerror = function () { showAvatarError('Не вдалося прочитати файл'); };
      reader.readAsDataURL(file);
    });

    removeBtn.addEventListener('click', async function () {
      try { await U.removeAvatar(); }
      catch (e) { showAvatarError('Не вдалося видалити: ' + e.message); return; }
      input.value = '';
      imgEl.src = '';
      avatar.classList.remove('avatar--has-photo');
      showAvatarFeedback('Фото прибрано');
    });

    function showAvatarError(msg) {
      const wrapper = input.parentElement;
      let err = wrapper.querySelector('.file-error');
      if (!err) {
        err = document.createElement('div');
        err.className = 'file-error';
        err.setAttribute('role', 'alert');
        wrapper.appendChild(err);
      }
      err.textContent = msg;
    }
    function clearAvatarError() {
      const err = input.parentElement.querySelector('.file-error');
      if (err) err.remove();
    }
    function showAvatarFeedback(msg) {
      const wrapper = input.parentElement;
      let fb = wrapper.querySelector('.avatar-feedback');
      if (!fb) {
        fb = document.createElement('div');
        fb.className = 'avatar-feedback';
        fb.setAttribute('role', 'status');
        wrapper.appendChild(fb);
      }
      fb.textContent = msg;
      fb.classList.add('avatar-feedback--visible');
      setTimeout(function () { fb.classList.remove('avatar-feedback--visible'); }, 1800);
    }
  }
})();
