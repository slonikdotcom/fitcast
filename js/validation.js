/* ============================================================
   FitCast — спільні утиліти валідації
   Лаба 3: JavaScript. Маніпуляції DOM та події.
   ============================================================ */

/* --- Константи --- */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX  = /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ'\- ]{2,30}$/;
const MIN_PASSWORD_LENGTH = 8;

/* --- Перевірка email --- */
function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email).trim());
}

/* --- Перевірка імені --- */
function isValidName(name) {
  return NAME_REGEX.test(String(name).trim());
}

/* --- Перевірка пароля: повертає 'weak' | 'medium' | 'strong' --- */
function getPasswordStrength(password) {
  if (password.length < MIN_PASSWORD_LENGTH) return 'weak';
  const hasUpper  = /[A-Z]/.test(password);
  const hasLower  = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const score = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  if (score >= 3) return 'strong';
  if (score === 2) return 'medium';
  return 'weak';
}

/* --- Показати помилку біля поля --- */
function showError(input, message) {
  if (!input) return;
  let errorEl = input.parentElement.querySelector('.form__error');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'form__error';
    errorEl.setAttribute('role', 'alert');
    input.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;
  errorEl.classList.add('form__error--visible');
  input.classList.add('input--invalid');
  input.classList.remove('input--valid');
  input.setAttribute('aria-invalid', 'true');
}

/* --- Прибрати помилку, показати "успіх" --- */
function clearError(input) {
  if (!input) return;
  const errorEl = input.parentElement.querySelector('.form__error');
  if (errorEl) {
    errorEl.classList.remove('form__error--visible');
    errorEl.textContent = '';
  }
  input.classList.remove('input--invalid');
  input.classList.add('input--valid');
  input.removeAttribute('aria-invalid');
}

/* --- Скинути всі стани (валідне/невалідне) --- */
function resetField(input) {
  if (!input) return;
  const errorEl = input.parentElement.querySelector('.form__error');
  if (errorEl) {
    errorEl.classList.remove('form__error--visible');
    errorEl.textContent = '';
  }
  input.classList.remove('input--invalid', 'input--valid');
  input.removeAttribute('aria-invalid');
}

/* --- Загальне повідомлення на рівні форми --- */
function showFormMessage(form, message, type) {
  // type: 'success' | 'error' | 'info'
  let msgEl = form.querySelector('.form__message');
  if (!msgEl) {
    msgEl = document.createElement('div');
    msgEl.className = 'form__message';
    msgEl.setAttribute('role', 'status');
    form.insertBefore(msgEl, form.firstChild);
  }
  msgEl.textContent = message;
  msgEl.className = `form__message form__message--${type} form__message--visible`;
}

function hideFormMessage(form) {
  const msgEl = form.querySelector('.form__message');
  if (msgEl) msgEl.classList.remove('form__message--visible');
}

/* --- Експорт у глобальний namespace (щоб не возитись з модулями) --- */
window.FitCastValidation = {
  EMAIL_REGEX,
  NAME_REGEX,
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  isValidName,
  getPasswordStrength,
  showError,
  clearError,
  resetField,
  showFormMessage,
  hideFormMessage
};
