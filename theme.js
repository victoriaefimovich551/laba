// theme.js — тема: тёмная по умолчанию, светлая по выбору пользователя
(function () {
    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.classList.add('preload-light');
    }
})();

function applyLight() {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) { el.textContent = '🌙'; });
    document.querySelectorAll('[data-theme-label]').forEach(function (el) {
        el.textContent = '🌙 ' + el.getAttribute('data-theme-label');
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: { dark: false } }));
}

function applyDark() {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) { el.textContent = '☀️'; });
    document.querySelectorAll('[data-theme-label]').forEach(function (el) {
        el.textContent = '☀️ ' + el.getAttribute('data-theme-label');
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: { dark: true } }));
}

function initTheme() {
    if (localStorage.getItem('theme') === 'light') applyLight();
    else applyDark();
    requestAnimationFrame(function () {
        document.documentElement.classList.remove('preload-light', 'preload-dark');
    });
}

function toggleTheme() {
    if (document.body.classList.contains('light-mode')) {
        applyDark();
        localStorage.setItem('theme', 'dark');
    } else {
        applyLight();
        localStorage.setItem('theme', 'light');
    }
}
