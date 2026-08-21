// status.js — общий справочник статусов товара.
// Используется в index.html (бейджи, фильтры, сортировка каталога) и analytics.html (статусы на дашборде).
// Раньше один и тот же список статусов был захардкожен в нескольких switch() в index.html
// и ещё раз отдельным объектом в analytics.html — при добавлении нового статуса
// приходилось не забыть поправить оба файла. Теперь одно место.

const STATUS_ORDER = ['Не продан', 'В доставке', 'Зарезервирован', 'Продан'];
const DEFAULT_STATUS = 'Не продан';

// Иконка/цвет/подпись статуса — для бейджей каталога и карточки товара (index.html).
// Цвета — CSS-переменные из common.css (--st-*), поэтому сами подстраиваются
// под тёмную/светлую тему без дополнительной логики в JS.
const STATUS_META = {
    'Не продан':      { icon: '🟢', color: 'var(--st-ok)',   title: 'В наличии',      cssClass: 'status-unsold',   label: 'Не продан' },
    'В доставке':     { icon: '🚚', color: 'var(--st-info)', title: 'В доставке',     cssClass: 'status-delivery', label: 'В доставке' },
    'Зарезервирован': { icon: '🔐', color: 'var(--st-warn)', title: 'Резерв', cssClass: 'status-reserved', label: 'Резерв' },
    'Продан':         { icon: '💰', color: 'var(--st-off)',  title: 'Продан',         cssClass: 'status-sold',     label: 'Продан' }
};

// Цвета статусов на дашборде аналитики (текст + фон бейджа = цвет статуса с прозрачностью).
// Отдельная палитра от --st-* (которые используют "светофорные" зелёный/синий/
// жёлтый/серый для бейджей каталога) — здесь цвета подобраны под лаймово-тёмный
// дизайн: акцентный лайм для "в наличии", приглушённые дополняющие тона для
// остального, вместо генеральной палитры типового саас-дашборда.
const STATUS_ANALYTICS_COLORS = {
    'Не продан':      { color: 'var(--lime)',       bg: 'color-mix(in srgb, var(--lime) 20%, transparent)' },
    'В доставке':     { color: 'var(--an-transit)',  bg: 'color-mix(in srgb, var(--an-transit) 18%, transparent)' },
    'Зарезервирован': { color: 'var(--an-reserved)', bg: 'color-mix(in srgb, var(--an-reserved) 18%, transparent)' },
    'Продан':         { color: 'var(--tx2)',         bg: 'color-mix(in srgb, var(--tx2) 16%, transparent)' }
};

function getStatusIcon(status) {
    const m = STATUS_META[status] || STATUS_META[DEFAULT_STATUS];
    return { icon: m.icon, color: m.color, title: m.title };
}

function getStatusClass(status) {
    const m = STATUS_META[status] || STATUS_META[DEFAULT_STATUS];
    return m.cssClass;
}

function getStatusText(status) {
    const m = STATUS_META[status] || STATUS_META[DEFAULT_STATUS];
    return m.label;
}

// Иконка + подпись вместе — для пилюль-бейджей (карточка товара, «Последние сканы»)
function getStatusBadge(status) {
    const m = STATUS_META[status] || STATUS_META[DEFAULT_STATUS];
    return m.icon + ' ' + m.label;
}

// Убирает из названия модели пометки о состоянии/статусе в скобках (под
// восстановление, нуждается в проверке...), чтобы одна и та же модель
// группировалась в статистике каталога и в топе моделей аналитики независимо
// от такой пометки: "Dualtron Thunder 1 (под восстановление)" и
// "Dualtron Thunder 1" — одна и та же модель.
function getModelGroupKey(name) {
    let key = (name || '').trim().replace(/\s+/g, ' ');
    key = key.replace(/\s*\([^)]*(?:восстановлен|провер)[^)]*\)\s*/gi, ' ');
    return key.trim().replace(/\s+/g, ' ') || (name || '').trim();
}

// Порядок сортировки каталога: в наличии → в доставке → резерв → продан
function sortByStatus(products) {
    const order = {};
    STATUS_ORDER.forEach((s, i) => { order[s] = i; });
    return products.slice().sort((a, b) => {
        const oa = order[a['Статус']] !== undefined ? order[a['Статус']] : 1;
        const ob = order[b['Статус']] !== undefined ? order[b['Статус']] : 1;
        return oa - ob;
    });
}
