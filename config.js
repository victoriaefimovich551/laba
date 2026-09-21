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

// Токен личной сессии сотрудника (появляется после входа в кабинет).
//
// APP_TOKEN лежит в этом файле открытым текстом и виден любому, кто откроет
// исходный код страницы, — то есть защитой он не является. Настоящая
// проверка «кто ты» — вот этот токен сессии: он выдаётся сервером только
// после ввода email и пароля, живёт в localStorage конкретного устройства и
// в исходном коде сайта его нет.
//
// Подставляем его автоматически ко ВСЕМ запросам, а не по одному на каждом
// вызове: так ни один существующий или будущий запрос не окажется случайно
// без проверки. Запросы, которым сессия не нужна (вход, восстановление
// пароля), сервер разбирает до всякой проверки — лишний параметр им не мешает.
function currentSessionToken() {
    try {
        const raw = localStorage.getItem('cabinetSession');
        const s = raw ? JSON.parse(raw) : null;
        return (s && s.token) || '';
    } catch (e) {
        return '';
    }
}

// Строит URL для чтения (GET) с автоматически добавленным токеном.
// params — обычный объект { action: 'getAll', category: 'Дроны', ... }
function apiUrl(params) {
    const usp = new URLSearchParams(params || {});
    usp.set('token', APP_TOKEN);
    // Явно переданный sessionToken не трогаем — он уже в params.
    if (!usp.get('sessionToken')) {
        const st = currentSessionToken();
        if (st) usp.set('sessionToken', st);
    }
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

    const body = Object.assign({}, payload, { token: APP_TOKEN });
    if (!body.sessionToken) {
        const st = currentSessionToken();
        if (st) body.sessionToken = st;
    }

    return fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(body),
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
