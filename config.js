// config.js — единая точка настройки подключения к Google Apps Script.
// Подключается в index.html и analytics.html.
//
// APP_TOKEN должен СЛОВО В СЛОВО совпадать с APP_TOKEN в самом Apps Script
// (переменная APP_TOKEN в начале Code.gs) — это простая защита от случайных
// обращений к бэкенду в обход интерфейса сайта, а не полноценная
// аутентификация: тот, кто станет специально искать токен в исходном коде
// этой страницы, его увидит. Не используйте для по-настоящему секретных
// данных и не публикуйте этот файл с реальным токеном в открытом виде,
// если это для вас критично.
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwMI8Q18FlMSUfDFhgmuH6st-3NFn6Dpx8aUDu6SICf6QraBxlLNRs3UU15c-sJ0D-zdg/exec';
const APP_TOKEN = 'kUsqq5tD9pQ5j-wUtlKOlyQiT4snxeKA0kUC8cSQO-c';

// Строит URL для чтения (GET) с автоматически добавленным токеном.
// params — обычный объект { action: 'getAll', category: 'Дроны', ... }
function apiUrl(params) {
    const usp = new URLSearchParams(params || {});
    usp.set('token', APP_TOKEN);
    return GOOGLE_SCRIPT_URL + '?' + usp.toString();
}

// Отправляет данные через POST (без Content-Type: application/json —
// иначе браузер шлёт CORS-preflight, который Apps Script не обрабатывает).
// Возвращает Promise с распарсенным JSON-ответом.
function apiPost(payload) {
    return fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(Object.assign({}, payload, { token: APP_TOKEN }))
    }).then(function (r) { return r.json(); });
}
