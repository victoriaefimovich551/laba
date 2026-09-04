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
const GOOGLE_SCRIPT_URL = 'https://api.mylaba.com';
const APP_TOKEN = 'kUsqq5tD9pQ5j-wUtlKOlyQiT4snxeKA0kUC8cSQO-c';

// Строит URL для чтения (GET) с автоматически добавленным токеном.
// params — обычный объект { action: 'getAll', category: 'Дроны', ... }
function apiUrl(params) {
    const usp = new URLSearchParams(params || {});
    usp.set('token', APP_TOKEN);
    return GOOGLE_SCRIPT_URL + '?' + usp.toString();
}

// Выполняет GET-запрос через apiUrl(params) с тем же жёстким таймаутом,
// что и apiPost — без этого «уснувший» бэкенд или зависшая мобильная сеть
// оставляют fetch() висеть бесконечно, а вместе с ним и нативный индикатор
// загрузки страницы в браузере (постоянная «плашка обновления»).
function apiGet(params) {
    const controller = new AbortController();
    const abortTimer = setTimeout(function () { controller.abort(); }, 90000);
    const wakeupTimer = setTimeout(function () {
        if (typeof showToast === 'function') {
            showToast('⏳ Сервер просыпается после простоя, это может занять до минуты...', 'info', 8000);
        }
    }, 4000);

    return fetch(apiUrl(params), { signal: controller.signal }).then(function (r) {
        clearTimeout(wakeupTimer);
        clearTimeout(abortTimer);
        return r.json();
    }).catch(function (err) {
        clearTimeout(wakeupTimer);
        clearTimeout(abortTimer);
        if (err.name === 'AbortError') {
            throw new Error('Сервер не отвечает больше 90 секунд. Попробуйте ещё раз через минуту.');
        }
        throw err;
    });
}

// Отправляет данные через POST (без Content-Type: application/json —
// иначе браузер шлёт CORS-preflight, который Apps Script не обрабатывает).
// Возвращает Promise с распарсенным JSON-ответом.
//
// Бесплатный сервер на Render "засыпает" после простоя — первый запрос
// может занять до минуты, пока он проснётся. Чтобы это не выглядело как
// зависание, показываем предупреждение, если ответа нет дольше 4 секунд,
// и жёстко обрываем запрос через 90 секунд с понятной ошибкой вместо
// бесконечного ожидания.
function apiPost(payload) {
    const controller = new AbortController();
    const abortTimer = setTimeout(function () { controller.abort(); }, 90000);
    const wakeupTimer = setTimeout(function () {
        if (typeof showToast === 'function') {
            showToast('⏳ Сервер просыпается после простоя, это может занять до минуты...', 'info', 8000);
        }
    }, 4000);

    return fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(Object.assign({}, payload, { token: APP_TOKEN })),
        signal: controller.signal
    }).then(function (r) {
        clearTimeout(wakeupTimer);
        clearTimeout(abortTimer);
        return r.json();
    }).catch(function (err) {
        clearTimeout(wakeupTimer);
        clearTimeout(abortTimer);
        if (err.name === 'AbortError') {
            throw new Error('Сервер не отвечает больше 90 секунд. Попробуйте ещё раз через минуту.');
        }
        throw err;
    });
}
