/* Wellness Finder: who -> concerns -> format -> shortlist. Matching runs on product names,
   subtitles and store tags; it suggests, it doesn't diagnose. */
(function () {
  var N = window.CN, P = N.P, $ = N.$, esc = N.esc;

  var WHO = [
    { k: 'woman', label: 'For me — woman', sub: 'Skin, hair, hormones & everyday health', ill: 'cat-women', allow: ['skin', 'hair', 'women', 'health', 'weight', 'nutrition'], deny: ['men', 'baby'] },
    { k: 'man', label: 'For me — man', sub: 'Vitality, skin, hair & everyday health', ill: 'cat-men', allow: ['skin', 'hair', 'men', 'health', 'weight', 'nutrition'], deny: ['women', 'baby'] },
    { k: 'baby', label: 'For my baby or child', sub: 'Gentle care, digestion & growth', ill: 'cat-baby', allow: ['baby'], deny: [] },
    { k: 'family', label: 'For the whole family', sub: 'Immunity, digestion & daily wellness', ill: 'cat-health', allow: ['health', 'nutrition', 'weight', 'skin', 'hair'], deny: ['women', 'men', 'baby'] }
  ];
  var CONCERNS = {
    glow:     { label: 'Glow & pigmentation', sub: 'Dark spots, tan, dullness', ill: 'ing-vitc', re: /glow|bright|pigment|de.?tan|tan removal|vitamin c|kojic|ubtan|radian|dark spot|whiten|haldi|moti|kumkur|gold/ },
    pores:    { label: 'Acne, pores & oil', sub: 'Open pores, blackheads', ill: 'ing-niacinamide', re: /pore|blackhead|acne|pimple|niacinamide|toner|face wash|cleanser|oil control/ },
    ageing:   { label: 'Fine lines & firmness', sub: 'Collagen, night care, eyes', ill: 'ing-moti', re: /collagen|botox|anti.?ag|wrinkle|firm|night cream|eye cream|under eye|night pack/ },
    sun:      { label: 'Sun protection', sub: 'Daily SPF for face & body', ill: 'cat-skin', re: /spf|sunscreen|sun defen/ },
    hair:     { label: 'Hair fall & dandruff', sub: 'Scalp, strength, growth', ill: 'cat-hair', re: /hair|dandruff|scalp|shampoo|conditioner|keshwash|grow veda|beard|eyebrow/ },
    wloss:    { label: 'Weight loss', sub: 'Metabolism & detox support', ill: 'cat-weight', re: /slim|weight loss|fat|fitroots|apple cider|metabolism|weight manag|belly/ },
    wgain:    { label: 'Healthy weight gain', sub: 'Protein & nourishment', ill: 'cat-nutrition', re: /weight gain|gain max|protein|peanut|athlete|prash/ },
    digest:   { label: 'Digestion & liver', sub: 'Gut, gas, liver, detox', ill: 'ing-triphala', re: /gut|digest|liver|detox|gas|triphala|panchgond|constipat|liv-21|pachan/ },
    pcos:     { label: 'PCOS, periods & hormones', sub: 'Cycle, discharge, thyroid', ill: 'ing-shatavari', re: /pcod|pcos|period|menstru|hormon|sukhi saheli|luco|leucorr|gyno rasa|ovacare|white discharge|thyroid|harmony/ },
    fertility:{ label: 'Fertility & pregnancy', sub: 'Conceiving, pregnancy, feeding', ill: 'cat-women', re: /fertil|conceiv|womb|pregnan|garbh|lactation|dugadh|postpartum|shatavari|sperm|kaunch/ },
    intimate: { label: 'Intimate care', sub: 'Hygiene, tone & comfort', ill: 'seal-hand', re: /intimate|feminine|vaginal|tight|femvera|femaura|v sensation|uraveda|private wash|breast|bust/ },
    stamina:  { label: 'Stamina & vitality', sub: 'Energy, strength, drive', ill: 'ing-shilajit', re: /stamina|vitality|testo|shakti|shilaj|vigor|veer pak|kida jadi|mantrix|maxtra|energy/ },
    stress:   { label: 'Stress, sleep & focus', sub: 'Calm mind, better rest', ill: 'ing-brahmi', re: /stress|anxiety|sleep|deprasol|brahmi|mind|mental|calm|migraine/ },
    heart:    { label: 'BP, sugar & cholesterol', sub: 'Everyday heart & blood health', ill: 'cat-health', re: /bp veda|blood pressure|sugar|diab|karela|cholesterol|blood purif|nirmal|dibacare/ },
    joints:   { label: 'Joints & pain', sub: 'Knees, back, neck, nerves', ill: 'deco-mortar', re: /pain|joint|cervical|nerve|arthritis|bone/ },
    immunity: { label: 'Immunity & breathing', sub: 'Cough, sinus, snoring', ill: 'ing-tulsi', re: /immun|tulsi|healixir|amla|lung|shwas|snore|sinus|najla|respirat|fever/ },
    quit:     { label: 'Quit smoking or alcohol', sub: 'Craving & withdrawal support', ill: 'deco-leaf', re: /nasha|quit|smok|addiction|dhumnaash|alcohol/ },
    kidney:   { label: 'Kidney, urinary & piles', sub: 'Stones, burning, piles', ill: 'ing-karela', re: /kidney|stone|pathri|urin|urinova|piles|hemorrh|hemmoroid|bawasir/ },
    bbath:    { label: 'Bath, skin & massage', sub: 'Washes, oils, rash care', ill: 'cat-baby', re: /wash|oil|cream|soap|diaper|calm/ },
    bhair:    { label: 'Hair & scalp', sub: 'Tear-free shampoo & conditioner', ill: 'cat-hair', re: /shampoo|conditioner|hair/ },
    bsun:     { label: 'Sun care', sub: 'Baby-safe SPF', ill: 'cat-skin', re: /spf|sun/ },
    bdigest:  { label: 'Digestion & appetite', sub: 'Gentle herbal support', ill: 'ing-triphala', re: /pachan|digest|appetite/ },
    bgrow:    { label: 'Growth, brain & speech', sub: 'Height, focus, nutrition', ill: 'cat-nutrition', re: /height|growth|grow|protein|mind boost|speech|brain/ }
  };
  var BY_WHO = {
    woman: ['glow', 'pores', 'ageing', 'sun', 'hair', 'wloss', 'wgain', 'digest', 'pcos', 'fertility', 'intimate', 'stress', 'heart', 'joints', 'immunity', 'kidney'],
    man: ['glow', 'pores', 'hair', 'stamina', 'wloss', 'wgain', 'digest', 'stress', 'heart', 'joints', 'immunity', 'quit', 'kidney'],
    baby: ['bbath', 'bhair', 'bsun', 'bdigest', 'bgrow'],
    family: ['immunity', 'digest', 'heart', 'joints', 'stress', 'wloss', 'wgain', 'kidney', 'quit']
  };
  var FORMAT = [
    { k: 'single', label: 'Single formulas', sub: 'Start simple, one at a time', ill: 'cat-skin' },
    { k: 'kit', label: 'Complete kits', sub: 'Bundled routines, better value', ill: 'cat-kits' },
    { k: 'any', label: 'Show me both', sub: 'Every match, best first', ill: 'deco-sprig' }
  ];

  var st = { step: 0, who: null, concerns: [], format: null };
  var root = $('#finder');

  function opt(o, pressed, attr) {
    return '<button class="opt" type="button" ' + attr + '="' + o.k + '" aria-pressed="' + pressed + '">' +
      '<span class="opt__check">' + N.icon('check') + '</span>' + N.ill(o.ill) +
      '<span><b>' + esc(o.label) + '</b><small>' + esc(o.sub) + '</small></span></button>';
  }
  function progress(n) { return '<div class="finder__progress" aria-hidden="true">' + [0, 1, 2, 3].map(function (i) { return '<i' + (i <= n ? ' class="on"' : '') + '></i>'; }).join('') + '</div>'; }

  function render() {
    var html = '';
    var head = function (q, hint, art) {
      return '<div class="finder__head"><div><h1 class="finder__q">' + q + '</h1><p class="finder__hint">' + hint + '</p></div>' +
        '<div class="finder__art" aria-hidden="true">' + N.ill(art) + '</div></div>';
    };
    if (st.step === 0) {
      html = progress(0) + head('Who is this <em>for?</em>', 'Step 1 of 3 — choose one.', 'deco-mortar') +
        '<div class="opts opts--big">' + WHO.map(function (w) { return opt(w, st.who === w.k, 'data-who'); }).join('') + '</div>';
    } else if (st.step === 1) {
      var keys = BY_WHO[st.who];
      html = progress(1) + head('What would you like <em>support with?</em>', 'Step 2 of 3 — pick up to three.', 'ing-tulsi') +
        '<div class="opts">' + keys.map(function (k) { var c = CONCERNS[k]; return opt({ k: k, label: c.label, sub: c.sub, ill: c.ill }, st.concerns.indexOf(k) > -1, 'data-con'); }).join('') + '</div>' +
        '<div class="finder__nav"><button class="btn btn--ghost" type="button" data-back>' + N.icon('arrow-l') + ' Back</button>' +
        '<button class="btn btn--claret" type="button" data-next' + (st.concerns.length ? '' : ' disabled') + '>Next ' + N.icon('arrow', 'ico--arrow') + '</button></div>';
    } else if (st.step === 2) {
      html = progress(2) + head('Single formulas <em>or complete kits?</em>', 'Step 3 of 3.', 'cat-kits') +
        '<div class="opts opts--big">' + FORMAT.map(function (f) { return opt(f, st.format === f.k, 'data-fmt'); }).join('') + '</div>' +
        '<div class="finder__nav"><button class="btn btn--ghost" type="button" data-back>' + N.icon('arrow-l') + ' Back</button></div>';
    } else {
      html = results();
    }
    root.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    N.reveal(root);
  }

  function results() {
    var who = WHO.find(function (w) { return w.k === st.who; });
    var picks = P.map(function (p) {
      if (who.deny.some(function (d) { return p.c.indexOf(d) > -1; })) return null;
      if (!who.allow.some(function (a) { return p.c.indexOf(a) > -1; })) return null;
      if (st.format === 'single' && p.k) return null;
      if (st.format === 'kit' && !p.k) return null;
      var hay = (p.n + ' ' + p.s + ' ' + p.q).toLowerCase();
      var hits = st.concerns.filter(function (k) { return CONCERNS[k].re.test(hay); });
      if (!hits.length) return null;
      var nameHits = st.concerns.filter(function (k) { return CONCERNS[k].re.test((p.n + ' ' + p.s).toLowerCase()); }).length;
      return { p: p, score: hits.length * 10 + nameHits * 4 + N.off(p) / 25 };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score || a.p.o - b.p.o; });

    var top = picks.slice(0, 12).map(function (x) { return x.p; });
    var labels = st.concerns.map(function (k) { return CONCERNS[k].label; });
    var msg = 'Hi! I used the Wellness Finder.\nFor: ' + who.label.replace('For me — ', '') + '\nLooking for help with: ' + labels.join(', ') + '\nCould you suggest the right formula and dosage for me?';
    return progress(3) +
      '<div class="result-head"><h1 class="finder__q">Your <em>shortlist</em></h1>' +
      '<div class="result-sum"><span>' + esc(who.label) + '</span>' + labels.map(function (l) { return '<span>' + esc(l) + '</span>'; }).join('') + '<span>' + esc(FORMAT.find(function (f) { return f.k === st.format; }).label) + '</span></div>' +
      '<p class="lead">' + (top.length ? picks.length + ' formula' + (picks.length > 1 ? 's' : '') + ' match — here are the best ' + top.length + '.' : 'No exact match for that combination yet — our team can still guide you.') + '</p></div>' +
      (top.length ? '<div class="pgrid">' + top.map(function (p, i) { return N.card(p, { delay: (i % 4) * 0.05 }); }).join('') + '</div>' : '') +
      '<div class="band on-dark" style="margin-top:clamp(40px,5vw,64px);text-align:left;padding:clamp(32px,4vw,56px)"><div class="band__inner" style="justify-items:start;margin:0;max-width:none">' +
        '<p class="eyebrow">Talk to a nutritionist</p><h2 class="h2">Get a plan <em>made for you</em></h2>' +
        '<p style="margin:0;max-width:56ch">Share your shortlist with our team on WhatsApp — Annu Chaudhary\'s team will help you choose, and explain how to take it.</p>' +
        '<div class="hero__cta"><a class="btn btn--rose" href="' + N.wa(msg) + '" target="_blank" rel="noopener">' + N.icon('wa') + ' Send my answers on WhatsApp</a>' +
        '<button class="btn btn--ghost" type="button" data-restart>Start again</button></div></div></div>' +
      '<p class="note" style="margin-top:20px">' + N.icon('info') + '<span>Suggestions are based on product descriptions and aren\'t a medical diagnosis. For ongoing conditions, pregnancy or if you take medication, please consult your doctor.</span></p>';
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-who')) { st.who = b.getAttribute('data-who'); st.concerns = []; st.step = 1; render(); }
    else if (b.hasAttribute('data-con')) {
      var k = b.getAttribute('data-con'), i = st.concerns.indexOf(k);
      if (i > -1) st.concerns.splice(i, 1); else if (st.concerns.length < 3) st.concerns.push(k);
      else { N.toast('Pick up to <b>three</b> concerns'); return; }
      N.$$('[data-con]', root).forEach(function (x) { x.setAttribute('aria-pressed', st.concerns.indexOf(x.getAttribute('data-con')) > -1 ? 'true' : 'false'); });
      $('[data-next]', root).disabled = !st.concerns.length;
    }
    else if (b.hasAttribute('data-fmt')) { st.format = b.getAttribute('data-fmt'); st.step = 3; render(); }
    else if (b.hasAttribute('data-next')) { st.step = 2; render(); }
    else if (b.hasAttribute('data-back')) { st.step = Math.max(0, st.step - 1); render(); }
    else if (b.hasAttribute('data-restart')) { st = { step: 0, who: null, concerns: [], format: null }; render(); }
  });
  render();
})();
