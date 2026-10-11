<#
  Builds dist\chaudhary-nutrition-demo.html: the whole site in ONE self-contained file - all 8 pages,
  the catalogue, every product description and all images (as data URIs) - for previewing on a phone.
  Send the file to the phone and open it in Chrome. Internet is only needed for the Google fonts,
  the map on the contact page, WhatsApp and the Shopify checkout.

      powershell -ExecutionPolicy Bypass -File tools\build-bundle.ps1

  Pages become hash routes inside the file (#/shop?c=skin, #/product?p=<id>); the page scripts read
  their query from window.CN_QS and images resolve through window.CN_ASSET (hooks in site.js etc.).
#>
param([int]$ProductPx = 520, [long]$Quality = 72)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $root 'dist'
$tmp  = Join-Path $PSScriptRoot '.cache\bundle'
New-Item -ItemType Directory -Force $dist, $tmp | Out-Null
Add-Type -AssemblyName System.Web.Extensions
Add-Type -AssemblyName System.Drawing
Add-Type -Path (Join-Path $PSScriptRoot 'imgfx.cs') -ReferencedAssemblies System.Drawing, System.Core
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = [int]::MaxValue
$utf8 = New-Object System.Text.UTF8Encoding($false)
function ReadText([string]$rel) { [IO.File]::ReadAllText((Join-Path $root $rel), $utf8) }
function SafeJs([string]$s) { $s -replace '</script', '<\/script' }

# ---------------------------------------------------------------- images -> data URIs
$tmpJpg = Join-Path $tmp 'x.jpg'
function JpegData([string]$path, [int]$maxW, [long]$q) {
  $bmp = [Fx]::Load($path)
  $w = $bmp.Width; $h = $bmp.Height
  $tw = [Math]::Min($maxW, $w); $th = [int][Math]::Round($h * $tw / $w)
  $o = [Fx]::Render($bmp, 0, 0, $w, $h, $tw, $th, [System.Drawing.Color]::White)
  $bmp.Dispose()
  if ($tw -lt $w) { [Fx]::Sharpen($o, 0.2) }
  [Fx]::SaveJpeg($o, $tmpJpg, $q); $o.Dispose()
  'data:image/jpeg;base64,' + [Convert]::ToBase64String([IO.File]::ReadAllBytes($tmpJpg))
}
function PngData([string]$path) { 'data:image/png;base64,' + [Convert]::ToBase64String([IO.File]::ReadAllBytes($path)) }

$catJs = ReadText 'assets\js\catalog.js'
$catalog = $ser.DeserializeObject($catJs.Substring($catJs.IndexOf('{')).TrimEnd(";`r`n "))
$products = $catalog['products']

# hero + feature images on the home page get a larger version
$big = @('collagen-skin-care-kit-collagen-face-wash-plus', 'pure-baby-calm-oil-soft-skin-and-better-sleep')
$imgMap = [ordered]@{}
$n = 0
foreach ($p in $products) {
  $id = $p['id']
  $px = if ($big -contains $id) { 860 } else { $ProductPx }
  $imgMap["p/$id"] = JpegData (Join-Path $root "assets\img\p\$id-1.jpg") $px $(if ($big -contains $id) { 78L } else { $Quality })
  $n++; if ($n % 50 -eq 0) { Write-Host "  images: $n / $($products.Count)" }
}
$brand = @{
  'annu-salon.jpg' = 680; 'annu-salon-tall.jpg' = 620; 'family.jpg' = 900
  'journey-before.jpg' = 560; 'journey-after.jpg' = 560; 'cert-iso.jpg' = 820; 'cert-gmp.jpg' = 820
}
foreach ($k in $brand.Keys) { $imgMap["brand/$k"] = JpegData (Join-Path $root "assets\img\brand\$k") $brand[$k] 78L }
foreach ($k in 'mark.png', 'mark-light.png') { $imgMap["brand/$k"] = PngData (Join-Path $root "assets\img\brand\$k") }
$favicon = PngData (Join-Path $root 'assets\img\brand\favicon.png')

# ---------------------------------------------------------------- product descriptions
$details = New-Object System.Text.StringBuilder
[void]$details.Append('{')
$first = $true
foreach ($p in $products) {
  $f = Join-Path $root "assets\data\p\$($p['id']).json"
  if (-not (Test-Path $f)) { continue }
  if (-not $first) { [void]$details.Append(',') }; $first = $false
  [void]$details.Append($ser.Serialize($p['id'])).Append(':').Append([IO.File]::ReadAllText($f, $utf8))
}
[void]$details.Append('}')

# ---------------------------------------------------------------- page templates + page scripts
$pages = [ordered]@{ home = 'index.html'; shop = 'shop.html'; product = 'product.html'; finder = 'finder.html'
                     about = 'about.html'; salon = 'salon.html'; certificates = 'certificates.html'; contact = 'contact.html' }
$tpl = [ordered]@{}
$pageFns = New-Object System.Text.StringBuilder
foreach ($k in $pages.Keys) {
  $html = ReadText $pages[$k]
  $a = $html.IndexOf('<div id="cn-top"></div>'); $b = $html.IndexOf('<div id="cn-foot"></div>')
  if ($a -lt 0 -or $b -lt 0) { throw "$($pages[$k]): missing cn-top / cn-foot markers" }
  $seg = $html.Substring($a + 23, $b - $a - 23).Trim()
  $title = [Net.WebUtility]::HtmlDecode(([regex]::Match($html, '<title>(.*?)</title>')).Groups[1].Value)
  $tpl[$k] = [ordered]@{ title = $title; html = $seg }

  # page logic: either a page script file, or the inline <script> after site.js
  $code = ''
  $src = [regex]::Match($html, '<script src="assets/js/(home|shop|product|finder)\.js')
  if ($src.Success) { $code = ReadText "assets\js\$($src.Groups[1].Value).js" }
  else {
    $inline = [regex]::Matches($html, '(?s)<script>(.*?)</script>')
    if ($inline.Count) { $code = $inline[$inline.Count - 1].Groups[1].Value }
  }
  [void]$pageFns.Append("CN_PAGES['$k'] = function () {`n").Append((SafeJs $code)).Append("`n};`n")
}

# ---------------------------------------------------------------- runtime glue
$glueBefore = @'
(function () {
  // pick the starting page from the hash before site.js draws the header
  var h = location.hash.replace(/^#\/?/, ''), i = h.indexOf('?'), r = (i < 0 ? h : h.slice(0, i)) || 'home';
  if (!/^(home|shop|product|finder|about|salon|certificates|contact)$/.test(r)) r = 'home';
  document.body.setAttribute('data-page', r);
  window.CN_QS = i < 0 ? '' : h.slice(i);
  window.CN_PAGES = {};
  window.CN_ASSET = function (path) {
    path = String(path).replace(/[?#].*$/, '');
    var m = path.match(/^assets\/img\/p\/(.+)-\d+(?:-s)?\.jpg$/);
    if (m && CN_IMG['p/' + m[1]]) return CN_IMG['p/' + m[1]];
    return CN_IMG[path.replace(/^assets\/img\//, '')] || path;
  };
  window.CN_LOAD_DETAILS = function (id) { var d = CN_DETAILS[id]; return d ? Promise.resolve(d) : Promise.reject(0); };
})();
'@
$router = @'
(function () {
  var ROUTES = ['home', 'shop', 'product', 'finder', 'about', 'salon', 'certificates', 'contact'];
  var view = document.getElementById('route');
  function parse() {
    var h = location.hash.replace(/^#\/?/, ''), i = h.indexOf('?'), r = (i < 0 ? h : h.slice(0, i)) || 'home';
    if (ROUTES.indexOf(r) < 0) r = 'home';
    return { r: r, qs: i < 0 ? '' : h.slice(i) };
  }
  function resolve(html) { return html.replace(/assets\/img\/[^"'\s)]+/g, function (m) { return CN_ASSET(m); }); }
  function render() {
    var x = parse(), t = CN_TPL[x.r];
    CN.close(); CN.setMega(false);
    document.body.setAttribute('data-page', x.r);
    document.body.classList.remove('fbar-on');
    var fb = document.getElementById('fbar'); if (fb) fb.classList.remove('is-on');
    window.CN_QS = x.qs;
    view.innerHTML = resolve(t.html);
    document.title = t.title;
    var file = x.r === 'home' ? 'index.html' : x.r + '.html';
    CN.$$('.hdr__link[href]').forEach(function (a) {
      if (a.getAttribute('href') === file) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    if (CN_PAGES[x.r]) CN_PAGES[x.r]();
    CN.reveal(view); CN.rails(view); CN.beforeAfter(view);
  }
  window.CN_NAV = function (url) {
    var m = String(url).match(/^(index|shop|product|finder|about|salon|certificates|contact)\.html(\?[^#]*)?/);
    if (!m) { location.href = url; return; }
    var target = '#/' + (m[1] === 'index' ? '' : m[1]) + (m[2] || '');
    if (location.hash === target) render(); else location.hash = target;
  };
  window.CN_SET_QS = function (r, qs) { history.replaceState(null, '', '#/' + r + qs); };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var href = a.getAttribute('href');
    if (/^(index|shop|product|finder|about|salon|certificates|contact)\.html(\?|#|$)/.test(href)) { e.preventDefault(); CN_NAV(href); }
  }, true);
  window.addEventListener('hashchange', function () { if (!location.hash || location.hash.indexOf('#/') === 0) render(); });
  render();
})();
'@

# ---------------------------------------------------------------- assemble
$css = ReadText 'assets\css\site.css'
$fontHref = ([regex]::Match((ReadText 'index.html'), 'href="(https://fonts.googleapis.com/css2[^"]+)"')).Groups[1].Value
$catalogBundle = $catJs + "`nCN_CATALOG.products.forEach(function (p) { p.i = 1; });   // bundle carries the first photo of each product`n"

$sb = New-Object System.Text.StringBuilder
[void]$sb.Append(@"
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Chaudhary Nutrition — redesign preview</title>
<meta name="theme-color" content="#F8FFF4">
<link rel="icon" type="image/png" href="$favicon">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="$fontHref">
<style>
$css
</style>
</head>
<body data-page="home">
<div id="cn-top"></div>
<div id="route"></div>
<div id="cn-foot"></div>
<script>window.CN_IMG = $($ser.Serialize($imgMap));</script>
<script>
$(SafeJs $glueBefore)
</script>
<script>
$(SafeJs (ReadText 'assets\js\config.js'))
</script>
<script>
$(SafeJs $catalogBundle)
</script>
<script>window.CN_DETAILS = $($details.ToString());
window.CN_TPL = $($ser.Serialize($tpl));</script>
<script>
$(SafeJs (ReadText 'assets\js\site.js'))
</script>
<script>
$($pageFns.ToString())
</script>
<script>
$(SafeJs $router)
</script>
</body>
</html>
"@)

$out = Join-Path $dist 'chaudhary-nutrition-demo.html'
[IO.File]::WriteAllText($out, $sb.ToString(), $utf8)
$mb = (Get-Item $out).Length / 1MB
Write-Host ("bundle: {0}  ({1:n1} MB, {2} images)" -f $out, $mb, $imgMap.Count)
