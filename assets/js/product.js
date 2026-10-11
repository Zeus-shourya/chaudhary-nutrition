/* Product page: gallery, buy box, description sections and related products. */
(function () {
  var N = window.CN, C = N.C, P = N.P, $ = N.$, esc = N.esc;
  var id = new URLSearchParams(window.CN_QS != null ? window.CN_QS : location.search).get('p');   // CN_QS: phone bundle router
  var p = N.byId.get(id);
  var pdp = $('#pdp');

  if (!p) {
    pdp.style.display = 'block';
    pdp.innerHTML = '<div class="empty">' + N.ill('deco-mortar') + '<h1 class="h2">Formula <em>not found</em></h1><p class="muted">It may have been renamed or retired.</p><a class="btn btn--navy" href="shop.html">Browse all formulas</a></div>';
    return;
  }

  var cat = N.catOf(p.c[0]);
  document.title = p.n + (p.s ? ' — ' + p.s : '') + ' | Chaudhary Nutrition';
  var md = document.querySelector('meta[name="description"]'); if (md) md.content = p.n + (p.s ? ' — ' + p.s : '') + '. ' + (cat ? cat.name : '') + ' by Chaudhary Nutrition.';

  $('#crumbs').innerHTML = '<a href="index.html">Home</a><span aria-hidden="true">/</span><a href="shop.html">Shop</a>' +
    (cat ? '<span aria-hidden="true">/</span><a href="shop.html?c=' + cat.key + '">' + esc(cat.name) + '</a>' : '') +
    '<span aria-hidden="true">/</span><span>' + esc(p.n) + '</span>';

  /* ---------- gallery */
  var imgs = []; for (var i = 1; i <= Math.max(1, p.i); i++) imgs.push(i);
  var gallery = '<div class="gallery' + (imgs.length < 2 ? ' gallery--single' : '') + '">' +
    (imgs.length > 1 ? '<div class="gallery__thumbs">' + imgs.map(function (n, k) {
      return '<button type="button" data-g="' + k + '" aria-label="Image ' + (k + 1) + '"' + (k ? '' : ' aria-current="true"') + '><img src="' + N.img(p, n, n > 2) + '" alt="" loading="lazy"></button>';
    }).join('') + '</div>' : '') +
    '<div class="gallery__main"><span class="gallery__no">' + N.num(p) + '</span>' +
      '<div class="gallery__track" id="gtrack">' + imgs.map(function (n, k) {
        return '<img src="' + N.img(p, n, true) + '" alt="' + esc(p.n) + (k ? ' — image ' + (k + 1) : '') + '"' + (k ? ' loading="lazy"' : ' fetchpriority="high"') + ' width="1000" height="1000">';
      }).join('') + '</div>' +
      (imgs.length > 1 ? '<div class="gallery__dots">' + imgs.map(function (n, k) { return '<i' + (k ? '' : ' class="on"') + '></i>'; }).join('') + '</div>' : '') +
    '</div></div>';

  /* ---------- buy box */
  var o = N.off(p);
  var info = '<div class="pdp__info">' +
    '<div class="pdp__meta"><span>' + N.num(p) + '</span>' + (cat ? '<a href="shop.html?c=' + cat.key + '">' + esc(cat.name) + '</a>' : '') + (p.b ? '<span>' + esc(p.b) + '</span>' : '') + (p.k ? '<span style="color:var(--claret)">Kit</span>' : '') + '</div>' +
    '<h1 class="pdp__title">' + esc(p.n) + '</h1>' +
    (p.s ? '<p class="pdp__sub">' + esc(p.s) + '</p>' : '') +
    (p.z ? '<span class="pdp__size">Size <b>' + esc(p.z) + '</b></span>' : '') +
    '<div class="pdp__price"><span class="now' + (o ? ' is-sale' : '') + '">' + N.fmt(p.p) + '</span>' +
      (o ? '<s>' + N.fmt(p.m) + '</s><span class="save">Save ' + N.fmt(p.m - p.p) + ' · ' + o + '%</span>' : '') +
      '<small>Inclusive of all taxes · shipping calculated at checkout</small></div>' +
    '<div class="pdp__buy">' +
      '<div class="qty qty--lg"><button type="button" aria-label="Decrease quantity" id="qMinus">' + N.icon('minus') + '</button><output id="qVal">1</output><button type="button" aria-label="Increase quantity" id="qPlus">' + N.icon('plus') + '</button></div>' +
      '<button class="btn btn--claret" type="button" id="addBtn">' + N.icon('bag') + ' Add to bag</button>' +
      '<a class="btn btn--navy btn--block" id="buyNow" href="#">' + N.icon('lock') + ' Buy it now</a>' +
      '<a class="btn btn--wa btn--block" id="waBuy" href="#" target="_blank" rel="noopener">' + N.icon('wa') + ' Order on WhatsApp</a>' +
    '</div>' +
    '<ul class="perks">' + C.why.map(function (w) { return '<li>' + N.icon(w[0]) + esc(w[1]) + '</li>'; }).join('') + '</ul>' +
    '<div id="details" style="display:grid;gap:22px"><p class="muted">Loading details…</p></div>' +
    '<p class="note">' + N.icon('info') + '<span>Herbal supplements support a healthy lifestyle and are not a substitute for medical treatment. If you are pregnant, nursing or on medication, consult your doctor first — or <a href="' + N.wa('Hi! I have a question about ' + p.n + '.') + '" target="_blank" rel="noopener" style="text-decoration:underline">ask our nutrition team</a>.</span></p>' +
  '</div>';
  pdp.innerHTML = gallery + info;

  /* ---------- quantity + buttons */
  var qty = 1;
  function setQty(v) {
    qty = Math.max(1, Math.min(20, v)); $('#qVal').textContent = qty;
    $('#buyNow').href = N.Cart.checkout([{ id: p.id, q: qty }]);
    $('#waBuy').href = N.Cart.whatsapp([{ id: p.id, q: qty }]);
  }
  $('#qMinus').onclick = function () { setQty(qty - 1); };
  $('#qPlus').onclick = function () { setQty(qty + 1); };
  $('#addBtn').onclick = function () { N.Cart.add(p.id, qty); };
  setQty(1);

  /* ---------- gallery behaviour */
  var track = $('#gtrack'), thumbs = N.$$('.gallery__thumbs button'), dots = N.$$('.gallery__dots i');
  thumbs.forEach(function (b) { b.onclick = function () { var k = +b.getAttribute('data-g'); track.scrollTo({ left: k * track.clientWidth, behavior: 'smooth' }); }; });
  track.addEventListener('scroll', function () {
    var k = Math.round(track.scrollLeft / track.clientWidth);
    thumbs.forEach(function (b, j) { b.setAttribute('aria-current', j === k ? 'true' : 'false'); });
    dots.forEach(function (d, j) { d.classList.toggle('on', j === k); });
  }, { passive: true });

  /* ---------- sticky buy bar (mobile) */
  var sb = $('#stickyBuy');
  sb.innerHTML = '<img src="' + N.img(p, 1) + '" alt=""><div><b>' + esc(p.n) + '</b><span>' + N.fmt(p.p) + '</span></div><button class="btn btn--claret btn--sm" type="button" data-add="' + p.id + '">Add to bag</button>';
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var on = !es[0].isIntersecting && es[0].boundingClientRect.top < 0;
      sb.classList.toggle('is-on', on); sb.setAttribute('aria-hidden', on ? 'false' : 'true');
    }).observe($('#addBtn'));
  }

  /* ---------- details */
  function para(t) {
    var m = t.match(/^([^:]{3,48}):\s+(.+)$/);
    return '<p>' + (m ? '<b>' + esc(m[1]) + ':</b> ' + esc(m[2]) : esc(t)) + '</p>';
  }
  function labelCard(items) {
    var rows = items.map(function (t) {
      var m = t.match(/^(.+?)\s*(?:[–—-]|:)\s*(\d[\d.,]*\s?(?:mg|g|gm|ml|mcg|%|iu|parts?|part)\b.*)$/i);
      return m ? '<div class="label-card__row"><span>' + esc(m[1]) + '</span><i></i><span>' + esc(m[2]) + '</span></div>' : null;
    });
    if (rows.filter(Boolean).length < Math.max(2, items.length * 0.6)) return null;
    return '<div class="label-card"><div class="label-card__head"><span>Composition</span><span>' + N.num(p) + '</span></div>' +
      items.map(function (t, k) { return rows[k] || '<div class="label-card__row"><span>' + esc(t) + '</span></div>'; }).join('') +
      '<div class="label-card__foot"><span>Chaudhary Nutrition</span><span>100% herbal</span></div></div>';
  }
  var ORDER = ['Benefits', 'How to use', 'Ingredients', "Who it's for", 'Highlights', 'Good to know'];
  var loadDetails = window.CN_LOAD_DETAILS || function (pid) {   // the phone bundle embeds these instead
    return fetch('assets/data/p/' + pid + '.json').then(function (r) { if (!r.ok) throw 0; return r.json(); });
  };
  loadDetails(p.id)
    .then(function (d) {
      var html = '';
      if (d.tagline && d.tagline.toLowerCase() !== p.n.toLowerCase()) html += '<p class="pdp__tagline">' + esc(d.tagline) + '</p>';
      if (d.intro && d.intro.length) html += '<div class="pdp__intro">' + d.intro.slice(0, 4).map(para).join('') + '</div>';
      var secs = (d.sec || []).slice().sort(function (a, b) {
        var ia = ORDER.indexOf(a.t), ib = ORDER.indexOf(b.t);
        return (ia < 0 ? 50 : ia) - (ib < 0 ? 50 : ib);
      });
      if (secs.length) {
        html += '<div class="acc">' + secs.map(function (s, k) {
          var body = '';
          if (/ingredient/i.test(s.t) && s.li.length) body = labelCard(s.li) || '';
          if (!body && s.li.length) body = '<ul>' + s.li.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
          body = s.p.map(para).join('') + body;
          return '<details' + (k === 0 ? ' open' : '') + '><summary>' + esc(s.t) + (s.li.length ? '<small>' + s.li.length + '</small>' : '') + N.icon('plus') + '</summary><div class="acc__body">' + body + '</div></details>';
        }).join('') + '</div>';
      }
      $('#details').innerHTML = html || '<p class="muted">Full details are on the way. Ask our team on WhatsApp for usage guidance.</p>';
    })
    .catch(function () { $('#details').innerHTML = ''; });

  /* ---------- related */
  var related = P.filter(function (x) { return x.id !== p.id && x.c.indexOf(p.c[0]) > -1; })
    .map(function (x) {
      var shared = x.c.filter(function (k) { return p.c.indexOf(k) > -1; }).length;
      return [shared * 10 - Math.abs(x.p - p.p) / 500 + (x.k === p.k ? 1 : 0), x];
    })
    .sort(function (a, b) { return b[0] - a[0]; }).slice(0, 4).map(function (x) { return x[1]; });
  if (related.length) {
    $('#relatedSec').hidden = false;
    $('#related').innerHTML = related.map(function (x, k) { return N.card(x, { delay: k * 0.06 }); }).join('');
    if (cat) $('#relatedAll').href = 'shop.html?c=' + cat.key;
  }
  N.reveal(document);
})();
