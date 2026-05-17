// Клієнтська логіка форм login та register.
(function () {
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const V = window.FitCastValidation;
    if (!V) { console.error('FitCastValidation не завантажено'); return; }
    initLoginForm(V);
    initRegisterForm(V);
  }

  function initLoginForm(V) {
    const form = document.querySelector('.auth-card form');
    const titleEl = document.querySelector('.auth-card__title');
    if (!form || !titleEl || !titleEl.textContent.includes('Вхід')) return;

    const emailInput = form.querySelector('#email');
    const passInput  = form.querySelector('#password');

    /* blur валідація email */
    emailInput.addEventListener('blur', function () {
      const v = emailInput.value.trim();
      if (!v) { V.resetField(emailInput); return; }
      if (!V.isValidEmail(v)) V.showError(emailInput, 'Невірний формат email');
      else V.clearError(emailInput);
    });

    /* input — прибрати помилку при редагуванні */
    [emailInput, passInput].forEach(function (inp) {
      inp.addEventListener('input', function () {
        if (inp.classList.contains('input--invalid')) V.resetField(inp);
        V.hideFormMessage(form);
      });
    });

    /* submit — справжній запит до /api/auth/login */
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      V.hideFormMessage(form);

      const email = emailInput.value.trim();
      const password = passInput.value;
      let valid = true;
      if (!email) { V.showError(emailInput, 'Введіть email'); valid = false; }
      else if (!V.isValidEmail(email)) { V.showError(emailInput, 'Невірний формат email'); valid = false; }
      if (!password) { V.showError(passInput, 'Введіть пароль'); valid = false; }
      if (!valid) {
        V.showFormMessage(form, 'Виправте помилки вище', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Вхід…';

      try {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        });
        const data = await resp.json();

        if (!resp.ok) {
          V.showError(passInput, data.error || 'Помилка входу');
          V.showFormMessage(form, data.error || 'Помилка входу', 'error');
          return;
        }

        V.showFormMessage(form, `Вітаємо, ${data.user.name}! Перенаправлення…`, 'success');
        setTimeout(function () { window.location.href = '/dashboard'; }, 800);
      } catch (err) {
        V.showFormMessage(form, 'Не вдалося звʼязатися з сервером. Спробуй ще раз.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Увійти';
      }
    });
  }

  function initRegisterForm(V) {
    const form = document.querySelector('.auth-card form');
    const titleEl = document.querySelector('.auth-card__title');
    if (!form || !titleEl || !titleEl.textContent.includes('акаунт')) return;
    if (titleEl.textContent.includes('Вхід')) return;

    const nameInput  = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const passInput  = form.querySelector('#password');
    const pass2Input = form.querySelector('#password2');

    /* індикатор міцності */
    const strengthBar = document.createElement('div');
    strengthBar.className = 'strength-bar';
    strengthBar.innerHTML = '<div class="strength-bar__fill"></div><div class="strength-bar__label"></div>';
    passInput.parentElement.appendChild(strengthBar);
    const strengthFill  = strengthBar.querySelector('.strength-bar__fill');
    const strengthLabel = strengthBar.querySelector('.strength-bar__label');

    emailInput.addEventListener('blur', function () {
      const v = emailInput.value.trim();
      if (!v) { V.resetField(emailInput); return; }
      if (!V.isValidEmail(v)) V.showError(emailInput, 'Невірний формат email (приклад: name@mail.com)');
      else V.clearError(emailInput);
    });
    nameInput.addEventListener('blur', function () {
      const v = nameInput.value.trim();
      if (!v) { V.resetField(nameInput); return; }
      if (!V.isValidName(v)) V.showError(nameInput, "Ім'я: 2–30 літер, без цифр і символів");
      else V.clearError(nameInput);
    });

    passInput.addEventListener('input', function () {
      const v = passInput.value;
      if (!v) {
        strengthFill.style.width = '0%';
        strengthFill.className = 'strength-bar__fill';
        strengthLabel.textContent = '';
        V.resetField(passInput);
        return;
      }
      const strength = V.getPasswordStrength(v);
      strengthFill.className = `strength-bar__fill strength-bar__fill--${strength}`;
      strengthLabel.className = `strength-bar__label strength-bar__label--${strength}`;
      const labels = { weak: 'Слабкий', medium: 'Середній', strong: 'Сильний' };
      const widths = { weak: '33%', medium: '66%', strong: '100%' };
      strengthLabel.textContent = labels[strength];
      strengthFill.style.width = widths[strength];
    });
    passInput.addEventListener('blur', function () {
      const v = passInput.value;
      if (!v) { V.resetField(passInput); return; }
      if (v.length < V.MIN_PASSWORD_LENGTH) {
        V.showError(passInput, `Пароль має містити мінімум ${V.MIN_PASSWORD_LENGTH} символів`);
      } else V.clearError(passInput);
    });
    pass2Input.addEventListener('blur', function () {
      const v = pass2Input.value;
      if (!v) { V.resetField(pass2Input); return; }
      if (v !== passInput.value) V.showError(pass2Input, 'Паролі не співпадають');
      else V.clearError(pass2Input);
    });
    pass2Input.addEventListener('input', function () {
      if (pass2Input.value && pass2Input.value === passInput.value) V.clearError(pass2Input);
    });

    /* CustomEvent диспатч (бонус Лаби 3 — лишаємо) */
    form.addEventListener('register:invalid', function (e) {
      V.showFormMessage(form, e.detail.message, 'error');
    });
    form.addEventListener('register:weak-password', function () {
      V.showFormMessage(form, 'Пароль слабкий — рекомендуємо додати великі літери, цифри або символи', 'info');
    });
    form.addEventListener('register:server-error', function (e) {
      V.showFormMessage(form, e.detail.message, 'error');
    });
    form.addEventListener('register:success', function (e) {
      V.showFormMessage(form, `Акаунт створено! Вітаємо, ${e.detail.name}.`, 'success');
      setTimeout(function () { window.location.href = '/dashboard'; }, 1200);
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name  = nameInput.value.trim();
      const email = emailInput.value.trim();
      const pass  = passInput.value;
      const pass2 = pass2Input.value;

      if (!V.isValidName(name)) {
        V.showError(nameInput, "Введіть коректне ім'я");
        return form.dispatchEvent(new CustomEvent('register:invalid', { detail: { message: "Перевірте ім'я" } }));
      }
      if (!V.isValidEmail(email)) {
        V.showError(emailInput, 'Невірний формат email');
        return form.dispatchEvent(new CustomEvent('register:invalid', { detail: { message: 'Перевірте email' } }));
      }
      if (pass.length < V.MIN_PASSWORD_LENGTH) {
        V.showError(passInput, `Мінімум ${V.MIN_PASSWORD_LENGTH} символів`);
        return form.dispatchEvent(new CustomEvent('register:invalid', { detail: { message: 'Пароль закороткий' } }));
      }
      if (pass !== pass2) {
        V.showError(pass2Input, 'Паролі не співпадають');
        return form.dispatchEvent(new CustomEvent('register:invalid', { detail: { message: 'Паролі не співпадають' } }));
      }
      if (V.getPasswordStrength(pass) === 'weak') {
        form.dispatchEvent(new CustomEvent('register:weak-password'));
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Реєструємо…';

      try {
        const resp = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, email: email, password: pass })
        });
        const data = await resp.json();

        if (!resp.ok) {
          form.dispatchEvent(new CustomEvent('register:server-error', {
            detail: { message: data.error || 'Помилка реєстрації' }
          }));
          if (resp.status === 409) V.showError(emailInput, 'Email вже зайнятий');
          return;
        }

        form.dispatchEvent(new CustomEvent('register:success', {
          detail: { name: data.user.name, email: data.user.email }
        }));
      } catch (err) {
        form.dispatchEvent(new CustomEvent('register:server-error', {
          detail: { message: 'Не вдалося звʼязатися з сервером. Спробуй ще раз.' }
        }));
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Зареєструватись';
      }
    });
  }
})();
