// theme.js — общая логика тёмной/светлой темы для всех страниц.
// Тёмная тема — база по умолчанию (без класса на body), светлая включается
// классом body.light-mode. Подключается синхронно в самом начале <head>
// (до <style>), чтобы тема применилась ДО первой отрисовки — иначе будет
// вспышка тёмной темы для тех, кто выбрал светлую.
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
    var wantsLight = saved === 'light' || (!saved && window.matchMedia && !prefersDark);
    if (wantsLight) {
        document.documentElement.classList.add('preload-light');
    }
})();

// Safari/iOS: backdrop-filter не пересчитывает фон позади себя при мгновенной
// смене цветов (без скролла/ресайза), из-за чего стеклянные карточки после
// переключения темы какое-то время показывают блюр СТАРОГО фона. Снимаем
// backdrop-filter на пару кадров — это заставляет браузер перерисовать
// элементы плоским фоном — и возвращаем обратно, уже с актуальным блюром.
function forceGlassRepaint() {
    var html = document.documentElement;
    html.classList.add('theme-repaint');
    void document.body.offsetHeight; // форсируем reflow, чтобы кадр без блюра реально отрисовался
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            html.classList.remove('theme-repaint');
        });
    });
}

function applyDark() {
    document.body.classList.remove('light-mode');
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) { el.textContent = '☀️'; });
    document.querySelectorAll('[data-theme-label]').forEach(function (el) {
        el.textContent = '☀️ ' + el.getAttribute('data-theme-label');
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: { dark: true } }));
}

function applyLight() {
    document.body.classList.add('light-mode');
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) { el.textContent = '🌙'; });
    document.querySelectorAll('[data-theme-label]').forEach(function (el) {
        el.textContent = '🌙 ' + el.getAttribute('data-theme-label');
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: { dark: false } }));
}

function initTheme() {
    var saved = localStorage.getItem('theme');
    if (saved === 'light') {
        applyLight();
    } else if (saved === 'dark') {
        applyDark();
    } else if (window.matchMedia && !window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyLight();
    } else {
        applyDark(); // по умолчанию — тёмная (в т.ч. когда система предпочитает тёмную)
    }
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (localStorage.getItem('theme')) return; // есть явный выбор — не оверрайдим
            e.matches ? applyDark() : applyLight();
            forceGlassRepaint();
        });
    }
    // Убираем preload-light — теперь transitions работают
    requestAnimationFrame(function () {
        document.documentElement.classList.remove('preload-light');
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
    forceGlassRepaint();
}
