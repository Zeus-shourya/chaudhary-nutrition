/* Chaudhary Nutrition — shared site chrome, sprite, cart, search and card rendering.
   Page scripts (home.js, shop.js, product.js, finder.js) build on window.CN. */
(function () {
  'use strict';
  var C = window.CN_CONFIG;
  var CAT = window.CN_CATALOG || { products: [], updated: '' };
  var P = CAT.products;
  var byId = new Map(P.map(function (p) { return [p.id, p]; }));
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var V = '?v=' + C.imgVersion;
  // the single-file phone bundle (tools/build-bundle.ps1) swaps in embedded images via CN_ASSET
  var asset = function (path) { return window.CN_ASSET ? window.CN_ASSET(path) : path + V; };
  var img = function (p, n, large) { n = n || 1; return asset('assets/img/p/' + p.id + '-' + n + (!large && n <= 2 ? '-s' : '') + '.jpg'); };
  var catOf = function (k) { return C.categories.find(function (c) { return c.key === k; }); };
  var num = function (p) { return 'N°' + String(p.o + 1).padStart(3, '0'); };
  var off = function (p) { return p.m > p.p ? Math.round((1 - p.p / p.m) * 100) : 0; };
  var built = Date.parse(CAT.updated) || Date.now();
  var isNew = function (p) { return (built - Date.parse(p.d)) / 864e5 < 45; };
  var wa = function (text) { return 'https://wa.me/' + C.whatsapp + (text ? '?text=' + encodeURIComponent(text) : ''); };
  var page = document.body.getAttribute('data-page') || '';
  var pageNow = function () { return document.body.getAttribute('data-page') || ''; };   // changes in the bundle
  var go = function (u) { if (window.CN_NAV) { close(); window.CN_NAV(u); } else location.href = u; };
  document.documentElement.classList.add('js');

  /* ================================================================ sprite */
  var G = function (inner) { return '<g style="fill:none;stroke:currentColor;stroke-width:var(--ill-sw,2.2);stroke-linecap:round;stroke-linejoin:round">' + inner + '</g>'; };
  var A = function (cx, cy, r) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" style="fill:var(--ill-accent,transparent)"/>'; };
  var DOT = 'style="fill:currentColor;stroke:none"';
  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
    bag: '<path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.6-4 4.6-6 8-6s6.4 2 8 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-l': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    'arrow-ur': '<path d="M7 17L17 7M8 7h9v9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    leaf: '<path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z"/><path d="M5 19l9-9"/>',
    flask: '<path d="M9 3h6M10 3v6l-5.2 9.3A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.7L14 9V3"/><path d="M7.6 15h8.8"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3.4 3.2 14.6 0 18M12 3c-3.2 3.4-3.2 14.6 0 18"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
    phone: '<path d="M5.5 3.5h3.2l1.8 4.6-2.2 1.4a11 11 0 0 0 5.2 5.2l1.4-2.2 4.6 1.8v3.2a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 5.7a2 2 0 0 1 2-2.2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    pin: '<path d="M12 21s-7-6.4-7-11.6a7 7 0 0 1 14 0C19 14.6 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    insta: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" ' + DOT + '/>',
    wa: '<path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z"/><path d="M8.7 8.4c.3-.6.6-.6.9-.6h.6c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.1.3 0 .5.5.9 1.4 1.8 2.4 2.3.2.1.4.1.5-.1l.6-.6c.2-.2.4-.2.6-.1l1.6.7c.2.1.4.3.4.5v.6c0 .3-.1.6-.6.9-.6.4-1.6.5-2.7.1a8.3 8.3 0 0 1-3.3-2.3 8.4 8.4 0 0 1-2-3.3c-.3-1 0-1.9.4-2.4z" ' + DOT + '/>',
    spark: '<path d="M12 2.5c.7 5 3.6 8 9.5 9.5-5.9 1.5-8.8 4.5-9.5 9.5-.7-5-3.6-8-9.5-9.5 5.9-1.5 8.8-4.5 9.5-9.5z" ' + DOT + '/>',
    flower: '<path d="M12 12c-2.2-2.6-2.2-6 0-8.5 2.2 2.5 2.2 5.9 0 8.5zM12 12c2.6-2.2 6-2.2 8.5 0-2.5 2.2-5.9 2.2-8.5 0zM12 12c2.2 2.6 2.2 6 0 8.5-2.2-2.5-2.2-5.9 0-8.5zM12 12c-2.6 2.2-6 2.2-8.5 0 2.5-2.2 5.9-2.2 8.5 0z" ' + DOT + '/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.8-3.2 8-7.5 9.5-4.3-1.5-7.5-4.7-7.5-9.5V6L12 3z"/><path d="M8.6 12l2.4 2.4 4.6-4.8"/>',
    truck: '<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
    gift: '<rect x="3.5" y="9" width="17" height="11.5" rx="1.5"/><path d="M2.5 9h19M12 9v11.5M12 9c-1.5-3.5-6-4.5-6-1.8C6 8.6 9 9 12 9zm0 0c1.5-3.5 6-4.5 6-1.8C18 8.6 15 9 12 9z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
    drag: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>',
    zoom: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21M11 8v6M8 11h6"/>',
    filter: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>'
  };
  var ILL = {
    /* categories */
    'cat-skin': A(62, 66, 38) + G('<path d="M40 62a10 10 0 0 1 10-10h20a10 10 0 0 1 10 10v38a10 10 0 0 1-10 10H50a10 10 0 0 1-10-10z"/><path d="M50 52v-8h20v8"/><path d="M54 44V33a6 6 0 0 1 12 0v11"/><path d="M48 72h24M48 80h15"/><path d="M98 58s-8 10-8 15a8 8 0 0 0 16 0c0-5-8-15-8-15z"/><path d="M22 24v14M15 31h14M100 26v8M96 30h8"/>'),
    'cat-hair': A(60, 58, 40) + G('<path d="M16 34c14-12 26 8 40-2s28-10 46 2"/><path d="M16 47c14-12 26 8 40-2s28-10 46 2"/><path d="M16 60c14-12 26 8 40-2s28-10 46 2"/><rect x="20" y="74" width="80" height="14" rx="7"/><path d="M30 88v18M40 88v18M50 88v18M60 88v18M70 88v18M80 88v18M90 88v18"/>'),
    'cat-women': A(60, 62, 40) + G('<path d="M60 28c12 15 14 35 0 56-14-21-12-41 0-56z"/><path d="M60 84c-4-17-14-29-31-33 0 19 13 31 31 33z"/><path d="M60 84c4-17 14-29 31-33 0 19-13 31-31 33z"/><path d="M60 84c-15-1-31-8-42-21 15-5 29 1 42 21z"/><path d="M60 84c15-1 31-8 42-21-15-5-29 1-42 21z"/><path d="M24 97h72M38 105h44"/>'),
    'cat-men': A(56, 70, 38) + G('<circle cx="86" cy="34" r="13"/><path d="M10 96L44 42l14 22 10-14 32 46z"/><path d="M35 56l9 6 7-7"/><path d="M6 96h108M24 106h30M68 106h22"/>'),
    'cat-baby': A(50, 52, 38) + G('<circle cx="48" cy="48" r="24"/><path d="M28 38c12 9 28 9 40 0M28 58c12-9 28-9 40 0"/><path d="M65 65l24 24"/><circle cx="94" cy="94" r="8"/><path d="M98 20v12M92 26h12M20 90v10M15 95h10"/>'),
    'cat-health': A(60, 64, 40) + G('<path d="M60 100C30 80 18 62 22 46c4-16 26-20 38-4 12-16 34-12 38 4 4 16-8 34-38 54z"/><path d="M22 66h20l6-12 8 24 6-14h36"/><path d="M60 42c0-14 10-24 24-26 0 14-10 24-24 26z"/>'),
    'cat-weight': A(54, 60, 38) + G('<circle cx="46" cy="56" r="27"/><circle cx="46" cy="56" r="8"/><path d="M73 50h24c6 0 10 4 10 10v46"/><path d="M73 62h16c2 0 4 2 4 4v40"/><path d="M80 50v5M86 50v3M92 50v5M107 74h-5M107 82h-3M107 90h-5M107 98h-3M91 106h18"/>'),
    'cat-nutrition': A(60, 66, 40) + G('<rect x="34" y="28" width="52" height="13" rx="4"/><path d="M38 41h44v56a10 10 0 0 1-10 10H48a10 10 0 0 1-10-10z"/><rect x="46" y="58" width="28" height="28" rx="3"/><path d="M60 80c0-9 5-14 11-15 0 9-5 14-11 15z"/><path d="M98 30v10M93 35h10M18 64v8M14 68h8"/>'),
    'cat-kits': A(60, 66, 40) + G('<rect x="24" y="54" width="72" height="50" rx="4"/><rect x="18" y="40" width="84" height="15" rx="4"/><path d="M60 40v64"/><path d="M60 40c-6-14-26-18-26-6 0 6 14 6 26 6zM60 40c6-14 26-18 26-6 0 6-14 6-26 6z"/>'),
    /* ingredients */
    'ing-ashwagandha': A(60, 66, 38) + G('<path d="M58 12c0 10 2 18 2 28"/><path d="M60 30c-10-5-19-3-25 4 8 4 17 4 25-4zM60 23c8-7 18-7 25-3-7 7-17 9-25 3z"/><path d="M60 40c-2 17-6 31-14 45-4 8-9 14-15 22"/><path d="M56 62c6 10 10 23 12 40"/><path d="M50 76c-8 2-16 0-24-5M64 88c6 2 10 6 12 12"/><path d="M92 58c-11 4-13 20 0 28 13-8 11-24 0-28z"/><circle cx="92" cy="73" r="5"/>'),
    'ing-shatavari': A(60, 56, 38) + G('<path d="M60 10v58"/><path d="M60 18l-11-7M60 18l11-7M60 27l-14-8M60 27l14-8M60 36l-16-8M60 36l16-8M60 45l-17-8M60 45l17-8M60 54l-15-7M60 54l15-7"/><path d="M60 68v8"/><ellipse cx="44" cy="92" rx="6" ry="16" transform="rotate(25 44 92)"/><ellipse cx="60" cy="96" rx="6" ry="17"/><ellipse cx="76" cy="92" rx="6" ry="16" transform="rotate(-25 76 92)"/><path d="M60 76l-10 4M60 76l10 4"/>'),
    'ing-brahmi': A(60, 62, 38) + G('<path d="M8 80c20-16 40 6 58-6s30-16 46-8"/><ellipse cx="22" cy="64" rx="7" ry="11" transform="rotate(-30 22 64)"/><ellipse cx="30" cy="88" rx="7" ry="11" transform="rotate(32 30 88)"/><ellipse cx="50" cy="64" rx="7" ry="11" transform="rotate(-18 50 64)"/><ellipse cx="60" cy="90" rx="7" ry="11" transform="rotate(26 60 90)"/><ellipse cx="82" cy="54" rx="7" ry="11" transform="rotate(-34 82 54)"/><ellipse cx="90" cy="78" rx="7" ry="11" transform="rotate(20 90 78)"/><path d="M106 58c4-4 4-10 0-14-4 4-4 10 0 14zM106 58c-6 0-10-4-10-8 6 0 10 4 10 8zM106 58c6 0 10-4 10-8-6 0-10 4-10 8z"/>'),
    'ing-tulsi': A(60, 62, 38) + G('<path d="M60 112V24"/><path d="M60 94c-10-3-21 1-27 10 10 5 21 1 27-10zM60 94c10-3 21 1 27 10-10 5-21 1-27-10z"/><path d="M60 72c-9-2-18 1-24 9 9 4 18 0 24-9zM60 72c9-2 18 1 24 9-9 4-18 0-24-9z"/><path d="M60 52c-7-2-14 0-19 7 7 3 14 0 19-7zM60 52c7-2 14 0 19 7-7 3-14 0-19-7z"/><path d="M60 24v-10M55 28h10M54 34h12M55 40h10M56 20h8"/>'),
    'ing-triphala': A(60, 64, 40) + G('<circle cx="40" cy="80" r="18"/><circle cx="80" cy="80" r="18"/><ellipse cx="60" cy="48" rx="15" ry="18"/><path d="M40 62c-6 8-6 28 0 36M80 62c6 8 6 28 0 36M60 30c-5 6-5 30 0 36"/><path d="M60 30c4-10 12-15 22-15-2 10-10 15-22 15z"/>'),
    'ing-shilajit': A(60, 66, 38) + G('<path d="M12 98l20-40 14 10 16-32 20 28 8-8 18 42z"/><path d="M62 36l-4 16 8 6M32 58l6 14"/><path d="M74 66c0 9-5 13-5 19a5 5 0 0 0 10 0c0-6-5-10-5-19z"/><path d="M6 98h108"/>'),
    'ing-amla': A(56, 70, 38) + G('<circle cx="56" cy="72" r="30"/><path d="M56 42c-12 10-12 50 0 60M56 42c12 10 12 50 0 60M56 42c-22 8-24 50 0 60M56 42c22 8 24 50 0 60"/><path d="M56 42c0-9 4-15 10-19"/><path d="M66 23c8-8 20-8 28-2-8 8-20 8-28 2z"/>'),
    'ing-karela': A(58, 64, 40) + G('<g transform="rotate(45 58 64)"><ellipse cx="58" cy="64" rx="16" ry="44"/><path d="M51 30c-3 20-3 48 0 68M65 30c3 20 3 48 0 68M58 20v-9"/></g><path d="M96 14c6-2 11 2 9 7s-9 3-7-2"/>') + '<g transform="rotate(45 58 64)" ' + DOT + '><circle cx="53" cy="44" r="1.8"/><circle cx="63" cy="52" r="1.8"/><circle cx="53" cy="62" r="1.8"/><circle cx="63" cy="72" r="1.8"/><circle cx="53" cy="82" r="1.8"/><circle cx="62" cy="90" r="1.8"/></g>',
    'ing-moti': A(60, 66, 38) + G('<path d="M14 74c8 28 84 28 92 0z"/><path d="M14 74c4-30 30-44 46-44s42 14 46 44"/><path d="M60 30v44M40 36l10 38M80 36l-10 38M25 50l20 24M95 50l-20 24"/><circle cx="60" cy="86" r="9"/><path d="M55 83a5 5 0 0 1 5-4"/>'),
    'ing-haldi': A(58, 64, 38) + G('<path d="M18 72c0-8 8-12 16-10l20 3c7-8 19-10 25-2 7 0 13 4 13 10s-6 10-13 8c-4 6-14 8-20 2l-24 2c-9 2-17-4-17-13z"/><path d="M36 62c-2 5-2 11 0 15M53 65c-2 4-2 10 0 12M72 58c-3 5-3 12 0 16"/><path d="M68 57c0-10 4-18 10-22 4 4 4 14-2 22"/><circle cx="92" cy="96" r="12"/><circle cx="92" cy="96" r="5"/><path d="M78 35c4-12 14-18 24-18-2 12-12 18-24 18z"/>'),
    'ing-vitc': A(64, 58, 38) + G('<circle cx="56" cy="66" r="34"/><circle cx="56" cy="66" r="27"/><path d="M56 66V39M56 66l19.1-19.1M56 66h27M56 66l19.1 19.1M56 66v27M56 66L36.9 85.1M56 66H29M56 66L36.9 46.9"/><path d="M102 18s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z"/>'),
    'ing-niacinamide': A(56, 62, 38) + G('<path d="M48 44l17.3 10v20L48 84 30.7 74V54z"/><path d="M36 58v12M51 49l9 5M51 79l9-5"/><path d="M65.3 54L82 44"/><path d="M79 44V28M85 44V28"/><path d="M82 44l16 10"/>') + '<g ' + DOT + '><circle cx="82" cy="24" r="4.5"/><circle cx="101" cy="56" r="4.5"/><circle cx="30.7" cy="74" r="4.5"/></g>',
    /* decorative */
    'deco-sprig': G('<path d="M18 114C40 84 58 54 98 8"/><path d="M33 94c-13-2-21-11-23-22 13 0 21 9 23 22zM39 86c2-13 11-21 23-23 0 13-9 21-23 23z"/><path d="M51 70c-12-2-20-10-22-21 12 0 20 9 22 21zM57 62c2-12 10-20 22-22 0 12-8 20-22 22z"/><path d="M69 44c-10-2-17-9-19-18 10 0 17 8 19 18zM75 37c2-10 9-17 19-19 0 10-8 17-19 19z"/><path d="M86 22c-6-1-11-6-12-12 6 0 11 5 12 12z"/>'),
    'deco-mortar': A(60, 70, 40) + G('<path d="M16 62h88c0 22-19 38-44 38S16 84 16 62z"/><path d="M40 100l-4 10h48l-4-10"/><path d="M70 62l26-42a6 6 0 0 1 10 6L80 62"/><path d="M32 62c0-9 6-15 15-15M47 62c2-10 10-16 19-16"/><path d="M26 50c-5-8-3-17 4-21 4 7 2 15-4 21z"/>'),
    'deco-leaf': G('<path d="M60 10c30 20 34 62 0 100-34-38-30-80 0-100z"/><path d="M60 18v88M60 40l-14-10M60 40l14-10M60 60l-18-12M60 60l18-12M60 80l-15-10M60 80l15-10"/>'),
    'empty-bag': A(60, 64, 42) + G('<path d="M28 44h64l-5 58a6 6 0 0 1-6 5H39a6 6 0 0 1-6-5z"/><path d="M44 52V36a16 16 0 0 1 32 0v16"/><path d="M48 76c4 6 20 6 24 0"/><path d="M98 26v10M93 31h10"/>'),
    /* trust seals */
    'seal-ayush': A(60, 62, 40) + G('<path d="M24 64h72c0 20-16 32-36 32S24 84 24 64z"/><path d="M44 96l-3 8h38l-3-8"/><path d="M60 64c-12-6-16-20-8-34 10 10 12 22 8 34zM60 64c8-10 22-12 32-4-10 8-22 8-32 4z"/>'),
    'seal-cruelty': A(60, 66, 40) + G('<circle cx="60" cy="76" r="20"/><path d="M50 58c-6-14-6-32 2-34s10 18 4 34M70 58c6-14 6-32-2-34s-10 18-4 34"/><path d="M57 82q3 3 6 0"/>') + '<g ' + DOT + '><circle cx="53" cy="74" r="2.6"/><circle cx="67" cy="74" r="2.6"/></g>',
    'seal-fda': A(60, 62, 40) + G('<path d="M60 18l34 12v28c0 22-14 36-34 44-20-8-34-22-34-44V30z"/><path d="M44 60l11 11 21-23"/>'),
    'seal-hand': A(60, 60, 40) + G('<path d="M60 58c0-17 12-29 29-31 0 17-12 29-29 31zM60 58l20-20"/><path d="M18 88l14-4c8-2 14 0 22 2 10 2 22-4 34-14 4-4 0-10-6-6l-14 10"/><path d="M18 78c10-2 16-6 24-6h18c5 0 6 7 0 8H50"/>'),
    'seal-gmp': A(60, 62, 40) + G('<path d="M60 16l10 8 13-2 4 12 11 7-4 12 4 12-11 7-4 12-13-2-10 8-10-8-13 2-4-12-11-7 4-12-4-12 11-7 4-12 13 2z"/><path d="M45 61l10 10 21-22"/>')
  };
  var sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">' +
    Object.keys(ICONS).map(function (k) { return '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + '</symbol>'; }).join('') +
    Object.keys(ILL).map(function (k) { return '<symbol id="' + k + '" viewBox="0 0 120 120">' + ILL[k] + '</symbol>'; }).join('') + '</svg>';
  document.body.insertAdjacentHTML('afterbegin', sprite);

  var icon = function (id, cls) { return '<svg class="ico ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
  var ill = function (id, cls, style) { return '<svg class="ill ' + (cls || '') + '" viewBox="0 0 120 120" aria-hidden="true"' + (style ? ' style="' + style + '"' : '') + '><use href="#' + id + '"/></svg>'; };
  var catIll = function (c, size) { return ill(c.ill, '', 'background:' + c.bg + ';color:' + c.fg + ';--ill-accent:' + (c.accent === c.bg ? 'transparent' : c.accent) + ';--ill-sw:' + (size || 3)); };
  var countIn = function (key) { return P.filter(function (p) { return p.c.indexOf(key) > -1; }).length; };

  /* ================================================================ chrome */
  var logo = function (light) {
    return '<a class="logo" href="index.html" aria-label="Chaudhary Nutrition home">' +
      '<img class="logo__mark" src="' + asset('assets/img/brand/mark' + (light ? '-light' : '') + '.png') + '" alt="" width="46" height="46">' +
      '<span class="logo__word"><span class="logo__name">Chaudhary<i>.</i></span><span class="logo__sub">Nutrition</span></span></a>';
  };
  var cur = function (p) { return page === p ? ' aria-current="page"' : ''; };

  var top = $('#cn-top');
  if (top) {
    var feat = (C.home.signature || []).map(function (id) { return byId.get(id); }).filter(Boolean).slice(0, 2);
    top.innerHTML =
      '<div class="announce" role="region" aria-label="Announcements"><div class="announce__track">' +
      C.announcements.concat(C.announcements[0]).map(function (a) { return '<p class="announce__item">' + icon('spark') + '<span>' + a + '</span></p>'; }).join('') +
      '</div></div>' +
      '<header class="hdr" id="hdr"><div class="wrap hdr__in">' +
        '<nav class="hdr__nav" aria-label="Primary">' +
          '<button class="hdr__link" type="button" aria-expanded="false" aria-controls="mega" id="megaBtn">Shop ' + icon('chev') + '</button>' +
          '<a class="hdr__link" href="finder.html"' + cur('finder') + '>Wellness Finder</a>' +
          '<a class="hdr__link" href="about.html"' + cur('about') + '>Our Story</a>' +
        '</nav>' +
        '<button class="icon-btn hdr__burger" type="button" aria-label="Open menu" data-open="mnav">' + icon('menu') + '</button>' +
        logo(false) +
        '<div class="hdr__act">' +
          '<nav class="hdr__nav" aria-label="Secondary" style="margin-right:14px">' +
            '<a class="hdr__link" href="salon.html"' + cur('salon') + '>Luxury Salon</a>' +
            '<a class="hdr__link" href="contact.html"' + cur('contact') + '>Contact</a>' +
          '</nav>' +
          '<button class="icon-btn" type="button" aria-label="Search" data-open="search">' + icon('search') + '</button>' +
          '<a class="icon-btn hide-sm" href="' + C.store + '/account" aria-label="Account">' + icon('user') + '</a>' +
          '<button class="icon-btn" type="button" aria-label="Open bag" data-open="cart">' + icon('bag') + '<span class="cart-dot" id="cartDot">0</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="mega" id="mega"><div class="wrap mega__in">' +
        '<div><p class="eyebrow" style="margin-bottom:18px">Shop by concern</p><div class="mega__cats">' +
          C.categories.map(function (c) { return '<a class="mega__cat" href="shop.html?c=' + c.key + '">' + catIll(c) + '<span><b>' + esc(c.name) + '</b><small>' + countIn(c.key) + ' formulas</small></span></a>'; }).join('') +
          '<a class="mega__cat" href="shop.html?kits=1">' + ill('cat-kits', '', 'background:#F7E2E3;color:#990D35;--ill-sw:3') + '<span><b>Kits &amp; Combos</b><small>' + P.filter(function (p) { return p.k; }).length + ' bundles</small></span></a>' +
          '<a class="mega__cat" href="shop.html">' + ill('deco-leaf', '', 'background:#0E103D;color:#EBA6A9;--ill-sw:3') + '<span><b>Shop everything</b><small>' + P.length + ' formulas</small></span></a>' +
        '</div></div>' +
        '<a class="mega__promo" href="finder.html"><div><p class="eyebrow" style="color:#EBA6A9">Wellness Finder</p><h3 style="margin-top:14px">Not sure where to <em>begin?</em></h3></div><span class="btn btn--rose btn--sm" style="align-self:flex-start">Take the 60-sec quiz ' + icon('arrow', 'ico--arrow') + '</span>' + ill('deco-mortar') + '</a>' +
        feat.map(function (p) { return '<div class="mega__feature"><p class="eyebrow">Signature formula</p>' + card(p, { noReveal: true }) + '</div>'; }).join('') +
      '</div></div>' +
      '</header>';
  }

  var foot = $('#cn-foot');
  if (foot) {
    foot.innerHTML =
      '<footer class="ftr on-dark">' +
      '<div class="wrap">' +
        '<div class="ftr__top">' +
          '<div><p class="ftr__quote">If you are <span>healthy</span>, you are beautiful.</p><p class="ftr__hindi" lang="hi">सेहत ही सुंदरता है — Annu Chaudhary</p></div>' +
          '<div class="ftr__cta"><p>Questions about a formula, dosage or your order? Our team replies on WhatsApp, 7 days a week.</p>' +
            '<a class="btn btn--rose" href="' + wa('Hi Chaudhary Nutrition! I have a question.') + '" target="_blank" rel="noopener">' + icon('wa') + ' Chat on WhatsApp</a></div>' +
        '</div>' +
        '<div class="ftr__cols">' +
          '<div class="ftr__brand">' + logo(true) + '<p>Expert diet and nutrition guidance, 100% herbal supplements and personalised wellness plans — founded by nutritionist Annu Chaudhary.</p>' +
            '<div class="ftr__social"><a href="' + C.instagram + '" target="_blank" rel="noopener" aria-label="Instagram">' + icon('insta') + '</a><a href="' + wa() + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icon('wa') + '</a><a href="mailto:' + C.email + '" aria-label="Email">' + icon('mail') + '</a></div></div>' +
          '<div><h4>Shop</h4><ul>' + C.categories.map(function (c) { return '<li><a href="shop.html?c=' + c.key + '">' + esc(c.name) + '</a></li>'; }).join('') + '<li><a href="shop.html?kits=1">Kits &amp; Combos</a></li></ul></div>' +
          '<div><h4>Explore</h4><ul><li><a href="finder.html">Wellness Finder</a></li><li><a href="about.html">Our Story</a></li><li><a href="salon.html">Luxury Salon</a></li><li><a href="certificates.html">Certificates</a></li><li><a href="contact.html">Contact</a></li>' +
            C.policies.map(function (x) { return '<li><a href="' + C.store + x[1] + '">' + x[0] + '</a></li>'; }).join('') + '</ul></div>' +
          '<div><h4>Visit the store</h4><address>' +
            '<a href="' + C.mapLink + '" target="_blank" rel="noopener">' + icon('pin') + '<span>' + C.address.join('<br>') + '</span></a>' +
            '<a href="tel:' + C.phone.replace(/\s/g, '') + '">' + icon('phone') + C.phone + '</a>' +
            '<a href="mailto:' + C.email + '">' + icon('mail') + C.email + '</a>' +
            '<span>' + icon('clock') + C.hours + '</span></address></div>' +
        '</div>' +
      '</div>' +
      '<p class="ftr__giant" aria-hidden="true">Chaudhary</p>' +
      '<div class="wrap ftr__bottom"><span>© ' + new Date().getFullYear() + ' Chaudhary Nutrition · Prices in INR, inclusive of taxes</span><span>Secure checkout · All payment options</span></div>' +
      '</footer>';
  }

  /* overlays: mobile nav, cart, search, scrim, toast, floating buttons */
  document.body.insertAdjacentHTML('beforeend',
    '<div class="scrim" id="scrim"></div>' +
    '<aside class="drawer drawer--left" id="mnav" aria-label="Menu" aria-hidden="true">' +
      '<div class="drawer__head">' + logo(false) + '<button class="icon-btn" type="button" aria-label="Close menu" data-close>' + icon('close') + '</button></div>' +
      '<div class="drawer__body"><nav class="mnav__cats">' +
        C.categories.map(function (c) { return '<a href="shop.html?c=' + c.key + '">' + catIll(c) + esc(c.name) + '<small>' + countIn(c.key) + '</small></a>'; }).join('') +
        '<a href="shop.html?kits=1">' + ill('cat-kits', '', 'background:#F7E2E3;color:#990D35;--ill-sw:3') + 'Kits &amp; Combos</a>' +
      '</nav><nav class="mnav__links">' +
        [['shop.html', 'Shop everything'], ['finder.html', 'Wellness Finder'], ['about.html', 'Our Story'], ['salon.html', 'Luxury Salon'], ['certificates.html', 'Certificates'], ['contact.html', 'Contact'], [C.store + '/account', 'My account']]
          .map(function (l) { return '<a href="' + l[0] + '">' + l[1] + icon('arrow-ur') + '</a>'; }).join('') +
      '</nav></div>' +
      '<div class="drawer__foot"><a class="btn btn--claret btn--block" href="' + wa('Hi Chaudhary Nutrition!') + '" target="_blank" rel="noopener">' + icon('wa') + ' WhatsApp ' + C.phone + '</a></div>' +
    '</aside>' +
    '<aside class="drawer drawer--right" id="cart" aria-label="Shopping bag" aria-hidden="true">' +
      '<div class="drawer__head"><h2>Your bag <small id="cartCount"></small></h2><button class="icon-btn" type="button" aria-label="Close bag" data-close>' + icon('close') + '</button></div>' +
      '<div class="drawer__body" id="cartBody"></div>' +
      '<div class="drawer__foot" id="cartFoot"></div>' +
    '</aside>' +
    '<div class="search" id="search" role="dialog" aria-modal="true" aria-label="Search products" aria-hidden="true"><div class="wrap search__in">' +
      '<div class="search__bar">' + icon('search') + '<input id="q" type="search" placeholder="Search formulas, herbs, concerns…" autocomplete="off" aria-label="Search"><button class="icon-btn" type="button" aria-label="Close search" data-close>' + icon('close') + '</button></div>' +
      '<div class="search__pop"><span class="eyebrow eyebrow--plain" style="margin-right:6px">Popular</span>' +
        ['PCOS', 'Weight loss', 'Vitamin C', 'Hair fall', 'Shilajit', 'Baby', 'Liver', 'Sunscreen'].map(function (t) { return '<button class="tag" type="button" data-q="' + t + '">' + t + '</button>'; }).join('') + '</div>' +
      '<div class="search__res" id="sres"></div><div class="search__more" id="smore"></div>' +
    '</div></div>' +
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>' +
    '<a class="fab-wa" href="' + wa('Hi Chaudhary Nutrition!') + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">' + icon('wa') + '</a>' +
    '<div class="fbar" id="fbar">' + ill('deco-mortar') + '<p>Not sure where to start? <b>Take the 60-second Wellness Finder</b></p>' +
      '<a class="btn btn--rose btn--sm" href="finder.html">Start ' + icon('arrow', 'ico--arrow') + '</a>' +
      '<button class="fbar__x" type="button" aria-label="Dismiss">' + icon('close') + '</button></div>'
  );

  /* ================================================================ cards */
  function priceHtml(p) {
    return '<span class="' + (p.m > p.p ? 'is-sale' : '') + '">' + fmt(p.p) + '</span>' + (p.m > p.p ? '<s>' + fmt(p.m) + '</s>' : '');
  }
  function badge(p) {
    var o = off(p);
    if (o >= 5) return '<span class="pcard__tag pcard__tag--sale">−' + o + '%</span>';
    if (isNew(p)) return '<span class="pcard__tag pcard__tag--new">New</span>';
    if (p.k) return '<span class="pcard__tag">Kit</span>';
    return '';
  }
  function card(p, opt) {
    opt = opt || {};
    var c = catOf(p.c[0]);
    var href = 'product.html?p=' + p.id;
    var alt = esc(p.n + (p.s ? ' — ' + p.s : ''));
    return '<article class="pcard' + (opt.noReveal ? '' : ' rv') + '"' + (opt.delay ? ' style="--d:' + opt.delay + 's"' : '') + '>' +
      '<div class="pcard__media"><a href="' + href + '" tabindex="-1" aria-hidden="true">' +
        '<img src="' + img(p, 1) + '" alt="' + alt + '" loading="lazy" decoding="async" width="600" height="600">' +
        (p.i > 1 ? '<img class="alt" src="' + img(p, 2) + '" alt="" loading="lazy" decoding="async" width="600" height="600">' : '') +
      '</a><span class="pcard__no">' + num(p) + '</span>' + badge(p) +
      '<button class="pcard__add" type="button" data-add="' + p.id + '" aria-label="Add ' + esc(p.n) + ' to bag">' + icon('plus') + '<span>Add to bag</span></button></div>' +
      '<div class="pcard__body"><span class="pcard__brand">' + esc(p.b || (c ? c.name : '')) + '</span>' +
        '<a class="pcard__title" href="' + href + '"><b>' + esc(p.n) + '</b>' + (p.s ? ' — ' + esc(p.s) : '') + (p.z ? ' <span class="pcard__size">' + esc(p.z) + '</span>' : '') + '</a>' +
        '<div class="pcard__price">' + priceHtml(p) + '</div></div>' +
      '</article>';
  }
  function kitCard(p) {
    return '<a class="kit" href="product.html?p=' + p.id + '">' +
      '<div class="kit__media"><img src="' + img(p, 1) + '" alt="' + esc(p.n) + '" loading="lazy" decoding="async"></div>' +
      '<div class="kit__body"><span class="pcard__brand">' + (p.c.map(function (k) { var c = catOf(k); return c ? c.short : ''; }).join(' · ')) + '</span>' +
      '<b class="kit__name">' + esc(p.n) + '</b>' + (p.s ? '<span class="kit__inc">' + esc(p.s) + '</span>' : '') +
      '<div class="kit__foot"><span class="pcard__price">' + priceHtml(p) + '</span>' + (p.m > p.p ? '<span class="kit__save">Save ' + fmt(p.m - p.p) + '</span>' : '') + '</div></div></a>';
  }

  /* ================================================================ cart */
  var Cart = {
    key: 'cn-bag-v1', items: [],
    load: function () {
      try { this.items = JSON.parse(localStorage.getItem(this.key)) || []; } catch (e) { this.items = []; }
      this.items = this.items.filter(function (i) { return byId.has(i.id) && i.q > 0; });
    },
    save: function () { try { localStorage.setItem(this.key, JSON.stringify(this.items)); } catch (e) { } this.render(); },
    find: function (id) { return this.items.find(function (i) { return i.id === id; }); },
    add: function (id, q) {
      var p = byId.get(id); if (!p) return;
      var it = this.find(id); q = q || 1;
      if (it) it.q = Math.min(20, it.q + q); else this.items.push({ id: id, q: q });
      this.save();
      var dot = $('#cartDot'); if (dot) { dot.classList.remove('bump'); void dot.offsetWidth; dot.classList.add('bump'); }
      toast('<img src="' + img(p, 1) + '" alt=""><span><b>Added</b> · ' + esc(p.n) + '</span>');
    },
    set: function (id, q) { var it = this.find(id); if (!it) return; it.q = Math.max(0, Math.min(20, q)); if (!it.q) this.remove(id); else this.save(); },
    remove: function (id) { this.items = this.items.filter(function (i) { return i.id !== id; }); this.save(); },
    count: function () { return this.items.reduce(function (s, i) { return s + i.q; }, 0); },
    total: function () { return this.items.reduce(function (s, i) { return s + byId.get(i.id).p * i.q; }, 0); },
    mrp: function () { return this.items.reduce(function (s, i) { var p = byId.get(i.id); return s + (p.m || p.p) * i.q; }, 0); },
    checkout: function (items) {
      items = items || this.items;
      return C.store + '/cart/' + items.map(function (i) { return byId.get(i.id).v + ':' + i.q; }).join(',');
    },
    whatsapp: function (items) {
      items = items || this.items;
      var lines = items.map(function (i) { var p = byId.get(i.id); return '• ' + p.n + (p.z ? ' (' + p.z + ')' : '') + ' × ' + i.q + ' — ' + fmt(p.p * i.q); });
      var total = items.reduce(function (s, i) { return s + byId.get(i.id).p * i.q; }, 0);
      return wa('Hi Chaudhary Nutrition! I would like to order:\n' + lines.join('\n') + '\n\nTotal: ' + fmt(total) + '\n\nName:\nDelivery address:');
    },
    render: function () {
      var n = this.count();
      var dot = $('#cartDot'); if (dot) { dot.textContent = n; dot.classList.toggle('is-on', n > 0); }
      var body = $('#cartBody'), footEl = $('#cartFoot'), cnt = $('#cartCount');
      if (!body) return;
      cnt.textContent = n ? n + (n === 1 ? ' item' : ' items') : '';
      if (!n) {
        body.innerHTML = '<div class="cart-empty">' + ill('empty-bag') + '<b class="h3">Your bag is empty</b><p class="muted">Find the right formula for you in under a minute.</p>' +
          '<a class="btn btn--claret" href="finder.html">Take the Wellness Finder ' + icon('arrow', 'ico--arrow') + '</a><a class="ulink" href="shop.html">Browse all formulas</a></div>';
        footEl.hidden = true; return;
      }
      footEl.hidden = false;
      body.innerHTML = this.items.map(function (i) {
        var p = byId.get(i.id);
        return '<div class="citem"><a class="citem__img" href="product.html?p=' + p.id + '"><img src="' + img(p, 1) + '" alt=""></a>' +
          '<div><a class="citem__name" href="product.html?p=' + p.id + '">' + esc(p.n) + '</a><span class="citem__meta">' + esc([p.z, p.b].filter(Boolean).join(' · ') || num(p)) + '</span>' +
          '<div class="citem__row"><div class="qty"><button type="button" aria-label="Decrease" data-dec="' + p.id + '">' + icon('minus') + '</button><output>' + i.q + '</output><button type="button" aria-label="Increase" data-inc="' + p.id + '">' + icon('plus') + '</button></div>' +
          '<button class="citem__rm" type="button" data-rm="' + p.id + '">Remove</button></div></div>' +
          '<div class="citem__price">' + fmt(p.p * i.q) + (p.m > p.p ? '<s>' + fmt(p.m * i.q) + '</s>' : '') + '</div></div>';
      }).join('');
      var save = this.mrp() - this.total();
      footEl.innerHTML = (save > 0 ? '<div class="cart-save"><span>You save</span><span>' + fmt(save) + '</span></div>' : '') +
        '<div class="cart-total"><span>Subtotal</span><span>' + fmt(this.total()) + '</span></div>' +
        '<p class="cart-note">Shipping &amp; offers (like Baby Care 50% off) are applied at secure checkout.</p>' +
        '<a class="btn btn--claret btn--block" href="' + this.checkout() + '">' + icon('lock') + ' Checkout securely</a>' +
        '<a class="btn btn--wa btn--block" href="' + this.whatsapp() + '" target="_blank" rel="noopener">' + icon('wa') + ' Order on WhatsApp</a>';
    }
  };

  /* ================================================================ overlays */
  var openEl = null;
  function open(id) {
    close(true);
    var el = document.getElementById(id); if (!el) return;
    openEl = el; el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    $('#scrim').classList.add('is-on'); document.documentElement.style.overflow = 'hidden';
    if (id === 'search') setTimeout(function () { $('#q').focus(); }, 80);
    else { var f = el.querySelector('button, a'); if (f) setTimeout(function () { f.focus(); }, 60); }
    if (id === 'cart') Cart.render();
  }
  function close(silent) {
    if (!openEl) return;
    openEl.classList.remove('is-open'); openEl.setAttribute('aria-hidden', 'true'); openEl = null;
    $('#scrim').classList.remove('is-on'); document.documentElement.style.overflow = '';
  }
  var toastT;
  function toast(html) {
    var t = $('#toast'); if (!t) return;
    t.innerHTML = html; t.classList.add('is-on'); clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('is-on'); }, 2400);
  }

  /* ================================================================ search */
  var SYN = { pcos: 'pcod', pcod: 'pcos', bp: 'blood pressure', sugar: 'diab', diabetes: 'sugar', slim: 'weight', fat: 'weight', hairfall: 'hair fall', glow: 'bright', acne: 'pore', smoking: 'quit', alcohol: 'nasha', periods: 'women', kids: 'baby', child: 'baby' };
  function search(q, limit) {
    var toks = q.toLowerCase().replace(/[^a-z0-9+\s]/g, ' ').split(/\s+/).filter(Boolean);
    if (!toks.length) return [];
    var out = [];
    P.forEach(function (p) {
      var name = p.n.toLowerCase(), hay = (p.n + ' ' + p.s + ' ' + p.b + ' ' + p.q + ' ' + p.c.map(function (k) { return catOf(k).name; }).join(' ')).toLowerCase();
      var score = 0;
      for (var i = 0; i < toks.length; i++) {
        var t = toks[i], alt = SYN[t];
        var hit = hay.indexOf(t) > -1 || (alt && hay.indexOf(alt) > -1);
        if (!hit) return;
        score += name.indexOf(t) === 0 ? 10 : name.indexOf(t) > -1 ? 6 : p.s.toLowerCase().indexOf(t) > -1 ? 3 : 1;
      }
      out.push([score, p]);
    });
    out.sort(function (a, b) { return b[0] - a[0] || a[1].o - b[1].o; });
    return out.slice(0, limit || 999).map(function (x) { return x[1]; });
  }
  function renderSearch() {
    var q = $('#q').value.trim(), res = $('#sres'), more = $('#smore');
    if (!q) { res.innerHTML = ''; more.innerHTML = ''; return; }
    var all = search(q), r = all.slice(0, 8);
    res.innerHTML = r.length ? r.map(function (p) {
      return '<a class="sres" href="product.html?p=' + p.id + '"><img src="' + img(p, 1) + '" alt=""><span><b>' + esc(p.n) + '</b><span>' + fmt(p.p) + (p.z ? ' · ' + esc(p.z) : '') + '</span></span></a>';
    }).join('') : '<p class="muted">No formulas match “' + esc(q) + '”. Try a herb (“shatavari”) or a concern (“liver”).</p>';
    more.innerHTML = all.length > 8 ? '<a class="ulink" href="shop.html?q=' + encodeURIComponent(q) + '">See all ' + all.length + ' results ' + icon('arrow-ur') + '</a>' : '';
  }

  /* ================================================================ motion */
  function split(el) {
    if (el.getAttribute('data-split-done')) return;
    el.setAttribute('data-split-done', '1');
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var s = document.createElement('span'); s.style.setProperty('--i', i++); s.textContent = part;
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    })(el);
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 }) : null;
  function reveal(scope) {
    $$('[data-split]', scope).forEach(split);
    $$('.rv, [data-split]', scope).forEach(function (el) { if (io) io.observe(el); else el.classList.add('is-in'); });
  }
  function rails(scope) {
    $$('.rail-wrap', scope).forEach(function (w) {
      if (w.getAttribute('data-ready')) return; w.setAttribute('data-ready', '1');
      var r = $('.rail', w), prev = $('[data-prev]', w), next = $('[data-next]', w), bar = $('.rail-progress i', w);
      var upd = function () {
        var max = r.scrollWidth - r.clientWidth;
        if (prev) prev.disabled = r.scrollLeft < 8;
        if (next) next.disabled = r.scrollLeft > max - 8;
        if (bar) { var vis = r.clientWidth / r.scrollWidth; bar.style.width = (vis * 100) + '%'; bar.style.transform = 'translateX(' + (max > 0 ? (r.scrollLeft / max) * ((1 - vis) / vis) * 100 : 0) + '%)'; }
      };
      if (prev) prev.addEventListener('click', function () { r.scrollBy({ left: -r.clientWidth * .8, behavior: 'smooth' }); });
      if (next) next.addEventListener('click', function () { r.scrollBy({ left: r.clientWidth * .8, behavior: 'smooth' }); });
      r.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
    });
  }
  function beforeAfter(scope) {
    $$('.ba', scope).forEach(function (ba) {
      var inp = $('input', ba);
      var set = function () { ba.style.setProperty('--pos', inp.value + '%'); };
      inp.addEventListener('input', set); set();
    });
  }

  /* ================================================================ events */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open],[data-close],[data-add],[data-inc],[data-dec],[data-rm],[data-q],#scrim,.fbar__x');
    if (!t) {
      if (megaOpen && !e.target.closest('#mega,#megaBtn')) setMega(false);
      return;
    }
    if (t.hasAttribute('data-open')) { e.preventDefault(); setMega(false); open(t.getAttribute('data-open')); }
    else if (t.hasAttribute('data-close') || t.id === 'scrim') close();
    else if (t.hasAttribute('data-add')) { e.preventDefault(); Cart.add(t.getAttribute('data-add'), 1); }
    else if (t.hasAttribute('data-inc')) { var a = Cart.find(t.getAttribute('data-inc')); Cart.set(a.id, a.q + 1); }
    else if (t.hasAttribute('data-dec')) { var b = Cart.find(t.getAttribute('data-dec')); Cart.set(b.id, b.q - 1); }
    else if (t.hasAttribute('data-rm')) Cart.remove(t.getAttribute('data-rm'));
    else if (t.hasAttribute('data-q')) { $('#q').value = t.getAttribute('data-q'); renderSearch(); }
    else if (t.classList.contains('fbar__x')) { fbarDismissed = true; $('#fbar').classList.remove('is-on'); document.body.classList.remove('fbar-on'); try { sessionStorage.setItem('cn-fbar', 'x'); } catch (er) { } }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { close(); setMega(false); }
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); open('search'); }
  });
  var qInput = $('#q'), qT;
  if (qInput) {
    qInput.addEventListener('input', function () { clearTimeout(qT); qT = setTimeout(renderSearch, 90); });
    qInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' && qInput.value.trim()) go('shop.html?q=' + encodeURIComponent(qInput.value.trim())); });
  }

  /* mega menu: hover on desktop, click anywhere */
  var megaOpen = false, megaT;
  var megaBtn = $('#megaBtn'), mega = $('#mega');
  function setMega(on) {
    if (!mega) return; megaOpen = on;
    mega.classList.toggle('is-open', on); megaBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  if (megaBtn) {
    megaBtn.addEventListener('click', function () { setMega(!megaOpen); });
    [megaBtn, mega].forEach(function (el) {
      el.addEventListener('mouseenter', function () { if (matchMedia('(hover:hover)').matches) { clearTimeout(megaT); setMega(true); } });
      el.addEventListener('mouseleave', function () { if (matchMedia('(hover:hover)').matches) { megaT = setTimeout(function () { setMega(false); }, 220); } });
    });
  }

  /* header state, announcement ticker, finder bar */
  var hdr = $('#hdr'), fbar = $('#fbar'), fbarDismissed = false;
  try { if (sessionStorage.getItem('cn-fbar')) fbarDismissed = true; } catch (e) { }
  function onScroll() {
    var y = window.scrollY;
    if (hdr) hdr.classList.toggle('is-scrolled', y > 8);
    if (fbar) {
      var ok = !fbarDismissed && ['home', 'shop', 'product'].indexOf(pageNow()) > -1;
      var on = ok && y > window.innerHeight * 1.1 && (document.documentElement.scrollHeight - y - window.innerHeight) > 600;
      fbar.classList.toggle('is-on', on); document.body.classList.toggle('fbar-on', on);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var track = $('.announce__track');
  if (track && C.announcements.length > 1) {
    var ai = 0, n = C.announcements.length;
    setInterval(function () {
      ai++; track.style.transition = ''; track.style.transform = 'translateY(' + (-ai * 100 / (n + 1)) + '%)';
      if (ai === n) setTimeout(function () { track.style.transition = 'none'; track.style.transform = 'none'; ai = 0; }, 800);
    }, 4200);
  }

  Cart.load(); Cart.render();
  window.addEventListener('storage', function (e) { if (e.key === Cart.key) { Cart.load(); Cart.render(); } });
  window.addEventListener('load', function () { document.documentElement.classList.add('is-loaded'); });

  window.CN = {
    C: C, P: P, byId: byId, $: $, $$: $$, esc: esc, fmt: fmt, img: img, icon: icon, ill: ill, catIll: catIll, catOf: catOf,
    num: num, off: off, isNew: isNew, wa: wa, card: card, kitCard: kitCard, priceHtml: priceHtml, Cart: Cart, search: search,
    reveal: reveal, rails: rails, beforeAfter: beforeAfter, toast: toast, open: open, close: close, setMega: setMega,
    countIn: countIn, asset: asset
  };
  // page scripts run after this file; shared bits on static pages get wired up here
  document.addEventListener('DOMContentLoaded', function () { reveal(document); rails(document); beforeAfter(document); });
})();
