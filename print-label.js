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
const LABEL_PX_PER_MM = 16; // выше разрешение холста — резче текст после печати/пересжатия

// Подбирает наибольший размер шрифта, при котором строка укладывается в maxWidth;
// если не влезает даже на минимальном размере — обрезает с многоточием.
function fitSingleLine(ctx, text, fontSpec, maxWidth, maxSize, minSize) {
    let size = maxSize;
    let display = String(text || '');
    for (; size > minSize; size -= 1) {
        ctx.font = fontSpec(size);
        if (ctx.measureText(display).width <= maxWidth) break;
    }
    ctx.font = fontSpec(size);
    while (display.length > 1 && ctx.measureText(display).width > maxWidth) {
        display = display.slice(0, -1);
    }
    if (display !== String(text || '')) display = display.replace(/.$/, '…');
    return { size: size, text: display };
}

// Рисует текст повёрнутым на 90° (читается снизу вверх), по центру колонки
// с центром в colCenterX, и по вертикали — по центру канвы высотой canvasH.
function drawVerticalText(ctx, text, colCenterX, canvasH, availableHeight, fontSpec, maxSize, minSize) {
    const fit = fitSingleLine(ctx, text, fontSpec, availableHeight, maxSize, minSize);
    ctx.font = fontSpec(fit.size);
    const textWidth = ctx.measureText(fit.text).width;
    ctx.save();
    ctx.translate(colCenterX, canvasH / 2 + textWidth / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(fit.text, 0, 0);
    ctx.restore();
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

    // QR-код слева, почти во всю высоту этикетки
    const qr = qrcode(0, 'M');
    qr.addData(sku);
    qr.make();
    const moduleCount = qr.getModuleCount();
    const margin = 14;
    const qrSize = h - margin * 2;
    const cell = qrSize / moduleCount;
    const qrX = margin;
    const qrY = margin;
    for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
            if (qr.isDark(r, c)) {
                ctx.fillRect(qrX + c * cell, qrY + r * cell, Math.ceil(cell), Math.ceil(cell));
            }
        }
    }

    // Справа — два повёрнутых столбца текста (снизу вверх): артикул, затем название.
    // Текст идёт вдоль высоты этикетки, поэтому даже длинное название помещается
    // одной крупной строкой без переноса и без мелкого шрифта.
    const textAreaX = qrX + qrSize + 16;
    const textAreaWidth = w - textAreaX - 10;
    const colWidth = textAreaWidth / 2;
    const availableHeight = h - margin * 2;

    drawVerticalText(ctx, sku, textAreaX + colWidth * 0.5, h, availableHeight,
        function (s) { return 'bold ' + s + 'px monospace'; }, 40, 16);
    drawVerticalText(ctx, name, textAreaX + colWidth * 1.5, h, availableHeight,
        function (s) { return 'bold ' + s + 'px Arial, sans-serif'; }, 36, 14);

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
