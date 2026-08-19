// print-label.js — печать этикеток 40×30мм (QR-код + название + артикул)
// напрямую из карточки товара или списком из каталога.
//
// QR-код рисуется локально (qrcode.js), без обращения к внешнему сервису —
// работает офлайн и не зависит от api.qrserver.com.
//
// Передача на принтер: пытаемся отдать готовую картинку в системное меню
// "Поделиться" (Web Share API) — оттуда её можно отправить в приложение
// принтера (например 4barcode), которое печатает на связанный по
// Bluetooth/USB принтер. Если "Поделиться" с файлами недоступно (обычно
// на десктопе) — открываем диалог печати браузера с размером страницы
// 40×30мм, как раньше делал отдельный генератор наклеек.

const LABEL_WIDTH_MM  = 40;
const LABEL_HEIGHT_MM = 30;
const LABEL_PX_PER_MM = 12; // ~300 dpi

function wrapTextToLines(ctx, text, maxWidth, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(function (word) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    });
    if (line) lines.push(line);
    if (lines.length > maxLines) {
        lines.length = maxLines;
        lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '…');
    }
    return lines;
}

function buildLabelCanvas(product) {
    const w = LABEL_WIDTH_MM * LABEL_PX_PER_MM;
    const h = LABEL_HEIGHT_MM * LABEL_PX_PER_MM;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000';

    const sku = product['Артикул'] || '';
    const name = product['Название'] || '';

    // QR-код слева — фиксированный размер (не во всю высоту), чтобы оставить
    // достаточно места под текст справа даже для длинных артикулов
    const qr = qrcode(0, 'M');
    qr.addData(sku);
    qr.make();
    const moduleCount = qr.getModuleCount();
    const qrSize = Math.min(h - 16, 22 * LABEL_PX_PER_MM);
    const cell = qrSize / moduleCount;
    const qrX = 8;
    const qrY = (h - qrSize) / 2;
    for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
            if (qr.isDark(r, c)) {
                ctx.fillRect(qrX + c * cell, qrY + r * cell, Math.ceil(cell), Math.ceil(cell));
            }
        }
    }

    // Текст справа: название (до 3 строк, шрифт ужимается, если не влезает) + артикул снизу
    const textX = qrX + qrSize + 14;
    const textWidth = w - textX - 8;

    let fontSize = 26;
    let lines = [];
    do {
        ctx.font = 'bold ' + fontSize + 'px Arial, sans-serif';
        lines = wrapTextToLines(ctx, name, textWidth, 3);
        fontSize -= 2;
    } while (lines.length > 3 && fontSize > 12);

    ctx.font = 'bold ' + (fontSize + 2) + 'px Arial, sans-serif';
    ctx.textBaseline = 'top';
    let y = 10;
    lines.forEach(function (line) {
        ctx.fillText(line, textX, y);
        y += fontSize + 6;
    });

    // Артикул — тоже ужимается по ширине, чтобы никогда не обрезался
    let skuFontSize = 30;
    ctx.font = 'bold ' + skuFontSize + 'px monospace';
    while (ctx.measureText(sku).width > textWidth && skuFontSize > 14) {
        skuFontSize -= 2;
        ctx.font = 'bold ' + skuFontSize + 'px monospace';
    }
    ctx.fillText(sku, textX, h - skuFontSize - 10);

    return canvas;
}

function canvasToBlob(canvas) {
    return new Promise(function (resolve) {
        canvas.toBlob(resolve, 'image/png');
    });
}

// Печать одной или нескольких этикеток. products — массив объектов товара
// (нужны только поля 'Артикул' и 'Название').
async function printLabels(products) {
    if (!products || !products.length) return;
    const canvases = products.map(buildLabelCanvas);

    if (navigator.share && navigator.canShare) {
        try {
            const blobs = await Promise.all(canvases.map(canvasToBlob));
            const files = blobs.map(function (blob, i) {
                const sku = (products[i]['Артикул'] || 'label').replace(/[^\w-]+/g, '_');
                return new File([blob], sku + '.png', { type: 'image/png' });
            });
            if (navigator.canShare({ files: files })) {
                await navigator.share({ files: files, title: 'Этикетки' });
                return;
            }
        } catch (e) {
            if (e && e.name === 'AbortError') return; // пользователь закрыл окно "Поделиться"
            console.log('Поделиться не удалось, печатаем через браузер:', e);
        }
    }

    printLabelsViaBrowser(canvases);
}

function printLabelsViaBrowser(canvases) {
    const win = window.open('', '_blank');
    if (!win) {
        if (typeof showToast === 'function') {
            showToast('Разрешите всплывающие окна для печати наклеек', 'error', 5000);
        }
        return;
    }
    const images = canvases.map(function (c) {
        return '<img src="' + c.toDataURL('image/png') + '">';
    }).join('');
    win.document.write(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Печать наклеек</title><style>' +
        '@page { size: ' + LABEL_WIDTH_MM + 'mm ' + LABEL_HEIGHT_MM + 'mm; margin: 0; }' +
        'body { margin: 0; }' +
        'img { display: block; width: ' + LABEL_WIDTH_MM + 'mm; height: ' + LABEL_HEIGHT_MM + 'mm; page-break-after: always; }' +
        '</style></head><body>' + images + '</body></html>'
    );
    win.document.close();
    win.print();
}
