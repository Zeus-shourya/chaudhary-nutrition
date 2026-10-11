/* Home page: fills the curated sections from the catalog. */
(function () {
  var N = window.CN, C = N.C, P = N.P, $ = N.$;
  var pick = function (ids) { return ids.map(function (id) { return N.byId.get(id); }).filter(Boolean); };

  // live counts
  document.querySelectorAll('[data-count="products"]').forEach(function (el) { el.textContent = P.length; });

  // hero floating product card
  var hero = N.byId.get(C.home.signature[0]);
  if (hero) {
    var mini = $('#heroMini');
    mini.href = 'product.html?p=' + hero.id;
    mini.innerHTML = '<img src="' + N.img(hero, 1) + '" alt="">' +
      '<span><small>Signature formula</small><b>' + N.esc(hero.n) + '</b><span class="pcard__price">' + N.priceHtml(hero) + '</span></span>';
  }

  // marquees loop seamlessly when the track holds two copies
  document.querySelectorAll('.marquee__track').forEach(function (t) { t.innerHTML += t.innerHTML; });

  // concern tiles
  var tiles = C.categories.map(function (c, i) {
    var acc = c.accent === c.bg ? 'transparent' : c.accent + '44';   // 8-digit hex: accent at ~27%
    return '<a class="ctile" href="shop.html?c=' + c.key + '" style="--c-bg:' + c.bg + ';--c-fg:' + c.fg + ';--ill-accent:' + acc + '">' +
      '<div class="ctile__top"><span>' + String(i + 1).padStart(2, '0') + ' / ' + N.countIn(c.key) + ' formulas</span><span class="ctile__arrow">' + N.icon('arrow-ur') + '</span></div>' +
      N.ill(c.ill) +
      '<div><h3 class="ctile__name">' + N.esc(c.name) + '</h3><p class="ctile__blurb">' + N.esc(c.blurb) + '</p></div></a>';
  });
  tiles.push('<a class="ctile" href="shop.html?kits=1" style="--c-bg:#F7E2E3;--c-fg:#990D35;--ill-accent:#EBA6A955">' +
    '<div class="ctile__top"><span>09 / ' + P.filter(function (p) { return p.k; }).length + ' bundles</span><span class="ctile__arrow">' + N.icon('arrow-ur') + '</span></div>' +
    N.ill('cat-kits') + '<div><h3 class="ctile__name">Kits &amp; Combos</h3><p class="ctile__blurb">Complete routines, bundled for better value.</p></div></a>');
  $('#cats').innerHTML = tiles.join('');

  // signature grid
  $('#sig').innerHTML = pick(C.home.signature).map(function (p, i) { return N.card(p, { delay: (i % 4) * 0.07 }); }).join('');

  // baby offer
  $('#baby').innerHTML = pick(C.home.baby).map(function (p, i) { return N.card(p, { delay: (i % 2) * 0.07 }); }).join('');

  // new arrivals: newest first
  var fresh = P.slice().sort(function (a, b) { return b.d.localeCompare(a.d) || a.o - b.o; }).slice(0, 10);
  $('#new').innerHTML = fresh.map(function (p) { return N.card(p, { noReveal: true }); }).join('');

  // kits: biggest saving first, lifestyle photos lead
  var kits = P.filter(function (p) { return p.k; }).sort(function (a, b) { return (b.m - b.p) - (a.m - a.p) || (a.w[0] === '0' ? -1 : 1); }).slice(0, 12);
  $('#kits').innerHTML = kits.map(N.kitCard).join('');

  // ingredient library
  $('#ingr').innerHTML = C.ingredients.map(function (g, i) {
    var re = new RegExp(g.q, 'i');
    var n = P.filter(function (p) { return re.test(p.n + ' ' + p.s + ' ' + p.q); }).length;
    var q = g.q.split('|')[0];
    return '<article class="ingr rv" style="--d:' + (i % 4) * 0.06 + 's">' +
      '<a class="cover" href="shop.html?q=' + encodeURIComponent(q) + '" aria-label="Shop formulas with ' + N.esc(g.name) + '"></a>' +
      '<span class="ingr__no">' + String(i + 1).padStart(2, '0') + '</span>' + N.ill(g.ill) +
      '<h3 class="ingr__name">' + N.esc(g.name) + '</h3><span class="ingr__latin">' + N.esc(g.latin) + '</span>' +
      '<p>' + N.esc(g.text) + '</p>' +
      '<span class="ingr__link"><span>' + (n ? '<span class="hide-sm">Found in</span> <small>' + n + ' formula' + (n > 1 ? 's' : '') + '</small>' : 'Explore') + '</span>' + N.icon('arrow') + '</span></article>';
  }).join('');

  // why choose
  $('#why').innerHTML = C.why.map(function (w, i) {
    return '<div class="why__item rv" style="--d:' + i * 0.07 + 's"><span class="why__icon">' + N.icon(w[0]) + '</span><b>' + N.esc(w[1]) + '</b><p>' + N.esc(w[2]) + '</p></div>';
  }).join('');

  // trust seals with ring text
  $('#seals').innerHTML = C.seals.map(function (s, i) {
    var id = 'sr' + i;
    return '<div class="seal rv" style="--d:' + i * 0.06 + 's"><div class="seal__disc">' +
      '<svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="' + id + '" d="M60,60 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0"/></defs>' +
      '<circle cx="60" cy="60" r="59" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="60" cy="60" r="41.5" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3"/>' +
      '<text style="font:500 8.4px \'DM Mono\',monospace;letter-spacing:.18em;fill:currentColor"><textPath href="#' + id + '" textLength="312" lengthAdjust="spacing">' + N.esc(s[1].toUpperCase()) + ' • CHAUDHARY NUTRITION • </textPath></text></svg>' +
      N.ill(s[0]) + '</div><span>' + N.esc(s[1]) + '</span></div>';
  }).join('');

  // community mosaic: lifestyle shots link to their products
  var gram = P.filter(function (p) { return p.w && p.w[0] === '0' && !p.n.match(/peanut/i); }).slice(0, 6);
  $('#gram').innerHTML = gram.map(function (p) {
    return '<a href="product.html?p=' + p.id + '"><img src="' + N.img(p, 1) + '" alt="' + N.esc(p.n) + '" loading="lazy"></a>';
  }).join('');
  $('#instaBtn').href = C.instagram;
  $('#consult').href = N.wa('Hi! I would like to book a nutrition consultation with Annu Chaudhary.');

  N.reveal(document); N.rails(document);
})();
