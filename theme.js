// theme.js — общая логика тёмной/светлой темы для всех страниц.
// Подключается синхронно в самом начале <head> (до <style>), чтобы тема
// применилась ДО первой отрисовки — иначе будет вспышка светлой темы.
//
// Кнопки переключения темы помечаются атрибутами:
//   data-theme-icon         — кнопка-иконка (текст меняется на 🌙 / ☀️)
//   data-theme-label="Тема" — кнопка с подписью (текст меняется на "🌙 Тема" / "☀️ Тема")
//
// Страница может подписаться на смену темы (например, чтобы перекрасить график):
//   window.addEventListener('themechange', (e) => { e.detail.dark === true/false });

(function () {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.classList.add('preload-dark');
    }
})();

function applyDark() {
    document.body.classList.add('dark-mode');
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) { el.textContent = '☀️'; });
    document.querySelectorAll('[data-theme-label]').forEach(function (el) {
        el.textContent = '☀️ ' + el.getAttribute('data-theme-label');
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: { dark: true } }));
}

function applyLight() {
    document.body.classList.remove('dark-mode');
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) { el.textContent = '🌙'; });
    document.querySelectorAll('[data-theme-label]').forEach(function (el) {
        el.textContent = '🌙 ' + el.getAttribute('data-theme-label');
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: { dark: false } }));
}

function initTheme() {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        applyDark();
    } else if (saved === 'light') {
        applyLight();
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyDark();
    }
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (localStorage.getItem('theme')) return; // есть явный выбор — не оверрайдим
            e.matches ? applyDark() : applyLight();
        });
    }
    // Убираем preload-dark — теперь transitions работают
    requestAnimationFrame(function () {
        document.documentElement.classList.remove('preload-dark');
    });
}

function toggleTheme() {
    if (document.body.classList.contains('dark-mode')) {
        applyLight();
        localStorage.setItem('theme', 'light');
    } else {
        applyDark();
        localStorage.setItem('theme', 'dark');
    }
}
