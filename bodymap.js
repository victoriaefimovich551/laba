// bodymap.js — схема кузова в карточке автомобиля.
//
// Показывает машину выбранного типа кузова (седан, хэтчбек, кроссовер,
// минивэн) двумя способами: объёмной моделью, которую можно крутить
// пальцем, и схемой сверху. По нажатию на деталь выбирается её состояние:
// оригинал, крашена, бита, заменена.
//
// Подключается только на странице каталога и работает лишь для категории
// «Машины» — у дронов и самокатов кузова нет.
//
// Модель строится кодом из линии профиля: готовый файл модели подгружать
// неоткуда, а так она весит ноль и правится числами. Библиотека three.js
// подтягивается лениво — только когда реально открыли карточку машины,
// чтобы не тормозить запуск приложения ради категории, в которой пока
// несколько товаров. Если библиотека не загрузилась (плохая связь на
// складе), остаётся вкладка «Схема сверху»: она ничего не требует.

var LabaBody = (function () {
    'use strict';

    var STATES = [
        { id: 'ok',    name: 'Оригинал',  css: '--bm-ok',    short: '' },
        { id: 'paint', name: 'Крашена',   css: '--bm-paint', short: 'крашен' },
        { id: 'hit',   name: 'Бита',      css: '--bm-hit',   short: 'бит' },
        { id: 'swap',  name: 'Заменена',  css: '--bm-swap',  short: 'заменён' }
    ];

    // Род детали нужен, чтобы строка для объявления читалась по-русски:
    // «капот крашен», но «дверь крашена», «крыло крашено».
    var PARTS = {
        bumper_f:  { name: 'Передний бампер',        g: 'm' },
        fender_fl: { name: 'Переднее левое крыло',   g: 'n' },
        hood:      { name: 'Капот',                  g: 'm' },
        fender_fr: { name: 'Переднее правое крыло',  g: 'n' },
        glass_f:   { name: 'Лобовое стекло',         g: 'n' },
        door_fl:   { name: 'Передняя левая дверь',   g: 'f' },
        roof:      { name: 'Крыша',                  g: 'f' },
        door_fr:   { name: 'Передняя правая дверь',  g: 'f' },
        door_rl:   { name: 'Задняя левая дверь',     g: 'f' },
        door_rr:   { name: 'Задняя правая дверь',    g: 'f' },
        glass_r:   { name: 'Заднее стекло',          g: 'n' },
        fender_rl: { name: 'Заднее левое крыло',     g: 'n' },
        trunk:     { name: 'Крышка багажника',       g: 'f' },
        fender_rr: { name: 'Заднее правое крыло',    g: 'n' },
        bumper_r:  { name: 'Задний бампер',          g: 'm' }
    };
    var PART_ORDER = Object.keys(PARTS);

    // ── Типы кузова ────────────────────────────────────────────────────
    // Каждый кузов — это линия профиля (вид сбоку), линия подоконника и
    // несколько опорных чисел: где колёса, где кончается капот, где
    // начинается багажник. Машина строится из них целиком, поэтому новый
    // тип — это новый набор чисел, а не новая модель откуда-то извне.
    var BODIES = {
        sedan: {
            name: 'Седан', width: 1.74, sill: 0.40, wheel: 0.38,
            archF: -1.52, archR: 1.58, archR2: 0.50,
            tailName: 'Крышка багажника',
            profile: [
                [-2.26,0.52],[-2.33,0.72],[-2.30,0.92],[-2.16,1.00],[-1.90,1.06],[-1.50,1.11],
                [-1.12,1.17],[-0.88,1.21],[-0.52,1.46],[-0.22,1.60],[0.20,1.655],[0.62,1.655],
                [0.96,1.60],[1.26,1.42],[1.52,1.26],[1.84,1.20],[2.12,1.16],[2.28,1.04],
                [2.33,0.82],[2.26,0.54],[2.10,0.40],[1.40,0.345],[0.20,0.33],[-1.00,0.345],
                [-1.80,0.38],[-2.14,0.42]
            ],
            top: [
                [-2.30,0.92],[-2.16,1.00],[-1.90,1.06],[-1.50,1.11],[-1.12,1.17],[-0.88,1.21],
                [-0.52,1.46],[-0.22,1.60],[0.20,1.655],[0.62,1.655],[0.96,1.60],[1.26,1.42],
                [1.52,1.26],[1.84,1.20],[2.12,1.16],[2.28,1.04]
            ],
            belt: [[-2.14,1.00],[-1.60,1.09],[-1.00,1.17],[-0.40,1.27],[0.40,1.31],[1.10,1.33],[1.70,1.22],[2.12,1.14]],
            zones: { hood:[-2.22,-0.90], glass_f:[-0.90,-0.24], roof:[-0.24,0.98], glass_r:[0.98,1.54], tail:[1.54,2.26] },
            splits: { fenderF:-1.00, doors:-0.02, doorR:0.92, fenderR:0.94, front:-2.14, rear:2.12 },
            bumper: { f:[-2.22,0.74,0.52], r:[2.22,0.74,0.52] },
            lamps: { f:[-2.26,0.96], r:[2.26,1.02] }
        },

        hatch: {
            name: 'Хэтчбек', width: 1.70, sill: 0.40, wheel: 0.34,
            archF: -1.30, archR: 1.26, archR2: 0.46,
            tailName: 'Дверь багажника',
            profile: [
                [-1.96,0.52],[-2.03,0.72],[-2.00,0.92],[-1.86,1.00],[-1.60,1.06],[-1.26,1.12],
                [-0.94,1.18],[-0.74,1.22],[-0.42,1.48],[-0.14,1.64],[0.26,1.70],[0.72,1.70],
                [1.08,1.66],[1.40,1.52],[1.60,1.30],[1.72,1.08],[1.78,0.86],[1.80,0.66],
                [1.74,0.48],[1.60,0.40],[1.00,0.345],[0.0,0.33],[-1.00,0.345],[-1.60,0.38],[-1.86,0.42]
            ],
            top: [
                [-2.00,0.92],[-1.86,1.00],[-1.60,1.06],[-1.26,1.12],[-0.94,1.18],[-0.74,1.22],
                [-0.42,1.48],[-0.14,1.64],[0.26,1.70],[0.72,1.70],[1.08,1.66],[1.40,1.52],
                [1.60,1.30],[1.72,1.08],[1.78,0.86]
            ],
            belt: [[-1.86,1.00],[-1.30,1.10],[-0.80,1.20],[-0.20,1.32],[0.50,1.36],[1.00,1.36],[1.40,1.26],[1.66,1.10]],
            zones: { hood:[-1.92,-0.76], glass_f:[-0.76,-0.16], roof:[-0.16,1.06], glass_r:[1.06,1.46], tail:[1.46,1.80] },
            splits: { fenderF:-0.80, doors:0.10, doorR:1.00, fenderR:1.02, front:-1.86, rear:1.66 },
            bumper: { f:[-1.92,0.72,0.50], r:[1.74,0.70,0.48] },
            lamps: { f:[-1.96,0.94], r:[1.76,1.00] }
        },

        crossover: {
            name: 'Кроссовер', width: 1.84, sill: 0.48, wheel: 0.42,
            archF: -1.46, archR: 1.44, archR2: 0.56,
            tailName: 'Дверь багажника',
            profile: [
                [-2.20,0.62],[-2.28,0.84],[-2.24,1.06],[-2.08,1.16],[-1.80,1.22],[-1.40,1.28],
                [-1.04,1.34],[-0.82,1.38],[-0.48,1.62],[-0.18,1.76],[0.24,1.82],[0.80,1.82],
                [1.20,1.78],[1.56,1.64],[1.80,1.44],[1.96,1.22],[2.06,1.00],[2.10,0.80],
                [2.04,0.58],[1.90,0.46],[1.20,0.42],[0.0,0.40],[-1.20,0.42],[-1.80,0.46],[-2.08,0.52]
            ],
            top: [
                [-2.24,1.06],[-2.08,1.16],[-1.80,1.22],[-1.40,1.28],[-1.04,1.34],[-0.82,1.38],
                [-0.48,1.62],[-0.18,1.76],[0.24,1.82],[0.80,1.82],[1.20,1.78],[1.56,1.64],
                [1.80,1.44],[1.96,1.22],[2.06,1.00]
            ],
            belt: [[-2.08,1.16],[-1.50,1.26],[-0.90,1.36],[-0.30,1.46],[0.40,1.50],[1.10,1.50],[1.60,1.40],[1.96,1.22]],
            zones: { hood:[-2.16,-0.84], glass_f:[-0.84,-0.20], roof:[-0.20,1.18], glass_r:[1.18,1.64], tail:[1.64,2.08] },
            splits: { fenderF:-0.90, doors:0.04, doorR:1.06, fenderR:1.08, front:-2.08, rear:1.96 },
            bumper: { f:[-2.18,0.80,0.56], r:[2.04,0.78,0.54] },
            lamps: { f:[-2.22,1.04], r:[2.06,1.12] }
        },

        van: {
            name: 'Минивэн', width: 1.92, sill: 0.44, wheel: 0.40,
            archF: -1.62, archR: 1.50, archR2: 0.54,
            tailName: 'Дверь багажника', rearStyle: 'vertical',
            profile: [
                [-2.40,0.60],[-2.48,0.86],[-2.44,1.10],[-2.30,1.26],[-2.10,1.42],[-1.86,1.60],
                [-1.62,1.82],[-1.46,1.98],[-1.10,2.06],[0.40,2.08],[1.60,2.06],[2.14,2.00],
                [2.38,1.84],[2.46,1.50],[2.48,1.06],[2.42,0.72],[2.28,0.50],[1.50,0.44],
                [0.0,0.42],[-1.50,0.44],[-2.20,0.48]
            ],
            top: [
                [-2.44,1.10],[-2.30,1.26],[-2.10,1.42],[-1.86,1.60],[-1.62,1.82],[-1.46,1.98],
                [-1.10,2.06],[0.40,2.08],[1.60,2.06],[2.14,2.00],[2.38,1.84],[2.46,1.50]
            ],
            belt: [[-2.20,1.22],[-1.80,1.34],[-1.30,1.44],[-0.60,1.50],[0.40,1.52],[1.40,1.52],[2.00,1.48],[2.30,1.40]],
            zones: { hood:[-2.46,-1.92], glass_f:[-1.92,-1.26], roof:[-1.26,2.22] },
            rear: { z: 2.36, glassY: [1.52, 1.94], tailY: [0.84, 1.52] },
            splits: { fenderF:-1.10, doors:0.10, doorR:1.14, fenderR:1.16, front:-2.26, rear:2.30 },
            bumper: { f:[-2.34,0.74,0.50], r:[2.32,0.72,0.48] },
            lamps: { f:[-2.48,0.98], r:[2.44,1.16] }
        }
    };
    var BODY_ORDER = ['sedan', 'hatch', 'crossover', 'van'];

    var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    var threeState = 'idle';   // idle | loading | ready | failed
    var threeWaiters = [];

    function ensureThree(cb) {
        if (threeState === 'ready') { cb(true); return; }
        if (threeState === 'failed') { cb(false); return; }
        threeWaiters.push(cb);
        if (threeState === 'loading') return;
        threeState = 'loading';
        var s = document.createElement('script');
        s.src = THREE_URL;
        s.async = true;
        s.onload = function () {
            threeState = typeof THREE !== 'undefined' ? 'ready' : 'failed';
            threeWaiters.splice(0).forEach(function (f) { f(threeState === 'ready'); });
        };
        s.onerror = function () {
            threeState = 'failed';
            threeWaiters.splice(0).forEach(function (f) { f(false); });
        };
        document.head.appendChild(s);
    }

    // ── Состояние и текст ──────────────────────────────────────────────
    function normalizeMap(raw) {
        var map = raw;
        if (typeof map === 'string') {
            try { map = JSON.parse(map); } catch (e) { map = null; }
        }
        var out = {};
        if (map && typeof map === 'object') {
            Object.keys(map).forEach(function (k) {
                if (PARTS[k] && ['paint', 'hit', 'swap'].indexOf(map[k]) !== -1) out[k] = map[k];
            });
        }
        return out;
    }

    function normalizeType(raw) {
        var t = String(raw || '').trim();
        return BODIES[t] ? t : 'sedan';
    }

    function meta(sid) {
        for (var i = 0; i < STATES.length; i++) if (STATES[i].id === sid) return STATES[i];
        return STATES[0];
    }
    function ending(g) { return g === 'f' ? 'а' : g === 'n' ? 'о' : ''; }

    function partName(id, bodyType) {
        if (id === 'trunk') return BODIES[normalizeType(bodyType)].tailName;
        return PARTS[id].name;
    }

    // Короткая сводка для списка товаров: «крашено 2 · бито 1».
    function summary(raw) {
        var map = normalizeMap(raw);
        var c = { paint: 0, hit: 0, swap: 0 };
        Object.keys(map).forEach(function (k) { c[map[k]]++; });
        var parts = [];
        if (c.hit) parts.push('бито ' + c.hit);
        if (c.swap) parts.push('заменено ' + c.swap);
        if (c.paint) parts.push('крашено ' + c.paint);
        return parts.join(' · ');
    }

    // Готовая фраза для описания и объявления.
    function listingText(raw, bodyType) {
        var map = normalizeMap(raw);
        var groups = { paint: [], hit: [], swap: [] };
        PART_ORDER.forEach(function (id) {
            if (groups[map[id]]) groups[map[id]].push({ name: partName(id, bodyType), g: PARTS[id].g });
        });
        var phrases = [];
        ['hit', 'swap', 'paint'].forEach(function (sid) {
            var arr = groups[sid];
            if (!arr.length) return;
            var names = arr.map(function (p) { return p.name.toLowerCase(); });
            var word = meta(sid).short;
            var tail = arr.length === 1 ? word + ending(arr[0].g) : word + 'ы';
            phrases.push(names.join(', ') + ' — ' + tail);
        });
        return phrases.length ? phrases.join('. ') + '.' : 'Кузов полностью в оригинале, без окрасов.';
    }

    // ── Стили ──────────────────────────────────────────────────────────
    // Тёмная тема — база приложения, светлая включается классом
    // body.light-mode (см. theme.js), поэтому переопределяем так же.
    var CSS = [
        ':root {',
        '  --bm-ok: #3c4652; --bm-paint: #d9a233; --bm-hit: #e0604e; --bm-swap: #6a95e0;',
        '  --bm-seam: #141a20; --bm-trim: #6b7886; --bm-lamp: #c9d4de; --bm-lamp-rear: #e0604e;',
        '  --bm-glass: #4a6073; --bm-wheel: #0d1216; --bm-grille: #596673;',
        '  --bm-scene: rgba(255,255,255,.04); --bm-shell: #2b343e;',
        '}',
        'body.light-mode {',
        '  --bm-ok: #b9c2b7; --bm-paint: #e4a52a; --bm-hit: #d8503f; --bm-swap: #4f7fd6;',
        '  --bm-seam: #ffffff; --bm-trim: #9aa4ae; --bm-lamp: #f2f5f8; --bm-lamp-rear: #d8503f;',
        '  --bm-glass: #a9bccc; --bm-wheel: #3c454f; --bm-grille: #7f8a95;',
        '  --bm-scene: rgba(20,28,16,.05); --bm-shell: #b7beb6;',
        '}',
        '.bm-wrap { margin-top: 18px; }',
        '.bm-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }',
        '.bm-sum { font: 600 12px var(--f-head); color: var(--tx2); }',
        '.bm-types { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }',
        '.bm-type { flex: 1 1 auto; min-width: 78px; padding: 7px 9px; border-radius: 11px;',
        '  border: 1px solid var(--line); background: transparent; color: var(--tx2);',
        '  font: 600 12px var(--f-head); cursor: pointer; }',
        '.bm-type[aria-pressed="true"] { background: var(--g-pri); color: var(--g-pri-tx); border-color: transparent; }',
        '.bm-views { display: flex; gap: 6px; margin-bottom: 10px; }',
        '.bm-view { flex: 1; padding: 7px 9px; border-radius: 999px; border: 1px solid var(--line);',
        '  background: transparent; color: var(--tx2); font: 600 12px var(--f-head); cursor: pointer; }',
        '.bm-view[aria-pressed="true"] { background: var(--g-pri); color: var(--g-pri-tx); border-color: transparent; }',
        '.bm-stage { position: relative; width: 100%; aspect-ratio: 4 / 3; border-radius: 14px;',
        '  overflow: hidden; background: var(--bm-scene); touch-action: none; cursor: grab; }',
        '.bm-stage.is-drag { cursor: grabbing; }',
        '.bm-stage canvas { display: block; width: 100%; height: 100%; }',
        '.bm-note { position: absolute; left: 10px; bottom: 8px; font: 500 11px var(--f-head);',
        '  color: var(--tx2); background: var(--sf2); padding: 3px 9px; border-radius: 999px; pointer-events: none; }',
        '.bm-load { padding: 26px 12px; text-align: center; font: 500 12.5px var(--f-head); color: var(--tx2); }',
        '.bm-angles { display: flex; gap: 5px; margin-top: 8px; }',
        '.bm-angle { flex: 1; padding: 6px 4px; border-radius: 9px; border: 1px solid var(--line);',
        '  background: transparent; color: var(--tx2); font: 600 11px var(--f-head); cursor: pointer; }',
        '.bm-svg { display: block; width: 100%; max-width: 240px; margin: 0 auto; height: auto; }',
        '.bm-p { cursor: pointer; }',
        '.bm-p rect, .bm-p path { stroke: var(--bm-seam); stroke-width: 2; }',
        '.bm-ok rect, .bm-ok path { fill: var(--bm-ok); }',
        '.bm-paint rect, .bm-paint path { fill: var(--bm-paint); }',
        '.bm-hit rect, .bm-hit path { fill: var(--bm-hit); }',
        '.bm-swap rect, .bm-swap path { fill: var(--bm-swap); }',
        '.bm-glass.bm-ok path { fill: var(--bm-glass); }',
        '.bm-sglass { fill: var(--bm-glass); stroke: var(--bm-seam); stroke-width: 1.5; }',
        '.bm-wheel2 { fill: var(--bm-wheel); }',
        '.bm-grille2 { fill: var(--bm-grille); }',
        '.bm-trim2 { fill: var(--bm-trim); }',
        '.bm-outline { fill: none; stroke: var(--bm-trim); stroke-width: 2.5; }',
        '.bm-lamp2 { fill: var(--bm-lamp); opacity: .85; }',
        '.bm-lampr { fill: var(--bm-lamp-rear); opacity: .8; }',
        '.bm-legend { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }',
        '.bm-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px;',
        '  border-radius: 999px; border: 1px solid var(--line); font: 500 11.5px var(--f-head); color: var(--tx2); }',
        '.bm-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }',
        '.bm-line { margin-top: 10px; padding: 10px 12px; border-radius: 12px; background: var(--sf2);',
        '  border: 1px solid var(--line); font: 500 12.5px/1.5 var(--f-head); color: var(--tx2); }',
        '.bm-sheet-back { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,.55); }',
        '.bm-sheet { position: fixed; z-index: 3001; left: 0; right: 0; bottom: 0; padding: 16px;',
        '  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));',
        '  background: var(--bg); border-radius: 22px 22px 0 0; border-top: 1px solid var(--line); }',
        '@media (min-width: 560px) { .bm-sheet { left: 50%; right: auto; bottom: 24px;',
        '  transform: translateX(-50%); width: 380px; border-radius: 20px; border: 1px solid var(--line); } }',
        '.bm-sheet-t { font: 700 15px var(--f-head); color: var(--tx); margin-bottom: 12px; }',
        '.bm-opt { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 12px;',
        '  margin-bottom: 6px; border: 1px solid var(--line); border-radius: 13px; background: transparent;',
        '  color: var(--tx); font: 500 13.5px var(--f-head); text-align: left; cursor: pointer; }',
        '.bm-opt[aria-pressed="true"] { border-color: var(--tx); font-weight: 700; }',
        '.bm-sw { width: 15px; height: 15px; border-radius: 5px; flex: none; }'
    ].join('\n');

    var cssDone = false;
    function ensureCss() {
        if (cssDone) return;
        cssDone = true;
        var st = document.createElement('style');
        st.id = 'bodymap-css';
        st.textContent = CSS;
        document.head.appendChild(st);
    }

    function tokenColor(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
            || getComputedStyle(document.body).getPropertyValue(name).trim() || '#808080';
    }

    // ── Схема сверху ───────────────────────────────────────────────────
    // Одна и та же картинка для всех кузовов: сверху разница между седаном
    // и минивэном почти не видна, а разметка от этого не страдает.
    var uid = 0;
    function topSvg(ns) {
        var clip = 'bmclip' + ns;
        function g(id, inner, extra) {
            return '<g id="' + ns + '-' + id + '" class="bm-p bm-ok' + (extra || '') +
                   '" tabindex="0" role="button" data-part="' + id + '">' + inner + '</g>';
        }
        return '<svg class="bm-svg" viewBox="0 0 260 530" role="group" aria-label="Схема кузова">'
            + '<defs><clipPath id="' + clip + '"><path d="M130 14 C 102 14, 76 26, 60 50 C 46 72, 37 104, 35 142 L 32 364'
            + ' C 32 406, 38 446, 51 469 C 67 499, 97 512, 130 512 C 163 512, 193 499, 209 469'
            + ' C 222 446, 228 406, 228 364 L 225 142 C 223 104, 214 72, 200 50 C 184 26, 158 14, 130 14 Z"></path></clipPath></defs>'
            + '<g><rect class="bm-wheel2" x="16" y="152" width="30" height="74" rx="11"></rect>'
            + '<rect class="bm-wheel2" x="214" y="152" width="30" height="74" rx="11"></rect>'
            + '<rect class="bm-wheel2" x="16" y="330" width="30" height="74" rx="11"></rect>'
            + '<rect class="bm-wheel2" x="214" y="330" width="30" height="74" rx="11"></rect>'
            + '<path class="bm-trim2" d="M36 216 L10 209 Q2 216 9 230 L36 234 Z"></path>'
            + '<path class="bm-trim2" d="M224 216 L250 209 Q258 216 251 230 L224 234 Z"></path></g>'
            + '<g clip-path="url(#' + clip + ')">'
            + g('bumper_f', '<rect x="0" y="0" width="260" height="66"></rect>')
            + g('fender_fl', '<rect x="0" y="66" width="74" height="94"></rect>')
            + g('hood', '<rect x="74" y="66" width="112" height="94"></rect>')
            + g('fender_fr', '<rect x="186" y="66" width="74" height="94"></rect>')
            + g('door_fl', '<rect x="0" y="160" width="74" height="116"></rect>')
            + g('door_fr', '<rect x="186" y="160" width="74" height="116"></rect>')
            + g('door_rl', '<rect x="0" y="276" width="74" height="106"></rect>')
            + g('door_rr', '<rect x="186" y="276" width="74" height="106"></rect>')
            + g('fender_rl', '<rect x="0" y="382" width="74" height="92"></rect>')
            + g('fender_rr', '<rect x="186" y="382" width="74" height="92"></rect>')
            + '<g pointer-events="none"><path class="bm-sglass" d="M74 212 L88 216 L88 326 L74 330 Z"></path>'
            + '<path class="bm-sglass" d="M186 212 L172 216 L172 326 L186 330 Z"></path></g>'
            + g('glass_f', '<path d="M74 160 L186 160 L172 214 L88 214 Z"></path>', ' bm-glass')
            + g('roof', '<rect x="88" y="214" width="84" height="114"></rect>')
            + g('glass_r', '<path d="M88 328 L172 328 L186 382 L74 382 Z"></path>', ' bm-glass')
            + g('trunk', '<rect x="74" y="382" width="112" height="92"></rect>')
            + g('bumper_r', '<rect x="0" y="474" width="260" height="60"></rect>')
            + '<g pointer-events="none">'
            + '<rect class="bm-lamp2" x="54" y="36" width="42" height="17" rx="8"></rect>'
            + '<rect class="bm-lamp2" x="164" y="36" width="42" height="17" rx="8"></rect>'
            + '<rect class="bm-grille2" x="104" y="37" width="52" height="14" rx="6"></rect>'
            + '<rect class="bm-lampr" x="38" y="486" width="50" height="16" rx="7"></rect>'
            + '<rect class="bm-lampr" x="172" y="486" width="50" height="16" rx="7"></rect></g>'
            + '</g>'
            + '<path class="bm-outline" pointer-events="none" d="M130 14 C 102 14, 76 26, 60 50 C 46 72, 37 104, 35 142 L 32 364'
            + ' C 32 406, 38 446, 51 469 C 67 499, 97 512, 130 512 C 163 512, 193 499, 209 469'
            + ' C 222 446, 228 406, 228 364 L 225 142 C 223 104, 214 72, 200 50 C 184 26, 158 14, 130 14 Z"></path>'
            + '</svg>';
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    // ── Лист выбора состояния ──────────────────────────────────────────
    function closeSheet() {
        var a = document.querySelector('.bm-sheet'), b = document.querySelector('.bm-sheet-back');
        if (a) a.remove();
        if (b) b.remove();
    }

    function openSheet(id, ctx) {
        closeSheet();
        var back = document.createElement('div');
        back.className = 'bm-sheet-back';
        back.addEventListener('click', closeSheet);

        var sheet = document.createElement('div');
        sheet.className = 'bm-sheet';
        sheet.setAttribute('role', 'dialog');
        var html = '<div class="bm-sheet-t">' + esc(partName(id, ctx.bodyType)) + '</div>';
        STATES.forEach(function (st) {
            var on = (ctx.map[id] || 'ok') === st.id;
            html += '<button type="button" class="bm-opt" data-state="' + st.id + '" aria-pressed="' + on + '">'
                  + '<span class="bm-sw" style="background:var(' + st.css + ')"></span>' + st.name + '</button>';
        });
        sheet.innerHTML = html;
        sheet.querySelectorAll('.bm-opt').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var v = btn.getAttribute('data-state');
                if (v === 'ok') delete ctx.map[id]; else ctx.map[id] = v;
                closeSheet();
                ctx.refresh();
                ctx.changed();
            });
        });
        document.body.appendChild(back);
        document.body.appendChild(sheet);
    }

    // ── Объёмная модель ────────────────────────────────────────────────
    // Кузов строится из линии профиля: контур вида сбоку выдавливается на
    // ширину машины со скруглением кромок. Детали — полосы того же контура
    // (капот, стёкла, крыша, багажник) и плоские борта с вырезами арок,
    // поэтому они повторяют изгиб кузова, а не висят над ним плитами.
    function createScene(stage, ctx) {
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(32, 4 / 3, 0.1, 100);
        var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        stage.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.58));
        var key = new THREE.DirectionalLight(0xffffff, 0.85);
        key.position.set(4, 7, 5);
        scene.add(key);
        var fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 3, -4);
        scene.add(fillLight);

        var car = new THREE.Group();
        scene.add(car);
        var meshes = {};

        function colorFor(id) {
            var sid = ctx.map[id] || 'ok';
            if (sid === 'ok' && id.indexOf('glass') === 0) return tokenColor('--bm-glass');
            return tokenColor(meta(sid).css);
        }
        function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
        function mat(color, o) {
            o = o || {};
            return new THREE.MeshLambertMaterial({
                color: new THREE.Color(color),
                transparent: !!o.transparent,
                opacity: o.opacity === undefined ? 1 : o.opacity
            });
        }
        function shapeFrom(points) {
            var sh = new THREE.Shape();
            sh.moveTo(points[0][0], points[0][1]);
            for (var i = 1; i < points.length; i++) sh.lineTo(points[i][0], points[i][1]);
            sh.closePath();
            return sh;
        }
        // Контур выдавливается поперёк машины: локальный X становится
        // продольной осью, локальный Z — поперечной (см. rotation.y ниже).
        function extrude(points, depth, bevel) {
            return new THREE.ExtrudeGeometry(shapeFrom(points), {
                depth: depth, bevelEnabled: true,
                bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 6
            });
        }

        function buildBody(bodyId) {
            while (car.children.length) car.remove(car.children[0]);
            meshes = {};
            var B = BODIES[bodyId] || BODIES.sedan;
            var halfW = B.width / 2;

            function yAt(z) {
                var T = B.top;
                for (var i = 0; i < T.length - 1; i++) {
                    if (z >= T[i][0] && z <= T[i + 1][0]) {
                        var t = (z - T[i][0]) / (T[i + 1][0] - T[i][0]);
                        return T[i][1] + (T[i + 1][1] - T[i][1]) * t;
                    }
                }
                return z < T[0][0] ? T[0][1] : T[T.length - 1][1];
            }
            function beltAt(z) {
                var L = B.belt;
                if (z <= L[0][0]) return L[0][1];
                for (var i = 0; i < L.length - 1; i++) {
                    if (z >= L[i][0] && z <= L[i + 1][0]) {
                        var t = (z - L[i][0]) / (L[i + 1][0] - L[i][0]);
                        return L[i][1] + (L[i + 1][1] - L[i][1]) * t;
                    }
                }
                return L[L.length - 1][1];
            }
            function addPart(id, geom, place) {
                var m = new THREE.Mesh(geom, mat(colorFor(id)));
                place(m);
                m.userData.partId = id;
                car.add(m);
                meshes[id] = m;
            }
            function addTrim(geom, pos, color, rot, opacity) {
                var m = new THREE.Mesh(geom, mat(color, { transparent: opacity !== undefined, opacity: opacity }));
                m.position.set(pos[0], pos[1], pos[2]);
                if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
                car.add(m);
            }

            var shell = new THREE.Mesh(extrude(B.profile, B.width - 0.06, 0.06), mat(tokenColor('--bm-shell')));
            shell.rotation.y = -Math.PI / 2;
            shell.position.x = halfW - 0.03;
            car.add(shell);

            function band(z1, z2, t) {
                var top = [[z1, yAt(z1)]];
                B.top.forEach(function (pt) { if (pt[0] > z1 && pt[0] < z2) top.push([pt[0], pt[1]]); });
                top.push([z2, yAt(z2)]);
                return top.concat(top.slice().reverse().map(function (pt) { return [pt[0], pt[1] - t]; }));
            }
            function addTop(id, range, t) {
                if (!range) return;
                addPart(id, extrude(band(range[0], range[1], t), B.width - 0.16, 0.035), function (m) {
                    m.rotation.y = -Math.PI / 2;
                    m.position.x = halfW - 0.08;
                });
            }
            addTop('hood', B.zones.hood, 0.09);
            addTop('glass_f', B.zones.glass_f, 0.07);
            addTop('roof', B.zones.roof, 0.09);
            addTop('glass_r', B.zones.glass_r, 0.07);
            addTop('trunk', B.zones.tail, 0.09);

            // У минивэна корма вертикальная: стекло и дверь багажника — не
            // полосы крыши, а пластины на задке.
            if (B.rearStyle === 'vertical' && B.rear) {
                addPart('glass_r', box(B.width - 0.28, B.rear.glassY[1] - B.rear.glassY[0], 0.1), function (m) {
                    m.position.set(0, (B.rear.glassY[0] + B.rear.glassY[1]) / 2, B.rear.z);
                });
                addPart('trunk', box(B.width - 0.22, B.rear.tailY[1] - B.rear.tailY[0], 0.1), function (m) {
                    m.position.set(0, (B.rear.tailY[0] + B.rear.tailY[1]) / 2, B.rear.z);
                });
            }

            addPart('bumper_f', box(B.width - 0.1, B.bumper.f[2], 0.3), function (m) {
                m.position.set(0, B.bumper.f[1], B.bumper.f[0]);
            });
            addPart('bumper_r', box(B.width - 0.1, B.bumper.r[2], 0.3), function (m) {
                m.position.set(0, B.bumper.r[1], B.bumper.r[0]);
            });

            function arch(centerZ, radius, fromZ, toZ) {
                var pts = [[fromZ, B.sill]], steps = 10;
                for (var i = 0; i <= steps; i++) {
                    var a = Math.PI - (Math.PI * i / steps);
                    pts.push([centerZ + Math.cos(a) * radius, B.sill + Math.sin(a) * radius * 0.66]);
                }
                pts.push([toZ, B.sill]);
                return pts;
            }
            function beltChain(zFrom, zTo) {
                var pts = [[zTo, beltAt(zTo)]];
                for (var i = B.belt.length - 1; i >= 0; i--) {
                    if (B.belt[i][0] < zTo && B.belt[i][0] > zFrom) pts.push([B.belt[i][0], B.belt[i][1]]);
                }
                pts.push([zFrom, beltAt(zFrom)]);
                return pts;
            }
            function sidePoly(zFrom, zTo, archCenter) {
                var bottom = archCenter === null
                    ? [[zFrom, B.sill], [zTo, B.sill]]
                    : arch(archCenter, B.archR2, zFrom, zTo);
                return bottom.concat(beltChain(zFrom, zTo));
            }
            function addSide(id, poly, side) {
                addPart(id, extrude(poly, 0.07, 0.02), function (m) {
                    m.rotation.y = -Math.PI / 2;
                    m.position.x = side < 0 ? -(halfW - 0.02) : halfW + 0.05;
                });
            }
            var S = B.splits;
            addSide('fender_fl', sidePoly(S.front, S.fenderF, B.archF), -1);
            addSide('fender_fr', sidePoly(S.front, S.fenderF, B.archF), 1);
            addSide('door_fl', sidePoly(S.fenderF, S.doors, null), -1);
            addSide('door_fr', sidePoly(S.fenderF, S.doors, null), 1);
            addSide('door_rl', sidePoly(S.doors, S.doorR, null), -1);
            addSide('door_rr', sidePoly(S.doors, S.doorR, null), 1);
            addSide('fender_rl', sidePoly(S.fenderR, S.rear, B.archR), -1);
            addSide('fender_rr', sidePoly(S.fenderR, S.rear, B.archR), 1);

            var glassCol = tokenColor('--bm-glass');
            var winFrom = B.zones.glass_f[1] + 0.05;
            var winTo = (B.zones.glass_r ? B.zones.glass_r[0] : S.rear) - 0.05;
            var win = [[winFrom, beltAt(winFrom) + 0.03], [winTo, beltAt(winTo) + 0.03]];
            var chain = [];
            B.top.forEach(function (pt) { if (pt[0] > winFrom && pt[0] < winTo) chain.push([pt[0], pt[1] - 0.12]); });
            win = win.concat(chain.reverse());
            [-1, 1].forEach(function (side) {
                var w = new THREE.Mesh(extrude(win, 0.04, 0.01), mat(glassCol, { transparent: true, opacity: 0.78 }));
                w.rotation.y = -Math.PI / 2;
                w.position.x = side < 0 ? -(halfW - 0.01) : halfW + 0.05;
                car.add(w);
            });

            var lampW = (B.width - 0.1) * 0.26;
            addTrim(box(lampW, 0.15, 0.1), [-(B.width * 0.3), B.lamps.f[1], B.lamps.f[0]], tokenColor('--bm-lamp'));
            addTrim(box(lampW, 0.15, 0.1), [B.width * 0.3, B.lamps.f[1], B.lamps.f[0]], tokenColor('--bm-lamp'));
            addTrim(box(B.width * 0.42, 0.17, 0.08), [0, B.lamps.f[1] - 0.16, B.lamps.f[0] - 0.04], tokenColor('--bm-grille'));
            addTrim(box(lampW, 0.14, 0.1), [-(B.width * 0.3), B.lamps.r[1], B.lamps.r[0]], tokenColor('--bm-lamp-rear'));
            addTrim(box(lampW, 0.14, 0.1), [B.width * 0.3, B.lamps.r[1], B.lamps.r[0]], tokenColor('--bm-lamp-rear'));

            var wheelGeom = new THREE.CylinderGeometry(B.wheel, B.wheel, 0.26, 24);
            var wheelCol = tokenColor('--bm-wheel');
            [[-halfW + 0.03, B.archF], [halfW - 0.03, B.archF],
             [-halfW + 0.03, B.archR], [halfW - 0.03, B.archR]].forEach(function (p) {
                addTrim(wheelGeom, [p[0], B.wheel, p[1]], wheelCol, [0, 0, Math.PI / 2]);
            });

            var shadow = new THREE.Mesh(
                new THREE.CircleGeometry(2.7, 36),
                new THREE.MeshBasicMaterial({ color: new THREE.Color(tokenColor('--bm-trim')), transparent: true, opacity: 0.18 })
            );
            shadow.rotation.x = -Math.PI / 2;
            shadow.position.y = 0.01;
            car.add(shadow);
        }

        var yaw = -0.72, pitch = 0.38, dist = 10.4;
        function place() {
            camera.position.set(
                dist * Math.cos(pitch) * Math.sin(yaw),
                dist * Math.sin(pitch),
                dist * Math.cos(pitch) * Math.cos(yaw)
            );
            camera.lookAt(0, 0.95, 0);
        }
        function resize() {
            var w = stage.clientWidth, h = stage.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            draw();
        }
        function draw() { place(); renderer.render(scene, camera); }

        // Вращение пальцем; короткое касание без сдвига считается тычком
        // в деталь, поэтому крутить и отмечать можно одним пальцем.
        var dragging = false, moved = 0, lx = 0, ly = 0;
        stage.addEventListener('pointerdown', function (e) {
            dragging = true; moved = 0; lx = e.clientX; ly = e.clientY;
            stage.classList.add('is-drag');
            try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        });
        stage.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            var dx = e.clientX - lx, dy = e.clientY - ly;
            moved += Math.abs(dx) + Math.abs(dy);
            lx = e.clientX; ly = e.clientY;
            yaw -= dx * 0.008;
            pitch = Math.max(-0.2, Math.min(1.35, pitch + dy * 0.006));
            draw();
        });
        stage.addEventListener('pointerup', function (e) {
            dragging = false;
            stage.classList.remove('is-drag');
            if (moved < 6 && !ctx.readOnly) pick(e);
        });
        stage.addEventListener('pointercancel', function () {
            dragging = false;
            stage.classList.remove('is-drag');
        });

        var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
        function pick(e) {
            var r = stage.getBoundingClientRect();
            ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
            ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
            ray.setFromCamera(ndc, camera);
            var hits = ray.intersectObjects(car.children, false);
            for (var i = 0; i < hits.length; i++) {
                var id = hits[i].object.userData.partId;
                if (id) { openSheet(id, ctx); return; }
            }
        }

        var onResize = function () { resize(); };
        window.addEventListener('resize', onResize);

        buildBody(ctx.bodyType);
        resize();

        return {
            repaint: function () {
                Object.keys(meshes).forEach(function (id) {
                    meshes[id].material.color.set(colorFor(id));
                });
                draw();
            },
            rebuild: function (bodyId) { buildBody(bodyId); draw(); },
            resize: resize,
            angle: function (a) {
                if (a === 'front') { yaw = Math.PI; pitch = 0.25; }
                if (a === 'rear') { yaw = 0; pitch = 0.25; }
                if (a === 'left') { yaw = -Math.PI / 2; pitch = 0.22; }
                if (a === 'right') { yaw = Math.PI / 2; pitch = 0.22; }
                draw();
            },
            dispose: function () { window.removeEventListener('resize', onResize); }
        };
    }

    // ── Сборка блока в карточке ────────────────────────────────────────
    function mount(host, opts) {
        if (!host) return null;
        ensureCss();
        var ns = 'bm' + (++uid);
        var ctx = {
            bodyType: normalizeType(opts.bodyType),
            map: normalizeMap(opts.map),
            readOnly: !!opts.readOnly,
            onChange: opts.onChange || function () {},
            three: null
        };

        var typesHtml = ctx.readOnly ? '' : '<div class="bm-types">' + BODY_ORDER.map(function (id) {
            return '<button type="button" class="bm-type" data-body="' + id + '" aria-pressed="'
                 + (id === ctx.bodyType) + '">' + BODIES[id].name + '</button>';
        }).join('') + '</div>';

        host.innerHTML = '<div class="bm-wrap">'
            + '<div class="bm-head"><span class="eyebrow">Кузов</span><span class="bm-sum" id="' + ns + '-sum"></span></div>'
            + typesHtml
            + '<div class="bm-views">'
            + '<button type="button" class="bm-view" data-view="3d" aria-pressed="true">Объём</button>'
            + '<button type="button" class="bm-view" data-view="2d" aria-pressed="false">Схема сверху</button>'
            + '</div>'
            + '<div id="' + ns + '-v3">'
            + '<div class="bm-stage" id="' + ns + '-stage"><div class="bm-load" id="' + ns + '-load">Загружаем модель…</div>'
            + '<div class="bm-note" id="' + ns + '-note" hidden>Потяните, чтобы повернуть</div></div>'
            + '<div class="bm-angles">'
            + '<button type="button" class="bm-angle" data-angle="front">Спереди</button>'
            + '<button type="button" class="bm-angle" data-angle="left">Слева</button>'
            + '<button type="button" class="bm-angle" data-angle="right">Справа</button>'
            + '<button type="button" class="bm-angle" data-angle="rear">Сзади</button>'
            + '</div></div>'
            + '<div id="' + ns + '-v2" hidden>' + topSvg(ns) + '</div>'
            + '<div class="bm-legend" id="' + ns + '-leg"></div>'
            + '<div class="bm-line" id="' + ns + '-line"></div>'
            + '</div>';

        function byId(suffix) { return document.getElementById(ns + suffix); }

        ctx.refresh = function () {
            PART_ORDER.forEach(function (id) {
                var el = byId('-' + id);
                if (!el) return;
                el.setAttribute('class', 'bm-p bm-' + (ctx.map[id] || 'ok') + (id.indexOf('glass') === 0 ? ' bm-glass' : ''));
                el.setAttribute('aria-label', partName(id, ctx.bodyType) + ': ' + meta(ctx.map[id] || 'ok').name);
            });
            if (ctx.three && ctx.three.repaint) ctx.three.repaint();

            var s = summary(ctx.map);
            byId('-sum').textContent = s || 'весь в оригинале';
            var counts = { paint: 0, hit: 0, swap: 0 };
            Object.keys(ctx.map).forEach(function (k) { counts[ctx.map[k]]++; });
            byId('-leg').innerHTML = [['ok', PART_ORDER.length - counts.paint - counts.hit - counts.swap],
                ['paint', counts.paint], ['hit', counts.hit], ['swap', counts.swap]]
                .map(function (pair) {
                    var m = meta(pair[0]);
                    return '<span class="bm-chip"><span class="bm-dot" style="background:var(' + m.css + ')"></span>'
                         + m.name + ' ' + pair[1] + '</span>';
                }).join('');
            byId('-line').textContent = listingText(ctx.map, ctx.bodyType);
        };

        ctx.changed = function () {
            ctx.onChange({ bodyType: ctx.bodyType, map: ctx.map });
        };

        // схема сверху
        PART_ORDER.forEach(function (id) {
            var el = byId('-' + id);
            if (!el) return;
            if (ctx.readOnly) { el.style.cursor = 'default'; return; }
            el.addEventListener('click', function () { openSheet(id, ctx); });
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSheet(id, ctx); }
            });
        });

        // вкладки
        host.querySelectorAll('.bm-view').forEach(function (b) {
            b.addEventListener('click', function () {
                var is3 = b.getAttribute('data-view') === '3d';
                host.querySelectorAll('.bm-view').forEach(function (x) {
                    x.setAttribute('aria-pressed', String(x === b));
                });
                byId('-v3').hidden = !is3;
                byId('-v2').hidden = is3;
                if (is3 && ctx.three) ctx.three.resize();
            });
        });

        // типы кузова
        host.querySelectorAll('.bm-type').forEach(function (b) {
            b.addEventListener('click', function () {
                var id = b.getAttribute('data-body');
                if (id === ctx.bodyType) return;
                ctx.bodyType = id;
                host.querySelectorAll('.bm-type').forEach(function (x) {
                    x.setAttribute('aria-pressed', String(x === b));
                });
                if (ctx.three) ctx.three.rebuild(ctx.bodyType);
                ctx.refresh();
                ctx.changed();
            });
        });

        host.querySelectorAll('.bm-angle').forEach(function (b) {
            b.addEventListener('click', function () {
                if (ctx.three) ctx.three.angle(b.getAttribute('data-angle'));
            });
        });

        ctx.refresh();

        ensureThree(function (ok) {
            if (!document.body.contains(host)) return;
            if (!ok) {
                byId('-load').textContent = 'Объёмная модель не загрузилась — пользуйтесь схемой сверху.';
                return;
            }
            byId('-load').hidden = true;
            byId('-note').hidden = false;
            ctx.three = createScene(byId('-stage'), ctx);
            ctx.refresh();
        });

        return ctx;
    }

    window.addEventListener('themechange', function () {
        document.querySelectorAll('.bm-wrap').forEach(function () {});
    });

    return {
        mount: mount,
        summary: summary,
        listingText: listingText,
        normalizeMap: normalizeMap,
        normalizeType: normalizeType,
        BODIES: BODIES,
        BODY_ORDER: BODY_ORDER
    };
})();
