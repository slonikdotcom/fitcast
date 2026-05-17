/* ============================================================
   FitCast — сторінка профілю
   - Завантаження даних із FitCastUser на старті
   - Збереження особистих даних при submit
   - Збереження налаштувань погоди при submit
   - Авто-збереження аватара одразу при виборі
   ============================================================ */

(function () {
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const mainForm = document.querySelector('.profile-card form');
    if (!mainForm) return;

    const V = window.FitCastValidation;
    const U = window.FitCastUser;
    if (!V || !U) {
      console.error('FitCastValidation або FitCastUser не завантажено');
      return;
    }

    // Завантажуємо профіль і заповнюємо все
    const profile = U.get();
    fillProfileFromData(profile);

    // 1. Форма особистих даних
    const personalForm = findFormWithField('#new-password');
    if (personalForm) initPersonalForm(personalForm, V, U);

    // 2. Форма налаштувань погоди
    const weatherForm = findFormWithField('#temp-min');
    if (weatherForm) initWeatherForm(weatherForm, V, U);

    // 3. Аватар (авто-збереження)
    initAvatarUpload(V, U);
  }

  function findFormWithField(selector) {
    const el = document.querySelector(selector);
    return el ? el.closest('form') : null;
  }

  /* ============================================================
     ЗАПОВНЕННЯ ПОЛІВ ПРИ ЗАВАНТАЖЕННІ
     ============================================================ */
  function fillProfileFromData(profile) {
    const U = window.FitCastUser;

    // Аватар
    const avatar    = document.getElementById('userAvatar');
    const avatarImg = document.getElementById('avatarImg');
    const letterEl  = avatar && avatar.querySelector('.avatar__letter');

    if (letterEl) letterEl.textContent = U.getInitial();
    if (profile.avatar && avatar && avatarImg) {
      avatarImg.src = profile.avatar;
      avatar.classList.add('avatar--has-photo');
    }

    // Ім'я та дата реєстрації
    const nameDisplay = document.querySelector('.avatar-info__name');
    const dateDisplay = document.querySelector('.avatar-info__date');
    if (nameDisplay) nameDisplay.textContent = profile.name;
    if (dateDisplay) dateDisplay.textContent = 'У FitCast з ' + U.formatJoinedDate();

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
    // Підписи коло range (бо oninput був прибраний з HTML)
    setLabel('temp-min-val', (w.tempMin || 10) + '°C');
    setLabel('temp-max-val', (w.tempMax || 28) + '°C');
    setLabel('wind-val',     (w.windMax || 10) + ' м/с');
  }

  function setVal(sel, value) {
    const el = document.querySelector(sel);
    if (el && value !== undefined && value !== null) el.value = value;
  }
  function setLabel(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ============================================================
     ФОРМА ОСОБИСТИХ ДАНИХ
     ============================================================ */
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

    /* SUBMIT — реальне збереження */
    form.addEventListener('submit', function (e) {
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

      // Реальне збереження
      U.update({ name: name, email: email, city: city });
      // Пароль зберігаємо НЕ у відкритому вигляді (у Лабі 5 — хеш на сервері).
      // Поки що — просто очищаємо поля.
      newPassInput.value = '';
      confirmPassInput.value = '';

      // Оновимо відображення в блоці аватара та літеру
      const nameDisplay = document.querySelector('.avatar-info__name');
      const letterEl    = document.querySelector('.avatar__letter');
      if (nameDisplay) nameDisplay.textContent = name;
      if (letterEl)    letterEl.textContent    = U.getInitial();

      V.showFormMessage(form, '✓ Дані профілю збережено!', 'success');
    });
  }

  /* ============================================================
     ФОРМА НАЛАШТУВАНЬ ПОГОДИ
     ============================================================ */
  function initWeatherForm(form, V, U) {
    const tempMin = form.querySelector('#temp-min');
    const tempMax = form.querySelector('#temp-max');
    const wind    = form.querySelector('#wind-max');
    const rain    = form.querySelector('#rain');

    bindRange(tempMin, 'temp-min-val', '°C');
    bindRange(tempMax, 'temp-max-val', '°C');
    bindRange(wind,    'wind-val',     ' м/с');

    tempMin.addEventListener('input', function () {
      if (parseInt(tempMin.value, 10) >= parseInt(tempMax.value, 10)) {
        tempMax.value = parseInt(tempMin.value, 10) + 1;
        const lbl = document.getElementById('temp-max-val');
        if (lbl) lbl.textContent = tempMax.value + '°C';
      }
    });

    /* SUBMIT — реальне збереження налаштувань погоди */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      U.updateWeatherSettings({
        tempMin: parseInt(tempMin.value, 10),
        tempMax: parseInt(tempMax.value, 10),
        windMax: parseInt(wind.value, 10),
        rain:    rain.value
      });
      V.showFormMessage(form, '✓ Налаштування погоди збережено!', 'success');
    });

    function bindRange(input, labelId, suffix) {
      const label = document.getElementById(labelId);
      if (!input || !label) return;
      input.addEventListener('input', function () {
        label.textContent = input.value + suffix;
      });
    }
  }

  /* ============================================================
     АВАТАР — авто-збереження одразу при виборі
     ============================================================ */
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
      reader.onload = function (e) {
        const dataUrl = e.target.result;
        const saved = U.setAvatar(dataUrl);
        if (!saved) {
          showAvatarError('Не вдалося зберегти (можливо файл завеликий для localStorage). Спробуй фото менше 2 МБ.');
          return;
        }
        imgEl.src = dataUrl;
        avatar.classList.add('avatar--has-photo');
        showAvatarFeedback('✓ Фото збережено');
      };
      reader.onerror = function () { showAvatarError('Не вдалося прочитати файл'); };
      reader.readAsDataURL(file);
    });

    removeBtn.addEventListener('click', function () {
      U.removeAvatar();
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
