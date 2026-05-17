// Фото-прев’ю (квадрат) та лайтбокс для тренувань.
// Структура у HTML/SSR: <div class="photo-input">…</div>
// Підвантажується автоматично для всіх контейнерів з класом .photo-input.

(function () {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ

  function attach(container) {
    if (!container || container.dataset.previewAttached === '1') return;
    container.dataset.previewAttached = '1';

    const input    = container.querySelector('.photo-input__file');
    const display  = container.querySelector('.photo-input__display');
    const img      = container.querySelector('.photo-input__img');
    const removeBtn= container.querySelector('.photo-input__remove');
    if (!input || !display || !img) return;

    // Якщо у img вже є src (SSR підставив збережене фото) — позначити контейнер
    // та лишити стійкий маркер для history.js (щоб знати, чи фото прийшло з БД).
    if (img.getAttribute('src')) {
      container.classList.add('photo-input--has-image');
      container.dataset.hadInitialPhoto = '1';
    }

    // Клік по дисплею: відкрити лайтбокс або викликати file picker
    display.addEventListener('click', function () {
      if (container.classList.contains('photo-input--has-image')) {
        openLightbox(img.src);
      } else {
        input.click();
      }
    });

    // Подія: вибір файлу
    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showError(container, 'Можна завантажувати тільки зображення (JPG, PNG, WebP)');
        input.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showError(container, 'Файл занадто великий (макс ' + formatSize(MAX_FILE_SIZE) + ')');
        input.value = '';
        return;
      }
      clearError(container);

      const reader = new FileReader();
      reader.onload = function (e) {
        img.src = e.target.result;
        container.classList.add('photo-input--has-image');
        input.dispatchEvent(new CustomEvent('photo:loaded', {
          detail: { file: file, dataUrl: e.target.result }
        }));
      };
      reader.onerror = function () { showError(container, 'Не вдалося прочитати файл'); };
      reader.readAsDataURL(file);
    });

    // Прибрати фото
    if (removeBtn) {
      removeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        input.value = '';
        img.removeAttribute('src');
        container.classList.remove('photo-input--has-image');
        input.dispatchEvent(new CustomEvent('photo:removed'));
      });
    }
  }

  // Лайтбокс — глобальний оверлей, створюється один раз і перевикористовується
  let lightbox;
  function ensureLightbox() {
    if (lightbox) return lightbox;
    lightbox = document.createElement('div');
    lightbox.className = 'photo-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-label', 'Перегляд фото');
    lightbox.innerHTML =
      '<button class="photo-lightbox__close" aria-label="Закрити">✕</button>' +
      '<img class="photo-lightbox__img" alt="" />';
    document.body.appendChild(lightbox);

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.classList.contains('photo-lightbox__close')) {
        closeLightbox();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('photo-lightbox--open')) {
        closeLightbox();
      }
    });
    return lightbox;
  }
  function openLightbox(src) {
    const box = ensureLightbox();
    box.querySelector('.photo-lightbox__img').src = src;
    box.classList.add('photo-lightbox--open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('photo-lightbox--open');
    document.body.style.overflow = '';
  }

  // Допоміжні
  function showError(container, msg) {
    let err = container.parentElement.querySelector('.file-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'file-error';
      err.setAttribute('role', 'alert');
      container.parentElement.appendChild(err);
    }
    err.textContent = msg;
  }
  function clearError(container) {
    const err = container.parentElement.querySelector('.file-error');
    if (err) err.remove();
  }
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(2) + ' МБ';
  }

  function attachAll() {
    document.querySelectorAll('.photo-input:not([data-preview-attached])').forEach(attach);
  }

  document.addEventListener('DOMContentLoaded', attachAll);

  window.FitCastPhotoPreview = { attach: attach, attachAll: attachAll, openLightbox: openLightbox };
})();
