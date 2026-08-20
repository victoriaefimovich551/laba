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
    'Зарезервирован': { icon: '🔐', color: 'var(--st-warn)', title: 'Зарезервирован', cssClass: 'status-reserved', label: 'Резерв' },
    'Продан':         { icon: '💰', color: 'var(--st-off)',  title: 'Продан',         cssClass: 'status-sold',     label: 'Продан' }
};

// Цвета статусов на дашборде аналитики (текст + фон бейджа = цвет статуса с прозрачностью)
const STATUS_ANALYTICS_COLORS = {
    'Не продан':      { color: 'var(--st-ok)',   bg: 'color-mix(in srgb, var(--st-ok) 16%, transparent)' },
    'В доставке':     { color: 'var(--st-info)', bg: 'color-mix(in srgb, var(--st-info) 16%, transparent)' },
    'Зарезервирован': { color: 'var(--st-warn)', bg: 'color-mix(in srgb, var(--st-warn) 16%, transparent)' },
    'Продан':         { color: 'var(--st-off)',  bg: 'color-mix(in srgb, var(--st-off) 16%, transparent)' }
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
