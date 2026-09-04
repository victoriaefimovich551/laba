// auth-guard.js — доступ к сайту только после входа в личный кабинет.
// Без действующей сессии сразу уводим на экран входа (cabinet.html).
// Подключать в <head>, сразу после theme.js, синхронным <script> (не defer/async) —
// чтобы редирект случился до отрисовки страницы. На самом cabinet.html не подключать.
(function () {
    var session = null;
    try {
        var raw = localStorage.getItem('cabinetSession');
        if (raw) session = JSON.parse(raw);
    } catch (e) { session = null; }

    if (!session || !session.token || !session.employee) {
        location.replace('cabinet.html');
        return;
    }

    window.CABINET_SESSION = session;
})();
