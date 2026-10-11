/* Shop: category chips, search, toggles, sort and paging, all reflected in the URL. */
(function () {
  var N = window.CN, C = N.C, P = N.P, $ = N.$;
  var PAGE = 24;
  var params = new URLSearchParams(window.CN_QS != null ? window.CN_QS : location.search);   // CN_QS: phone bundle router
  var state = {
    c: params.get('c') || '',
    q: params.get('q') || '',
    kits: params.get('kits') === '1',
    sale: params.get('sale') === '1',
    sort: params.get('sort') || 'featured',
    n: PAGE
  };
  if (state.c && !N.catOf(state.c)) state.c = '';
  var sigRank = {}; (C.home.signature || []).forEach(function (id, i) { sigRank[id] = i + 1; });

  // chips
  $('#chips').innerHTML = '<button class="chip-f chip-f--all" type="button" data-c="">All <small>' + P.length + '</small></button>' +
    C.categories.map(function (c) {
      return '<button class="chip-f" type="button" data-c="' + c.key + '">' + N.catIll(c) + N.esc(c.short) + ' <small>' + N.countIn(c.key) + '</small></button>';
    }).join('');

  var qEl = $('#shopQ'), kEl = $('#fKits'), sEl = $('#fSale'), sortEl = $('#sort');
  qEl.value = state.q; kEl.checked = state.kits; sEl.checked = state.sale; sortEl.value = state.sort;

  function list() {
    var items = state.q ? N.search(state.q) : P.slice();
    items = items.filter(function (p) {
      if (state.c && p.c.indexOf(state.c) < 0) return false;
      if (state.kits && !p.k) return false;
      if (state.sale && !(p.m > p.p)) return false;
      return true;
    });
    var by = {
      featured: function (a, b) { return state.q ? 0 : ((sigRank[a.id] || 99) - (sigRank[b.id] || 99)) || a.o - b.o; },
      new: function (a, b) { return b.d.localeCompare(a.d) || a.o - b.o; },
      low: function (a, b) { return a.p - b.p; },
      high: function (a, b) { return b.p - a.p; },
      save: function (a, b) { return N.off(b) - N.off(a) || (b.m - b.p) - (a.m - a.p); },
      az: function (a, b) { return a.n.localeCompare(b.n); }
    }[state.sort] || null;
    if (by) items.sort(by);
    return items;
  }

  function head() {
    var cat = N.catOf(state.c);
    var title, blurb, art;
    if (state.q) {
      title = 'Results for <em>“' + N.esc(state.q) + '”</em>';
      blurb = 'Searching names, ingredients and concerns' + (cat ? ' in ' + N.esc(cat.name) : '') + '.';
    } else if (cat) {
      var w = cat.name.split(' '); var last = w.pop();
      title = N.esc(w.join(' ')) + (w.length ? ' ' : '') + '<em>' + N.esc(last) + '</em>';
      blurb = N.esc(cat.blurb);
    } else if (state.kits) {
      title = 'Kits &amp; <em>combos</em>'; blurb = 'Complete routines, bundled and priced below buying each formula on its own.';
    } else {
      title = 'The <em>shop</em>'; blurb = 'Every formula, every herb named on the label. Filter by concern, or search for an ingredient you trust.';
    }
    $('#shopTitle').innerHTML = title; $('#shopBlurb').innerHTML = blurb;
    art = cat ? cat : (state.kits ? { ill: 'cat-kits', bg: '#F7E2E3', fg: '#990D35', accent: '#EBA6A9' } : { ill: 'deco-mortar', bg: '#0E103D', fg: '#EBA6A9', accent: '#990D35' });
    $('#shopArt').innerHTML = N.ill(art.ill, '', 'background:' + art.bg + ';color:' + art.fg + ';--ill-accent:' + (art.accent === art.bg ? 'transparent' : art.accent + '44') + ';--ill-sw:2');
    $('#crumb').textContent = cat ? cat.name : state.kits ? 'Kits & Combos' : state.q ? 'Search' : '';
    $('#crumbSep').hidden = !$('#crumb').textContent;
    document.title = (cat ? cat.name : state.kits ? 'Kits & Combos' : state.q ? 'Search: ' + state.q : 'Shop all formulas') + ' — Chaudhary Nutrition';
    N.$$('#chips .chip-f').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-c') === state.c ? 'true' : 'false'); });
  }

  function render(keepScroll) {
    head();
    var items = list(), shown = items.slice(0, state.n);
    $('#shopCount').textContent = items.length + (items.length === 1 ? ' formula' : ' formulas');
    if (!items.length) {
      $('#grid').innerHTML = '';
      $('#more').innerHTML = '<div class="empty">' + N.ill('deco-mortar') + '<b class="h3">Nothing matches just yet</b><p class="muted">Try another herb or concern — or let the Wellness Finder suggest a formula.</p>' +
        '<div class="hero__cta" style="justify-content:center"><button class="btn btn--navy" type="button" id="clearAll">Clear filters</button><a class="btn btn--ghost" href="finder.html">Wellness Finder</a></div></div>';
      $('#clearAll').onclick = function () { state.c = ''; state.q = ''; state.kits = false; state.sale = false; qEl.value = ''; kEl.checked = sEl.checked = false; update(); };
      return;
    }
    $('#grid').innerHTML = shown.map(function (p, i) { return N.card(p, { delay: (i % 4) * 0.05 }); }).join('');
    $('#more').innerHTML = items.length > shown.length
      ? '<small>Showing ' + shown.length + ' of ' + items.length + '</small><button class="btn btn--ghost" type="button" id="loadMore">Load more formulas</button>'
      : '<small>Showing all ' + items.length + '</small>';
    var lm = $('#loadMore'); if (lm) lm.onclick = function () { state.n += PAGE; render(true); };
    N.reveal($('#grid'));
  }

  function update() {
    state.n = PAGE;
    var u = new URLSearchParams();
    if (state.c) u.set('c', state.c);
    if (state.q) u.set('q', state.q);
    if (state.kits) u.set('kits', '1');
    if (state.sale) u.set('sale', '1');
    if (state.sort !== 'featured') u.set('sort', state.sort);
    var qs = u.toString() ? '?' + u : '';
    if (window.CN_SET_QS) window.CN_SET_QS('shop', qs); else history.replaceState(null, '', 'shop.html' + qs);
    render();
  }

  $('#chips').addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (!b) return; state.c = b.getAttribute('data-c'); update(); });
  var t; qEl.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { state.q = qEl.value.trim(); update(); }, 160); });
  kEl.addEventListener('change', function () { state.kits = kEl.checked; update(); });
  sEl.addEventListener('change', function () { state.sale = sEl.checked; update(); });
  sortEl.addEventListener('change', function () { state.sort = sortEl.value; update(); });

  render();
  var active = $('#chips [aria-pressed="true"]'); if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', inline: 'center' });
})();
