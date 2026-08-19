// toast.js — единая функция показа toast-уведомлений (вместо alert()).
// Используется в index.html. Стили — в common.css.

function showToast(message, type, duration) {
    type = type || 'success';
    duration = duration || 3000;
    var t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = message;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
        t.classList.remove('show');
        setTimeout(function () { t.remove(); }, 300);
    }, duration);
}
