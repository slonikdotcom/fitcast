/* ============================================================
   FitCast — спільна логіка прев'ю фото
   Викликає FitCastPhotoPreview.attach(inputElement) для будь-якого
   <input type="file"> — додає прев'ю, валідацію, кнопку "прибрати".
   ============================================================ */

(function () {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ

  function attach(input) {
    if (!input || input.dataset.previewAttached === '1') return;
    input.dataset.previewAttached = '1';

    const wrapper = input.parentElement;
    const preview = document.createElement('div');
    preview.className = 'photo-preview';
    preview.hidden = true;
    preview.innerHTML =
      '<img class="photo-preview__img" alt="Прев\'ю фото" />' +
      '<div class="photo-preview__info">' +
        '<div class="photo-preview__name"></div>' +
        '<div class="photo-preview__size"></div>' +
      '</div>' +
      '<button type="button" class="photo-preview__remove" title="Прибрати фото" aria-label="Прибрати фото">✕</button>';
    wrapper.appendChild(preview);

    const imgEl     = preview.querySelector('.photo-preview__img');
    const nameEl    = preview.querySelector('.photo-preview__name');
    const sizeEl    = preview.querySelector('.photo-preview__size');
    const removeBtn = preview.querySelector('.photo-preview__remove');

    /* Подія: вибір файлу */
    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) {
        preview.hidden = true;
        return;
      }
      // Валідація типу
      if (!file.type.startsWith('image/')) {
        showError(wrapper, 'Можна завантажувати тільки зображення (JPG, PNG, WebP)');
        resetInput();
        return;
      }
      // Валідація розміру
      if (file.size > MAX_FILE_SIZE) {
        showError(wrapper, 'Файл занадто великий (макс ' + formatSize(MAX_FILE_SIZE) + ')');
        resetInput();
        return;
      }
      clearError(wrapper);

      const reader = new FileReader();
      reader.onload = function (e) {
        imgEl.src = e.target.result;
        nameEl.textContent = file.name;
        sizeEl.textContent = formatSize(file.size);
        preview.hidden = false;
        // Диспатчимо подію, щоб інший код міг реагувати
        input.dispatchEvent(new CustomEvent('photo:loaded', {
          detail: { file: file, dataUrl: e.target.result }
        }));
      };
      reader.onerror = function () {
        showError(wrapper, 'Не вдалося прочитати файл');
      };
      reader.readAsDataURL(file);
    });

    /* Подія: прибрати фото */
    removeBtn.addEventListener('click', function () {
      resetInput();
      input.dispatchEvent(new CustomEvent('photo:removed'));
    });

    function resetInput() {
      input.value = '';
      preview.hidden = true;
      imgEl.src = '';
    }
  }

  /* --- Хелпери --- */
  function showError(wrapper, msg) {
    let err = wrapper.querySelector('.file-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'file-error';
      err.setAttribute('role', 'alert');
      wrapper.appendChild(err);
    }
    err.textContent = msg;
  }

  function clearError(wrapper) {
    const err = wrapper.querySelector('.file-error');
    if (err) err.remove();
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(2) + ' МБ';
  }

  /* Автоматичне підключення до всіх input[type=file] на сторінці
     ОКРІМ тих, що мають data-no-preview="1" (обробляються власним кодом). */
  function attachAll() {
    document.querySelectorAll('input[type="file"][accept*="image"]:not([data-no-preview])').forEach(attach);
  }

  document.addEventListener('DOMContentLoaded', attachAll);

  window.FitCastPhotoPreview = { attach: attach, attachAll: attachAll };
})();
