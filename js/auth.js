/* ============================================================
   FitCast — логіка входу та реєстрації
   Лаба 3: зовнішній скрипт з обробкою подій + валідація
   ============================================================ */

(function () {
  // Захардкоджені облікові дані (для лаби 3, потім замінимо на сервер)
  const VALID_USERS = [
    { email: 'toma@example.com', password: 'fitcast2025', name: 'Тома' }
  ];

  // Чекаємо на DOM
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const V = window.FitCastValidation;
    if (!V) {
      console.error('FitCastValidation не завантажено. Перевірте підключення validation.js');
      return;
    }

    initLoginForm(V);
    initRegisterForm(V);
  }

  /* ============================================================
     ФОРМА ВХОДУ (login.html)
     ============================================================ */
  function initLoginForm(V) {
    const form = document.querySelector('.auth-card form');
    // Перевіряємо, чи це саме сторінка входу (а не реєстрації)
    const titleEl = document.querySelector('.auth-card__title');
    if (!form || !titleEl || !titleEl.textContent.includes('Вхід')) return;

    const emailInput = form.querySelector('#email');
    const passInput  = form.querySelector('#password');

    /* --- ПОДІЯ 1: blur на email — перевірка формату при втраті фокусу --- */
    emailInput.addEventListener('blur', function () {
      const value = emailInput.value.trim();
      if (!value) {
        V.resetField(emailInput);
        return;
      }
      if (!V.isValidEmail(value)) {
        V.showError(emailInput, 'Невірний формат email');
      } else {
        V.clearError(emailInput);
      }
    });

    /* --- ПОДІЯ: input на email — прибрати помилку як тільки користувач почав виправляти --- */
    emailInput.addEventListener('input', function () {
      if (emailInput.classList.contains('input--invalid')) {
        V.resetField(emailInput);
      }
      V.hideFormMessage(form);
    });

    passInput.addEventListener('input', function () {
      if (passInput.classList.contains('input--invalid')) {
        V.resetField(passInput);
      }
      V.hideFormMessage(form);
    });

    /* --- ПОДІЯ 2: submit форми — перевірка облікових даних --- */
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passInput.value;
      let valid = true;

      // Перевірка email
      if (!email) {
        V.showError(emailInput, 'Введіть email');
        valid = false;
      } else if (!V.isValidEmail(email)) {
        V.showError(emailInput, 'Невірний формат email');
        valid = false;
      } else {
        V.clearError(emailInput);
      }

      // Перевірка пароля
      if (!password) {
        V.showError(passInput, 'Введіть пароль');
        valid = false;
      } else {
        V.clearError(passInput);
      }

      if (!valid) {
        V.showFormMessage(form, 'Будь ласка, виправте помилки вище', 'error');
        return;
      }

      // Звіряємо з захардкодженим списком
      const user = VALID_USERS.find(u => u.email === email && u.password === password);

      if (!user) {
        V.showError(passInput, 'Невірний email або пароль');
        V.showFormMessage(form, 'Невірні облікові дані. Спробуйте ще раз.', 'error');
        return;
      }

      // Успіх
      V.showFormMessage(form, `Вітаємо, ${user.name}! Перенаправлення на дашборд…`, 'success');
      setTimeout(function () {
        window.location.href = 'dashboard.html';
      }, 1200);
    });
  }

  /* ============================================================
     ФОРМА РЕЄСТРАЦІЇ (register.html)
     ============================================================ */
  function initRegisterForm(V) {
    const form = document.querySelector('.auth-card form');
    const titleEl = document.querySelector('.auth-card__title');
    if (!form || !titleEl || !titleEl.textContent.includes('акаунт')) return;
    // Виходимо, якщо це сторінка входу
    if (titleEl.textContent.includes('Вхід')) return;

    const nameInput  = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const passInput  = form.querySelector('#password');
    const pass2Input = form.querySelector('#password2');

    /* --- Створюємо індикатор міцності пароля динамічно --- */
    const strengthBar = document.createElement('div');
    strengthBar.className = 'strength-bar';
    strengthBar.innerHTML = '<div class="strength-bar__fill"></div><div class="strength-bar__label"></div>';
    passInput.parentElement.appendChild(strengthBar);
    const strengthFill  = strengthBar.querySelector('.strength-bar__fill');
    const strengthLabel = strengthBar.querySelector('.strength-bar__label');

    /* --- ПОДІЯ 1 (blur): перевірка email при втраті фокусу --- */
    emailInput.addEventListener('blur', function () {
      const v = emailInput.value.trim();
      if (!v) { V.resetField(emailInput); return; }
      if (!V.isValidEmail(v)) {
        V.showError(emailInput, 'Невірний формат email (приклад: name@mail.com)');
      } else {
        V.clearError(emailInput);
      }
    });

    /* --- blur на name --- */
    nameInput.addEventListener('blur', function () {
      const v = nameInput.value.trim();
      if (!v) { V.resetField(nameInput); return; }
      if (!V.isValidName(v)) {
        V.showError(nameInput, "Ім'я: 2–30 літер, без цифр і символів");
      } else {
        V.clearError(nameInput);
      }
    });

    /* --- input на password: динамічно оновлюємо індикатор міцності --- */
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
      strengthLabel.textContent = labels[strength];
      const widths = { weak: '33%', medium: '66%', strong: '100%' };
      strengthFill.style.width = widths[strength];
    });

    /* --- blur на password --- */
    passInput.addEventListener('blur', function () {
      const v = passInput.value;
      if (!v) { V.resetField(passInput); return; }
      if (v.length < V.MIN_PASSWORD_LENGTH) {
        V.showError(passInput, `Пароль має містити мінімум ${V.MIN_PASSWORD_LENGTH} символів`);
      } else {
        V.clearError(passInput);
      }
    });

    /* --- blur на password2: чи співпадають паролі --- */
    pass2Input.addEventListener('blur', function () {
      const v = pass2Input.value;
      if (!v) { V.resetField(pass2Input); return; }
      if (v !== passInput.value) {
        V.showError(pass2Input, 'Паролі не співпадають');
      } else {
        V.clearError(pass2Input);
      }
    });

    /* --- input на password2: автоматична перевірка під час вводу --- */
    pass2Input.addEventListener('input', function () {
      if (pass2Input.value && pass2Input.value === passInput.value) {
        V.clearError(pass2Input);
      }
    });

    /* --- БОНУС: різні дії на одну подію (submit) через систему подій ---
       Замість if-else вибираємо обробник через CustomEvent залежно від
       результату валідації. Кожен сценарій — окремий слухач. */

    // Слухач: успішна реєстрація
    form.addEventListener('register:success', function (e) {
      V.showFormMessage(form, `Акаунт створено! Вітаємо, ${e.detail.name}.`, 'success');
      setTimeout(function () { window.location.href = 'login.html'; }, 1500);
    });

    // Слухач: слабкий пароль (попередження, але дозволяємо)
    form.addEventListener('register:weak-password', function () {
      V.showFormMessage(form, 'Пароль слабкий — рекомендуємо додати великі літери, цифри або символи', 'info');
    });

    // Слухач: помилки валідації
    form.addEventListener('register:invalid', function (e) {
      V.showFormMessage(form, e.detail.message, 'error');
    });

    /* --- ПОДІЯ 2 (submit): валідуємо все, потім диспатчимо CustomEvent --- */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name  = nameInput.value.trim();
      const email = emailInput.value.trim();
      const pass  = passInput.value;
      const pass2 = pass2Input.value;

      // Послідовна валідація — кожна помилка зупиняє і диспатчить invalid
      if (!V.isValidName(name)) {
        V.showError(nameInput, "Введіть коректне ім'я");
        form.dispatchEvent(new CustomEvent('register:invalid', {
          detail: { message: "Перевірте ім'я" }
        }));
        return;
      }
      if (!V.isValidEmail(email)) {
        V.showError(emailInput, 'Невірний формат email');
        form.dispatchEvent(new CustomEvent('register:invalid', {
          detail: { message: 'Перевірте email' }
        }));
        return;
      }
      if (pass.length < V.MIN_PASSWORD_LENGTH) {
        V.showError(passInput, `Мінімум ${V.MIN_PASSWORD_LENGTH} символів`);
        form.dispatchEvent(new CustomEvent('register:invalid', {
          detail: { message: 'Пароль закороткий' }
        }));
        return;
      }
      if (pass !== pass2) {
        V.showError(pass2Input, 'Паролі не співпадають');
        form.dispatchEvent(new CustomEvent('register:invalid', {
          detail: { message: 'Паролі не співпадають' }
        }));
        return;
      }

      // Якщо пароль слабкий — попередимо, але реєстрацію дозволимо
      if (V.getPasswordStrength(pass) === 'weak') {
        form.dispatchEvent(new CustomEvent('register:weak-password'));
      }

      // Все ок — диспатчимо success
      form.dispatchEvent(new CustomEvent('register:success', {
        detail: { name: name, email: email }
      }));
    });
  }
})();
