// Спільні утиліти валідації форм.
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX  = /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ'\- ]{2,30}$/;
const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email).trim());
}

function isValidName(name) {
  return NAME_REGEX.test(String(name).trim());
}

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
