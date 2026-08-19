// status.js — общий справочник статусов товара.
// Используется в index.html (бейджи, фильтры, сортировка каталога) и analytics.html (статусы на дашборде).
// Раньше один и тот же список статусов был захардкожен в нескольких switch() в index.html
// и ещё раз отдельным объектом в analytics.html — при добавлении нового статуса
// приходилось не забыть поправить оба файла. Теперь одно место.

const STATUS_ORDER = ['Не продан', 'В доставке', 'Зарезервирован', 'Продан'];
const DEFAULT_STATUS = 'Не продан';

// Иконка/цвет/подпись статуса — для бейджей каталога и карточки товара (index.html)
const STATUS_META = {
    'Не продан':      { icon: '🟢', color: '#16a34a', title: 'В наличии',      cssClass: 'status-unsold',   label: '📦 Не продан' },
    'В доставке':     { icon: '🚚', color: '#2563eb', title: 'В доставке',     cssClass: 'status-delivery', label: '🚚 В доставке' },
    'Зарезервирован': { icon: '🔐', color: '#d97706', title: 'Зарезервирован', cssClass: 'status-reserved', label: '🔒 Зарезервирован' },
    'Продан':         { icon: '💰', color: '#64748b', title: 'Продан',         cssClass: 'status-sold',     label: '✅ Продан' }
};

// Цвета статусов на дашборде аналитики (своя палитра под карточки status-grid)
const STATUS_ANALYTICS_COLORS = {
    'Не продан':      { color: '#b09000', bg: '#fffbe6' },
    'В доставке':     { color: '#2a5298', bg: '#e8f0ff' },
    'Зарезервирован': { color: '#c05a00', bg: '#fff0e6' },
    'Продан':         { color: '#666e7a', bg: '#f0f1f3' }
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
