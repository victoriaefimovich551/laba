// icons.js — общий набор line-иконок (по дизайн-макету) вместо эмодзи.
// Все — 24x24 viewBox, stroke=currentColor, наследуют цвет текста родителя.
const ICON_PATHS = {
    qr:       '<path d="M4 8.6V5.8A1.8 1.8 0 0 1 5.8 4h2.8M15.4 4h2.8A1.8 1.8 0 0 1 20 5.8v2.8M20 15.4v2.8a1.8 1.8 0 0 1-1.8 1.8h-2.8M8.6 20H5.8A1.8 1.8 0 0 1 4 18.2v-2.8"></path>',
    scan:     '<path d="M4 8.6V5.8A1.8 1.8 0 0 1 5.8 4h2.8M15.4 4h2.8A1.8 1.8 0 0 1 20 5.8v2.8M20 15.4v2.8a1.8 1.8 0 0 1-1.8 1.8h-2.8M8.6 20H5.8A1.8 1.8 0 0 1 4 18.2v-2.8"></path><path d="M4.6 12h14.8"></path>',
    home:     '<path d="M4 10.6 12 4.2l8 6.4V19a1.4 1.4 0 0 1-1.4 1.4h-3.4v-5.6H9.8v5.6H5.4A1.4 1.4 0 0 1 4 19z"></path>',
    search:   '<circle cx="11" cy="11" r="6.2"></circle><path d="m19.6 19.6-4.2-4.2"></path>',
    catalog:  '<rect x="4" y="5" width="16" height="5.6" rx="1.8"></rect><rect x="4" y="13.4" width="16" height="5.6" rx="1.8"></rect><path d="M7.4 7.8h.01M7.4 16.2h.01"></path>',
    add:      '<path d="M12 5.6v12.8M5.6 12h12.8"></path>',
    analytics:'<path d="M4 19h16"></path><path d="m6.5 14.5 3.8-4.4 3 2.8 4.4-5.6"></path>',
    drone:    '<path d="M9.4 9.4h5.2v5.2H9.4zM9.4 9.4 6.4 6.8M14.6 9.4 17.6 6.8M9.4 14.6 6.4 17.2M14.6 14.6 17.6 17.2M4 6.8h4.8M15.2 6.8H20M4 17.2h4.8M15.2 17.2H20"></path>',
    scooter:  '<path d="M6.2 15.2a2.4 2.4 0 1 0 .01 4.8 2.4 2.4 0 1 0-.01-4.8M17.8 15.2a2.4 2.4 0 1 0 .01 4.8 2.4 2.4 0 1 0-.01-4.8M8.6 17.6h5.2l2.9-11M14.6 6.6h4"></path>',
    sticker:  '<rect x="5" y="8.4" width="14" height="7.6" rx="1.8"></rect><path d="M7.4 8.4V6a1.6 1.6 0 0 1 1.6-1.6h6a1.6 1.6 0 0 1 1.6 1.6v2.4"></path><rect x="8.2" y="12.8" width="7.6" height="5.8" rx="1"></rect>',
    share:    '<circle cx="18" cy="5.5" r="2.4"></circle><circle cx="6" cy="12" r="2.4"></circle><circle cx="18" cy="18.5" r="2.4"></circle><path d="M8.1 10.6 15.9 6.7M8.1 13.4l7.8 3.9"></path>',
    trash:    '<path d="M4.5 7h15M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7M6.7 7l.8 12.1A1.8 1.8 0 0 0 9.3 21h5.4a1.8 1.8 0 0 0 1.8-1.7L17.3 7"></path>',
    package:  '<rect x="3.6" y="7.4" width="16.8" height="11" rx="2.2"></rect><path d="M8.4 7.4V5.8a1.6 1.6 0 0 1 1.6-1.6h4a1.6 1.6 0 0 1 1.6 1.6v1.6"></path>',
    lock:     '<rect x="5" y="10.4" width="14" height="9.6" rx="2.4"></rect><path d="M8 10.4V7.6a4 4 0 0 1 8 0v2.8"></path>',
    person:   '<circle cx="12" cy="8.4" r="3.4"></circle><path d="M5 19.4c1-3.4 3.8-5.2 7-5.2s6 1.8 7 5.2"></path>',
    camera:   '<rect x="3.6" y="7.4" width="16.8" height="11" rx="2.2"></rect><path d="M8.4 7.4V5.8a1.6 1.6 0 0 1 1.6-1.6h4a1.6 1.6 0 0 1 1.6 1.6v1.6"></path><circle cx="12" cy="13" r="2.8"></circle>',
    close:    '<path d="M6 6l12 12M18 6L6 18"></path>',
    table:    '<rect x="4" y="4" width="16" height="16" rx="2.4"></rect><path d="M4 10h16M4 15h16M10 4v16"></path>',
    document: '<path d="M7 3.6h7.4L18 7.2V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1z"></path><path d="M14 3.6V7.2h4"></path><path d="M9 12.4h6M9 15.8h6"></path>',
    forbidden: '<circle cx="12" cy="12" r="8.2"></circle><path d="m6.6 6.6 10.8 10.8"></path>',
    arrowLeft: '<path d="M19 12H6M11 6.6 5.6 12 11 17.4"></path>',
    dot:      '<circle cx="12" cy="12" r="6.4" fill="currentColor" stroke="none"></circle>',
    truck:    '<path d="M3 16V6.8a1 1 0 0 1 1-1h9.4a1 1 0 0 1 1 1V16"></path><path d="M14.4 10.4h3.1l3 3.1V16h-2.1"></path><path d="M3 16h1.3M10.6 16h2.6"></path><circle cx="7" cy="17.6" r="1.8"></circle><circle cx="16.6" cy="17.6" r="1.8"></circle>',
    checkCircle: '<circle cx="12" cy="12" r="8.2"></circle><path d="m8.2 12.3 2.6 2.6 5-5.4"></path>',
    tasks:    '<path d="M10 6.6h10M10 12h10M10 17.4h10"></path><path d="m3.4 6.4 1.3 1.3 2.3-2.5M3.4 11.8l1.3 1.3 2.3-2.5M3.4 17.2l1.3 1.3 2.3-2.5"></path>',
    check:    '<path d="m5.5 12.5 4 4 9-9"></path>'
};

function svgIcon(name, size, extraAttrs) {
    const d = ICON_PATHS[name] || '';
    const sz = size || 18;
    const extra = extraAttrs || '';
    return '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' + extra + '>' + d + '</svg>';
}

// Инициалы сотрудника для лаймового кружка личного кабинета (вместо 👤).
function accountInitials(name) {
    if (!name) return 'ЛК';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'ЛК';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}
