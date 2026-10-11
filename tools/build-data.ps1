<#
  Pulls the live catalogue from the Shopify store and writes the static data
  the redesign runs on:

    assets/js/catalog.js        light product list (cards, filters, search)
    assets/data/p/<id>.json     per-product details (description sections)
    tools/.cache/manifest.json  image URLs for process-images.ps1

  Re-run any time prices or products change on the store:

      powershell -ExecutionPolicy Bypass -File tools\build-data.ps1
      powershell -ExecutionPolicy Bypass -File tools\process-images.ps1
      powershell -ExecutionPolicy Bypass -File tools\build-data.ps1 -NoFetch

  (the second run merges the image metadata produced by process-images)
#>
param([string]$Store = 'https://chaudharynutrition.com', [switch]$NoFetch)

$ErrorActionPreference = 'Stop'
$root  = Split-Path $PSScriptRoot -Parent
$cache = Join-Path $PSScriptRoot '.cache'
New-Item -ItemType Directory -Force $cache | Out-Null
New-Item -ItemType Directory -Force (Join-Path $root 'assets\data\p') | Out-Null

Add-Type -AssemblyName System.Web.Extensions
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = [int]::MaxValue
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Fetch([string]$url, [string]$file) {
  if ($NoFetch -and (Test-Path $file)) { return }
  & curl.exe -sL -A 'Mozilla/5.0' $url -o $file
  if ($LASTEXITCODE -ne 0) { throw "download failed: $url" }
}
function ReadJson([string]$file) { $ser.DeserializeObject([System.IO.File]::ReadAllText($file, $utf8)) }

# ---------------------------------------------------------------- fetch
$products = New-Object System.Collections.ArrayList
for ($page = 1; $page -le 10; $page++) {
  $f = Join-Path $cache "products-$page.json"
  Fetch "$Store/products.json?limit=250&page=$page" $f
  $batch = (ReadJson $f)['products']
  if (-not $batch -or $batch.Count -eq 0) { break }
  [void]$products.AddRange($batch)
  if ($batch.Count -lt 250) { break }
}
Write-Host "products: $($products.Count)"

$collections = 'baby-care','baby-collection','kits','gynae-health','hair-care','health-care',
               'infertility-men-women','skin-care','weight-loss','serums','facewash','piles',
               'ortho','dental','sexual'
$member = @{}
foreach ($c in $collections) {
  $f = Join-Path $cache "c-$c.json"
  Fetch "$Store/collections/$c/products.json?limit=250" $f
  foreach ($p in (ReadJson $f)['products']) {
    if (-not $member.ContainsKey($p['handle'])) { $member[$p['handle']] = New-Object System.Collections.ArrayList }
    [void]$member[$p['handle']].Add($c)
  }
}

# ---------------------------------------------------------------- text helpers
function StripEmoji([string]$s) {
  $s = [regex]::Replace($s, '[\uD800-\uDBFF][\uDC00-\uDFFF]', '')
  [regex]::Replace($s, '[\u2190-\u21FF\u2300-\u23FF\u25A0-\u27BF\u2B00-\u2BFF\uFE0F\u200D\u20E3]', '')
}
function Clean([string]$s) {
  if (-not $s) { return '' }
  $s = $s -replace '(?i)<br\s*/?>', ' '
  $s = $s -replace '<[^>]+>', ''
  $s = [System.Net.WebUtility]::HtmlDecode($s)
  $s = StripEmoji $s
  $s = $s -replace '[\u00A0\s]+', ' '
  $s.Trim(' ', '|', '-', [char]0x2013, ':', ',')
}
$acronyms = @('SPF','PCOS','PCOD','UVA','UVB','ACV','BP','KB','K&B','UV','PA','24K','HD','AHA','BHA','DHA')
function TitleFix([string]$s) {
  [regex]::Replace($s, '\b[A-Z][A-Z&]{3,}\b', [System.Text.RegularExpressions.MatchEvaluator]{
    param($m)
    if ($acronyms -contains $m.Value) { $m.Value } else { $m.Value.Substring(0,1) + $m.Value.Substring(1).ToLower() }
  })
}
function Slug([string]$s) {
  $s = $s.ToLower() -replace '&', ' and ' -replace '\+', ' plus '
  $s = [regex]::Replace($s, '[^a-z0-9]+', '-').Trim('-')
  if ($s.Length -gt 56) { $s = $s.Substring(0, 56); $i = $s.LastIndexOf('-'); if ($i -gt 30) { $s = $s.Substring(0, $i) } }
  $s.Trim('-')
}

$brandRules = @(
  @('^(KB\s+)?Kabira\s+Skincare\s*[\u2013-]?\s*', 'Kabira Skincare'),
  @('^KB\s+Skincare\s*[\u2013-]?\s*',             'Kabira Skincare'),
  @('^K&B\s+',                                     'Kabira Skincare'),
  @('^KB\s+(?=\w)',                                'Kabira Skincare'),
  @('^Derma\s+Radiant\s+',                         'Derma Radiant'),
  @('^Derma\s+(?!Veda)(?=\w)',                     'Derma Radiant'),
  @('^Herbalysis\s+',                              'Herbalysis'),
  @('^100 Years of Ayurveda\s*[\u2013-]\s*',       '100 Years of Ayurveda')
)

function ParseTitle([string]$title, [string]$tags) {
  $t = Clean $title
  $brand = ''
  foreach ($r in $brandRules) {
    if ($t -match "(?i)$($r[0])") { $brand = $r[1]; $t = [regex]::Replace($t, "(?i)$($r[0])", ''); break }
  }
  if (-not $brand -and $tags -match '(?i)100 years of ayurveda') { $brand = '100 Years of Ayurveda' }

  $size = ''
  $m = [regex]::Match($t, '\(?\b(\d+(?:\.\d+)?)\s?(ml|gms?|g|kg|capsules|tablets)\b\)?', 'IgnoreCase')
  if ($m.Success) {
    $unit = $m.Groups[2].Value.ToLower() -replace '^gms?$', 'g'
    $size = $m.Groups[1].Value + $(if ($unit -in 'capsules','tablets') { " $unit" } else { $unit })
    $t = $t.Remove($m.Index, $m.Length)
  }
  $t = ($t -replace '\(\s*\)', '' -replace '\s+', ' ' -replace '\s+([,|])', '$1').Trim(' ', '-', [char]0x2013, '|')

  $parts = [regex]::Split($t, '\s+[|\u2013\u2014]\s*|\s*\|\s+|\s+-\s+|:\s+', 2)
  $name = $parts[0].Trim()
  $sub  = if ($parts.Count -gt 1) { $parts[1] } else { '' }

  if (-not $sub) {
    $pm = [regex]::Match($name, '^(.{3,}?)\s*\(([^)]{4,})\)\s*$')
    if ($pm.Success) { $name = $pm.Groups[1].Value; $sub = $pm.Groups[2].Value }
  }
  # long single-product names: "Triphala Pure Capsule to Improve Digestion" -> name + sub.
  # Never split a "+" combo, and never start the sub with "&" (the [A-Za-z] guard) - either
  # would orphan the second product's name.
  if (-not $sub -and $name.Length -gt 32 -and $name -notmatch '\s\+\s') {
    $sm = [regex]::Match($name, '^(.{8,}?\b(?:Capsules?|Powder|Oil|Syrup|Cream|Serum|Wash|Shampoo|Gel|Drops|Tea|Juice|Balm|Lotion|Soap|Toner|Scrub|Spray|Kit|Combo))\s+([A-Za-z].{7,})$')
    if ($sm.Success) { $name = $sm.Groups[1].Value; $sub = $sm.Groups[2].Value }
  }
  $sub = ($sub -split '\s*\|\s*')[0]
  $sub = ($sub -replace '\s+', ' ' -replace '^\((.*)\)$', '$1').Trim(' ', '-', [char]0x2013, ',', '.')
  if ($sub.Length -gt 140) { $sub = $sub.Substring(0, 140); $sub = $sub.Substring(0, $sub.LastIndexOf(' ')).TrimEnd(',', ' ', '&') + [char]0x2026 }
  $name = (TitleFix $name).Trim(' ', '-', [char]0x2013, ',')
  if ($sub) { $sub = TitleFix $sub; $sub = $sub.Substring(0,1).ToUpper() + $sub.Substring(1) }
  [ordered]@{ name = $name; sub = $sub; brand = $brand; size = $size }
}

# ---------------------------------------------------------------- categories
$catRules = [ordered]@{
  nutrition = '\bpeanut butter|shaker|athlete|stamina max protein|masala (luxury )?chai|collagen vital prash'
  baby      = '\bbaby\b|\bkids?\b|kid.s|child|shishu|diaper|baalpachan|speech development|little cloud|softlocks|gentle roots|height'
  hair      = 'shampoo|conditioner|hair (serum|protein|root|care trio|growth)|\bbeard|eyebrow|dandruff|keshwash|grow veda|\bscalp|safed break'
  men       = 'testo|shakti vardhak|mantrix|maxtra|kaunch|\bmale\b|\bmen.s\b|\bmen\b|sperm|veer pak|vigor herb|kida jadi|gyno knott drops|himalayan pure shilajit'
  women     = 'wom[ae]n|feminine|\bfem|gyno rasa|gynocare|ovacare|pcod|pcos|sukhi saheli|luco|shatavari|conceiva|garbh|pregnan|dugadh|lactation|postpartum|shaktidhara|leucorrh|tight ?nyra|v sensation|uraveda|breast|bust|overcare|womb|shilaje?e?t shakti'
  weight    = '\bslim|\bweight|fitroots|apple cider|gain max|triphala|panchgond|gut health churna|fat loss'
  skin      = '\bface|serum|cream|sunscreen|\bspf\b|toner|scrub|ubtan|de.?tan|pigment|\bglow|lip (tint|care|balm)|\blip\b|soap|body (wash|lotion|oil)|\bskin\b|collagen|korean|underarm|roll on|hair removal|\bheel|elbow|knee|eye cream|moisturi|\bgel\b|chander kanti|kumkura|derma veda|glow dhara|glow pure|hand wash|night pack|botox|stretch mark|black ?head'
  health    = '.'
}
$healthHints = '\bbp\b|blood|liver|sugar|diab|karela|cholesterol|thyroid|kidney|stone|pathri|urinova|piles|hemorrh|hemmoroid|bawasir|\bpain\b|pain mukt|joint|cervical|migraine|immun|tulsi|healixir|\bamla|\bshwas|lung|snore|najla|sinus|deprasol|anxiety|stress|mind ease|brahmi|mental|nasha|quit|dhumnaash|addiction|smok|netra|dental|teeth|\bgas\b|\bgut\b|digest|nirmal|rasayan|detox'
# store collections that reliably mean one of our categories (others are too mixed to trust)
$collCats = @{ 'baby-care'='baby'; 'baby-collection'='baby'; 'hair-care'='hair'; 'skin-care'='skin'; 'serums'='skin';
               'facewash'='skin'; 'kits'='skin'; 'gynae-health'='women'; 'health-care'='health'; 'piles'='health';
               'ortho'='health'; 'dental'='health' }
# hand overrides for products whose copy reads ambiguously
$catOverride = @{ 'mind-ease-lotion-herbal-relaxation-and-stress-relief' = @('health'); 'gyno-knott-drops' = @('men'); 'pure-amla-capsules-rich-in-vitamin-c' = @('health','hair') }

function Categorise([string]$hay, $colls) {
  # "for men & women" means unisex - don't let it tag both genders
  $g = [regex]::Replace($hay, '(wo)?men\s*(&|and|,|/|or)?\s*(wo)?men\b', ' ')
  $cats = New-Object System.Collections.ArrayList
  foreach ($k in $catRules.Keys) {
    if ($k -eq 'health') { continue }
    $src = if ($k -in 'men','women') { $g } else { $hay }
    if ($src -match $catRules[$k]) { [void]$cats.Add($k) }
  }
  foreach ($c in $colls) { if ($collCats.ContainsKey($c) -and -not ($cats -contains $collCats[$c])) { [void]$cats.Add($collCats[$c]) } }
  # a kids shampoo is baby care, not hair care; a pregnancy kit is women's health
  if ($cats -contains 'baby') { foreach ($x in @('hair','skin')) { $cats.Remove($x) } }
  if ($hay -match 'garbh|pregnan|dugadh|lactation|postpartum') { $cats.Remove('baby') }
  if ($hay -match 'shilaje?e?t shakti|women power' -and $cats -contains 'men') { $cats.Remove('men') }
  if ($cats -contains 'nutrition') { foreach ($x in @('skin','hair')) { $cats.Remove($x) } }
  if ($cats -contains 'hair' -and $hay -match 'hair removal') { $cats.Remove('hair') }
  if ($cats -contains 'hair') { $cats.Remove('skin') }
  if ($cats -contains 'women' -and $cats -contains 'skin' -and $hay -match 'intimate|tight|breast|bust|feminine|uraveda|femaura') { $cats.Remove('skin') }
  if ($cats -contains 'men' -and $cats -contains 'skin') { $cats.Remove('skin') }
  if ($cats -contains 'weight' -and $cats -contains 'skin' -and $hay -notmatch '\bface|serum|cream|scrub') { $cats.Remove('skin') }
  # things you swallow aren't skin care, whatever their tags promise about glow
  if ($cats -contains 'skin' -and $hay -match 'capsule|tablet|syrup|churna|juice|vinegar') { $cats.Remove('skin') }
  $onlyBody = @($cats | Where-Object { $_ -notin 'women','men','weight' }).Count -eq 0
  if ($onlyBody -and $hay -match $healthHints -and -not ($cats -contains 'health')) { [void]$cats.Add('health') }
  if ($cats.Count -eq 0) { [void]$cats.Add('health') }
  # health is the catch-all: keep it last so a product's primary category is the specific one
  if ($cats.Count -gt 1 -and $cats[0] -eq 'health') { $cats.RemoveAt(0); [void]$cats.Add('health') }
  $cats.ToArray()
}

# ---------------------------------------------------------------- description -> sections
$canon = @(
  @('benefit|why (you.ll love|choose)|advantages|what it does', 'Benefits'),
  @('how to use|directions|usage|dosage|how to apply|method of use', 'How to use'),
  @('ingredient|composition|formula(tion)?\b|what.s inside|made with', 'Ingredients'),
  @('suitable for|who (can|should) use|ideal for|best for', 'Who it''s for'),
  @('precaution|caution|warning|safety|note', 'Good to know'),
  @('feature|highlights|key (points|features)', 'Highlights')
)
function CanonTitle([string]$t) {
  foreach ($c in $canon) { if ($t -match "(?i)$($c[0])") { return $c[1] } }
  $t
}
function Sections([string]$html, [string]$name) {
  $html = [regex]::Replace($html, '(?s)<!--.*?-->|<style.*?</style>|<script.*?</script>', '')
  $tokens = [regex]::Matches($html, '(?is)<(h[1-6]|p|li|tr)\b[^>]*>(.*?)</\1>')
  $intro = New-Object System.Collections.ArrayList
  $secs  = New-Object System.Collections.ArrayList
  $cur = $null; $tagline = ''
  foreach ($tk in $tokens) {
    $tag = $tk.Groups[1].Value.ToLower()
    $inner = $tk.Groups[2].Value
    if ($tag -eq 'tr') {
      $cells = [regex]::Matches($inner, '(?is)<t[dh]\b[^>]*>(.*?)</t[dh]>') | ForEach-Object { Clean $_.Groups[1].Value } | Where-Object { $_ }
      $txt = ($cells -join ' : ')
      $tag = 'li'
    } else { $txt = Clean $inner }
    if (-not $txt) { continue }
    # Headings arrive three ways: real <h*> tags, a <p> that is wholly bold, or a short
    # plain <p> ending in ":" / naming a known section ("Directions for Use").
    $plain = $txt.Length -lt 48 -and $txt -notmatch '\.$'
    $endsColon = $inner -match ':\s*(</[^>]+>\s*)*$'
    $bold = [regex]::Match($inner, '(?is)^\s*(?:<span[^>]*>\s*)*<(strong|b)\b[^>]*>(.*?)</\1>')
    $allBold = $bold.Success -and (Clean $bold.Groups[2].Value) -eq $txt
    $named = $txt.Length -lt 40 -and $txt -match '(?i)^(key )?(benefits?|directions?|how to|ingredients?|usage|features?|suitable|precautions?|caution|why choose|composition)'
    $isHead = $tag -match '^h' -or ($tag -eq 'p' -and $plain -and ($endsColon -or $allBold -or $named))
    $isFirst = -not $cur -and $intro.Count -eq 0 -and $secs.Count -eq 0 -and -not $tagline
    if ($isFirst -and $tag -eq 'p' -and -not $isHead -and $txt.Length -lt 90 -and $txt -notmatch '[.!?]$') { $tagline = $txt; continue }
    if ($isHead) {
      $title = $txt.TrimEnd(':').Trim()
      if ($isFirst -and $tag -match '^h' -and $title -notmatch '(?i)benefit|ingredient|how to|feature') { $tagline = $title; continue }
      $cur = [ordered]@{ t = (CanonTitle $title); p = (New-Object System.Collections.ArrayList); li = (New-Object System.Collections.ArrayList) }
      [void]$secs.Add($cur)
      continue
    }
    if ($tag -eq 'li') {
      if (-not $cur) { $cur = [ordered]@{ t = 'Highlights'; p = (New-Object System.Collections.ArrayList); li = (New-Object System.Collections.ArrayList) }; [void]$secs.Add($cur) }
      [void]$cur.li.Add($txt)
    } else {
      if ($cur) { [void]$cur.p.Add($txt) } else { [void]$intro.Add($txt) }
    }
  }
  if ($tokens.Count -eq 0) {
    foreach ($line in ($html -split '(?i)<br\s*/?>|\n')) { $c = Clean $line; if ($c) { [void]$intro.Add($c) } }
  }
  # drop empty sections, merge duplicates by title
  $merged = [ordered]@{}
  foreach ($s in $secs) {
    if ($s.p.Count -eq 0 -and $s.li.Count -eq 0) { continue }
    if ($merged.Contains($s.t)) { $merged[$s.t].p.AddRange($s.p); $merged[$s.t].li.AddRange($s.li) }
    else { $merged[$s.t] = $s }
  }
  $out = @($merged.Values | ForEach-Object { [ordered]@{ t = $_.t; p = @($_.p.ToArray()); li = @($_.li.ToArray()) } })
  [ordered]@{ tagline = $tagline; intro = @($intro.ToArray()); sec = $out }
}

# ---------------------------------------------------------------- build
$imgMetaFile = Join-Path $cache 'imgmeta.json'
$imgMeta = if (Test-Path $imgMetaFile) { ReadJson $imgMetaFile } else { @{} }

$seen = @{}
$catalog = New-Object System.Collections.ArrayList
$manifest = New-Object System.Collections.ArrayList
$order = 0
foreach ($p in $products) {
  $v = $p['variants'][0]
  $price = [double]$v['price']
  if ($price -le 0) { continue }                     # free-gift clones
  $tagsArr = @($p['tags'])
  $tags = ($tagsArr -join ', ')
  $parsed = ParseTitle $p['title'] $tags
  $id = Slug ($parsed.name + ' ' + $parsed.sub)
  if ($id.Length -lt 4) { $id = Slug $p['handle'] }
  $base = $id; $n = 2
  while ($seen.ContainsKey($id)) { $id = "$base-$n"; $n++ }
  $seen[$id] = 1

  $colls = if ($member.ContainsKey($p['handle'])) { @($member[$p['handle']]) } else { @() }
  $hay = ((Clean $p['title']) + ' ' + $tags + ' ' + $p['product_type']).ToLower()
  # @() keeps a one-category result an array (PowerShell would otherwise unroll it to a string)
  $cats = @(if ($catOverride.ContainsKey($id)) { $catOverride[$id] } else { Categorise $hay $colls })
  $kitHay = (Clean $p['title']).ToLower() -replace 'uva\s*\+\s*uvb', ''
  # a name that is itself a list ("Churna, Chai, Vinegar, ...") is a bundle too
  $isKit = [int]([bool]($kitHay -match '\bcombo\b|\bkit\b|\bset\b|\btrio\b|\bduo\b|\s\+\s' -or $colls -contains 'kits' -or ($parsed.name -split ',').Count -ge 3))

  $cmp = 0.0
  if ($v['compare_at_price']) { $cmp = [double]$v['compare_at_price'] }
  if ($cmp -le $price) { $cmp = 0 }

  $kw = (($tagsArr | Select-Object -First 14) -join ' ').ToLower()
  if ($kw.Length -gt 220) { $kw = $kw.Substring(0, 220) }

  $imgs = @($p['images'] | Select-Object -First 5 | ForEach-Object { $_['src'] })
  [void]$manifest.Add([ordered]@{ id = $id; imgs = $imgs })

  $meta = if ($imgMeta.ContainsKey($id)) { $imgMeta[$id] } else { $null }
  $item = [ordered]@{
    id = $id; n = $parsed.name; s = $parsed.sub; b = $parsed.brand; z = $parsed.size
    c = $cats; k = $isKit; p = $price; m = $cmp
    v = [string]$v['id']; h = $p['handle']
    i = $(if ($meta) { [int]$meta['n'] } else { $imgs.Count })
    w = $(if ($meta) { [string]$meta['studio'] } else { '' })
    d = ([string]$p['created_at']).Substring(0, 10)
    o = $order
    q = $kw
  }
  $order++
  [void]$catalog.Add($item)

  $det = Sections $p['body_html'] $parsed.name
  $det['full'] = Clean $p['title']
  [System.IO.File]::WriteAllText((Join-Path $root "assets\data\p\$id.json"), $ser.Serialize($det), $utf8)
}

$stamp = (Get-Date).ToString('yyyy-MM-dd')
$js = "/* Generated by tools/build-data.ps1 from $Store on $stamp - do not edit by hand. */`nwindow.CN_CATALOG = " + $ser.Serialize([ordered]@{ updated = $stamp; products = @($catalog.ToArray()) }) + ";`n"
[System.IO.File]::WriteAllText((Join-Path $root 'assets\js\catalog.js'), $js, $utf8)
[System.IO.File]::WriteAllText((Join-Path $cache 'manifest.json'), $ser.Serialize(@($manifest.ToArray())), $utf8)

$byCat = @{}
foreach ($it in $catalog) { foreach ($c in $it.c) { $byCat[$c] = 1 + [int]$byCat[$c] } }
Write-Host "catalog: $($catalog.Count) products  |  kits: $(($catalog | Where-Object { $_.k -eq 1 }).Count)"
$byCat.GetEnumerator() | Sort-Object Name | ForEach-Object { Write-Host ("  {0,-10} {1}" -f $_.Name, $_.Value) }
