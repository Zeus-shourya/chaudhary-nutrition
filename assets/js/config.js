/* Store settings for the Chaudhary Nutrition redesign.
   Business details are taken from chaudharynutrition.com (contact page, footer, about page). */
window.CN_CONFIG = {
  store: 'https://chaudharynutrition.com',          // live Shopify store: checkout + policy pages
  phone: '+91 95885 09279',
  whatsapp: '919588509279',
  email: 'chaudharynutrition1@gmail.com',
  instagram: 'https://www.instagram.com/chaudharynutrition_official',
  instagramHandle: '@chaudharynutrition_official',
  address: ['Basement & Ground Floor, District One, DSS 16', 'Sector 68, Sahibzada Ajit Singh Nagar (Mohali)', 'Punjab 160062'],
  hours: 'Mon – Sun · 10 am – 8 pm',
  mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3431.3611527516746!2d76.72234069999999!3d30.680113199999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390fef826853dd2d%3A0x97279c2b5b456b2!2sChaudhary%20Nutrition!5e0!3m2!1sen!2sin!4v1751197932230!5m2!1sen!2sin',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=Chaudhary+Nutrition+Sector+68+Mohali',
  imgVersion: 5,

  announcements: [
    'Baby Care — <b>flat 50% off</b>, applied automatically at checkout',
    'Not sure where to start? <b>Take the 60-second Wellness Finder</b>',
    '100% herbal formulas · <b>all payment options</b> at checkout'
  ],

  policies: [
    ['Shipping policy', '/policies/shipping-policy'],
    ['Refund policy', '/policies/refund-policy'],
    ['Privacy policy', '/policies/privacy-policy'],
    ['Terms of service', '/policies/terms-of-service']
  ],

  /* Categories: order = menu order. bg/fg/accent drive the illustrated tiles. */
  categories: [
    { key: 'skin',      name: 'Skin Care',        short: 'Skin',      ill: 'cat-skin',      bg: '#EBA6A9', fg: '#0E103D', accent: '#F8FFF4', blurb: 'Serums, face washes, sunscreens and Korean-inspired glow rituals.' },
    { key: 'hair',      name: 'Hair Care',        short: 'Hair',      ill: 'cat-hair',      bg: '#0E103D', fg: '#F8FFF4', accent: '#990D35', blurb: 'Herbal shampoos, scalp oils and protein care for stronger hair.' },
    { key: 'women',     name: "Women's Health",   short: 'Women',     ill: 'cat-women',     bg: '#F6E1E2', fg: '#990D35', accent: '#EBA6A9', blurb: 'PCOS/PCOD, cycle, fertility, pregnancy and intimate care.' },
    { key: 'men',       name: "Men's Vitality",   short: 'Men',       ill: 'cat-men',       bg: '#990D35', fg: '#F8FFF4', accent: '#0E103D', blurb: 'Strength, stamina and everyday vitality, the Ayurvedic way.' },
    { key: 'baby',      name: 'Baby & Kids',      short: 'Baby',      ill: 'cat-baby',      bg: '#E7F2E0', fg: '#0E103D', accent: '#EBA6A9', blurb: 'Gentle, tear-free care for little ones — and their growth.' },
    { key: 'health',    name: 'Health Care',      short: 'Health',    ill: 'cat-health',    bg: '#F8FFF4', fg: '#0E103D', accent: '#EBA6A9', blurb: 'BP, sugar, liver, joints, sleep, immunity and more.' },
    { key: 'weight',    name: 'Weight Balance',   short: 'Weight',    ill: 'cat-weight',    bg: '#EBA6A9', fg: '#990D35', accent: '#F8FFF4', blurb: 'Teas, powders and detox support for a healthy metabolism.' },
    { key: 'nutrition', name: 'Nutrition & Fit',  short: 'Nutrition', ill: 'cat-nutrition', bg: '#0E103D', fg: '#EBA6A9', accent: '#990D35', blurb: 'Protein, peanut butter, chai and shakers for daily fuel.' }
  ],

  /* Home page curation (catalog ids). Anything missing from the catalog is skipped. */
  home: {
    signature: [
      'bp-veda-blood-pressure-solution',
      'ovacare-balance-pcos-pcod-powder',
      'de-pigmentation-cream-advanced-formula-with-kojic-acid',
      'moti-bhasam-face-glow-night-serum',
      'slim-veda-chai-weight-loss-tea',
      'liver-detox-syrup',
      'pure-baby-calm-oil-soft-skin-and-better-sleep',
      'korean-kit-korean-touch-serum-plus-korean-touch-night'
    ],
    baby: [
      'baby-care-set-pure-baby-calm-oil-little-cloud-baby',
      'baby-care-kit-pure-baby-calm-oil-baby-soft-foaming-wash',
      'baby-spf-sun-defense-spf-50-plus-pa-plus-plus-plus-plus',
      'pure-baby-calm-oil-soft-skin-and-better-sleep'
    ]
  },

  /* The Ingredient Library. 'q' is matched against product names, subtitles and tags. */
  ingredients: [
    { name: 'Ashwagandha', latin: 'Withania somnifera',   ill: 'ing-ashwagandha', q: 'ashwagandha',       text: "Ayurveda's best-known rasayana, traditionally taken for strength, stamina and a calm mind." },
    { name: 'Shatavari',   latin: 'Asparagus racemosus',  ill: 'ing-shatavari',   q: 'shatavari',         text: '"She who has a hundred roots" — the classic Ayurvedic herb for women\'s wellness.' },
    { name: 'Brahmi',      latin: 'Bacopa monnieri',      ill: 'ing-brahmi',      q: 'brahmi',            text: 'A small-leaved creeper long used in Ayurveda for memory, focus and calm.' },
    { name: 'Tulsi',       latin: 'Ocimum sanctum',       ill: 'ing-tulsi',       q: 'tulsi',             text: 'Holy basil — grown in Indian homes for generations, traditionally used for immunity.' },
    { name: 'Triphala',    latin: 'Three fruits',         ill: 'ing-triphala',    q: 'triphala',          text: 'Amalaki, Bibhitaki and Haritaki: the classic three-fruit blend for digestion.' },
    { name: 'Shilajit',    latin: 'Asphaltum punjabianum', ill: 'ing-shilajit',   q: 'shilajit|shilajeet', text: 'A mineral-rich resin from Himalayan rock, prized in Ayurveda for vitality.' },
    { name: 'Amla',        latin: 'Emblica officinalis',  ill: 'ing-amla',        q: 'amla',              text: 'Indian gooseberry — one of nature\'s richest sources of vitamin C.' },
    { name: 'Karela',      latin: 'Momordica charantia',  ill: 'ing-karela',      q: 'karela',            text: 'Bitter gourd, used in Indian kitchens and Ayurveda to support healthy sugar levels.' },
    { name: 'Moti Bhasma', latin: 'Calcined pearl',       ill: 'ing-moti',        q: 'moti',              text: 'An Ayurvedic pearl preparation, valued for its cooling, brightening touch on skin.' },
    { name: 'Haldi',       latin: 'Curcuma longa',        ill: 'ing-haldi',       q: 'haldi|turmeric|ubtan', text: 'Turmeric — the golden root of every Indian ubtan, loved for a natural glow.' },
    { name: 'Vitamin C',   latin: 'Ascorbic acid',        ill: 'ing-vitc',        q: 'vitamin c',         text: 'The brightening antioxidant behind our glow serums, oils and moisturisers.' },
    { name: 'Niacinamide', latin: 'Vitamin B3',           ill: 'ing-niacinamide', q: 'niacinamide',       text: 'A skin-barrier favourite that refines the look of pores and evens tone.' }
  ],

  /* "Why choose" points and trust badges, as listed on the current site */
  why: [
    ['leaf', '100% Herbal & Safe Ingredients', 'Plant-led formulas with every herb named on the label.'],
    ['flask', 'Scientifically Researched Formulas', 'Traditional Ayurveda, checked against modern nutrition science.'],
    ['globe', 'Trusted by Clients Worldwide', 'Guided by Annu Chaudhary for 50,000+ clients across the globe.'],
    ['card', 'Easy Ordering | All Payment Options', 'UPI, cards, netbanking and wallets at secure checkout.']
  ],
  seals: [
    ['seal-ayush', 'Ministry of Ayush'],
    ['seal-cruelty', 'Cruelty Free'],
    ['seal-fda', 'USFDA Approved'],
    ['seal-hand', 'Handpicked Ingredients'],
    ['seal-gmp', 'GMP Certified Manufacturing']
  ]
};
