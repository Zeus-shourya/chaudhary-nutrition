<#
  Brand imagery for the redesign, built from the client's own files on the store CDN:
    - the "N" logo mark, recoloured into the ski.pdf palette (dark + light versions, favicon)
    - Annu Chaudhary portraits (graded + tritone) cropped from the About-page photos
    - the before/after pair for the "Annu's own journey" slider
    - the family photo for the story section
    - the two authorised certificates

      powershell -ExecutionPolicy Bypass -File tools\brand-images.ps1
#>
$ErrorActionPreference = 'Stop'
$root  = Split-Path $PSScriptRoot -Parent
$cache = Join-Path $PSScriptRoot '.cache\brand'
$out   = Join-Path $root 'assets\img\brand'
New-Item -ItemType Directory -Force $cache, $out | Out-Null
Add-Type -Path (Join-Path $PSScriptRoot 'imgfx.cs') -ReferencedAssemblies System.Drawing, System.Core

$src = @{
  'logo.png'   = 'https://chaudharynutrition.com/cdn/shop/files/chaudhary_Nutrition_logo.png?width=2400'
  'family.jpg' = 'https://chaudharynutrition.com/cdn/shop/files/WhatsApp_Image_2025-07-03_at_11.03.38_AM.jpg'
  'gym.jpg'    = 'https://chaudharynutrition.com/cdn/shop/files/WhatsApp_Image_2025-07-02_at_5.17.53_PM.jpg'
  'pink.jpg'   = 'https://chaudharynutrition.com/cdn/shop/files/WhatsApp_Image_2025-07-02_at_5.18.04_PM.jpg'
  'cert-iso.jpg' = 'https://cdn.shopify.com/s/files/1/0964/5264/0949/files/RATHEE-BROTHERS-45001-2018-QAA-1_page-0001.jpg'
  'cert-gmp.jpg' = 'https://cdn.shopify.com/s/files/1/0964/5264/0949/files/RATHEE-BROTHERS-GMP-QAA-3_page-0001.jpg'
}
foreach ($k in $src.Keys) {
  $f = Join-Path $cache $k
  if (-not (Test-Path $f)) { & curl.exe -sL -A 'Mozilla/5.0' $src[$k] -o $f }
}

# ---- logo mark: the mark is the left ~29% of the horizontal logo
$logo = Join-Path $cache 'logo.png'
Add-Type -AssemblyName System.Drawing
$im = [System.Drawing.Image]::FromFile($logo); $lw = $im.Width; $lh = $im.Height; $im.Dispose()
$cropW = [int]($lw * 0.29)
$navy = [double[]](14,16,61); $claret = [double[]](153,13,53); $rose = [double[]](235,166,169)
$honey = [double[]](248,255,244); $roseDeep = [double[]](201,112,122)
[Fx]::RecolorLogo($logo, (Join-Path $out 'mark.png'), $cropW, $lh, $navy, $claret, $rose, $claret, 240)
[Fx]::RecolorLogo($logo, (Join-Path $out 'mark-light.png'), $cropW, $lh, $honey, $rose, $roseDeep, $rose, 240)
[Fx]::RecolorLogo($logo, (Join-Path $out 'favicon.png'), $cropW, $lh, $navy, $claret, $rose, $claret, 64)
[Fx]::RecolorLogo($logo, (Join-Path $out 'apple-touch-icon.png'), $cropW, $lh, $navy, $claret, $rose, $claret, 180)

# ---- portraits (source photos are 1600x1600 two-up "before / after" collages; crops avoid the
#      caption text baked into the middle and the Before/After labels at the bottom)
$pink = Join-Path $cache 'pink.jpg'; $gym = Join-Path $cache 'gym.jpg'
[Fx]::Portrait($pink, (Join-Path $out 'annu.jpg'),         828, 0, 704, 880, 704, 880, 0.10, 0.06, 'grade')
[Fx]::Portrait($pink, (Join-Path $out 'annu-tritone.jpg'), 828, 0, 704, 880, 704, 880, 0, 0, 'tritone')
# before/after pair: same 4:5 frame with the face centred in both, so the slider splits face-to-face
[Fx]::Portrait($gym,  (Join-Path $out 'journey-before.jpg'), 80, 0, 480, 600, 560, 700, 0.10, 0.04, 'grade')
[Fx]::Portrait($gym,  (Join-Path $out 'journey-after.jpg'),  916, 0, 480, 600, 560, 700, 0.10, 0.04, 'grade')
[Fx]::Portrait($gym,  (Join-Path $out 'annu-gym-tritone.jpg'), 890, 20, 700, 875, 700, 875, 0, 0, 'tritone')

# ---- client-supplied founder portrait (Annu at the salon): drop it in tools\source\ (newest image
#      wins). Used on the home founder section and the Luxury Salon page. Until one is supplied, the
#      About-page portrait stands in.
function Convert-ToPng([string]$in, [string]$out) {
  if ($in -match '\.(jpe?g|png)$') { Copy-Item $in $out -Force; return $out }
  try {   # WIC (works when the Windows WebP/AVIF codec is installed)
    Add-Type -AssemblyName PresentationCore
    $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create([Uri]$in, 'PreservePixelFormat', 'OnLoad')
    $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $enc.Frames.Add($dec.Frames[0]); $fs = [IO.File]::Create($out); $enc.Save($fs); $fs.Close(); return $out
  } catch { }
  # fallback: let Chrome decode it and screenshot it at its natural size (size read from the RIFF header)
  $b = [IO.File]::ReadAllBytes($in); $w = 0; $h = 0
  $fourcc = [Text.Encoding]::ASCII.GetString($b, 12, 4)
  if ($fourcc -eq 'VP8X') { $w = 1 + ([int]$b[24] -bor ([int]$b[25] -shl 8) -bor ([int]$b[26] -shl 16)); $h = 1 + ([int]$b[27] -bor ([int]$b[28] -shl 8) -bor ([int]$b[29] -shl 16)) }
  elseif ($fourcc -eq 'VP8 ') { $w = ([int]$b[26] -bor ([int]$b[27] -shl 8)) -band 0x3FFF; $h = ([int]$b[28] -bor ([int]$b[29] -shl 8)) -band 0x3FFF }
  elseif ($fourcc -eq 'VP8L') { $v = [BitConverter]::ToUInt32($b, 21); $w = 1 + ($v -band 0x3FFF); $h = 1 + (($v -shr 14) -band 0x3FFF) }
  if (-not $w) { throw "can't read image size of $in" }
  $html = Join-Path $cache 'decode.html'
  $name = Split-Path $in -Leaf; Copy-Item $in (Join-Path $cache $name) -Force
  Set-Content $html "<html><body style='margin:0'><img src='$name' style='display:block;width:${w}px;height:${h}px'></body></html>" -Encoding ASCII
  $prof = Join-Path $env:TEMP ('cn-dec-' + [guid]::NewGuid().ToString('N'))
  # Chrome logs harmless warnings to stderr; under 'Stop' Windows PowerShell would treat them as fatal
  $eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  & 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --hide-scrollbars --no-first-run --allow-file-access-from-files --user-data-dir="$prof" --window-size="$w,$h" --screenshot="$out" ('file:///' + ($html -replace '\\','/')) 2>&1 | Out-Null
  $ErrorActionPreference = $eap
  Start-Sleep -Milliseconds 300; Remove-Item -Recurse -Force $prof -ErrorAction SilentlyContinue
  if (-not (Test-Path $out)) { throw "Chrome could not decode $in" }
  return $out
}
$supplied = Get-ChildItem (Join-Path $PSScriptRoot 'source') -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -match '^\.(jpe?g|png|webp|avif)$' -and $_.Length -gt 0 } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($supplied) {
  $png = Convert-ToPng $supplied.FullName (Join-Path $cache 'annu-salon.png')
  $im = [System.Drawing.Image]::FromFile($png); $sw = $im.Width; $sh = $im.Height; $im.Dispose()
  # 4:5 from the top keeps the "Annu Chaudhary Salon" sign; the tall 2:3 version is for the salon page
  $cw = [Math]::Min($sw, [int]($sh * 0.8)); $cx = [int](($sw - $cw) / 2)
  [Fx]::Portrait($png, (Join-Path $out 'annu-salon.jpg'), $cx, 0, $cw, [int]($cw * 1.25), 880, 1100, 0.05, 0, 'grade')
  $tw = [Math]::Min($sw, [int]($sh * 2 / 3)); $tx = [int](($sw - $tw) / 2)
  [Fx]::Portrait($png, (Join-Path $out 'annu-salon-tall.jpg'), $tx, 0, $tw, [int]($tw * 1.5), 800, 1200, 0.05, 0, 'grade')
  Write-Host "founder portrait: $($supplied.Name) ($sw x $sh)"
} else {
  [Fx]::Portrait($pink, (Join-Path $out 'annu-salon.jpg'), 828, 0, 704, 880, 704, 880, 0.10, 0.06, 'grade')
  [Fx]::Portrait($pink, (Join-Path $out 'annu-salon-tall.jpg'), 828, 0, 704, 880, 704, 880, 0.10, 0.06, 'grade')
  Write-Host 'founder portrait: none supplied in tools\source - using the About-page photo'
}

# ---- family photo (Annu with her parents) for the story
$fam = Join-Path $cache 'family.jpg'
$im = [System.Drawing.Image]::FromFile($fam); $fw = $im.Width; $fh = $im.Height; $im.Dispose()
[Fx]::Portrait($fam, (Join-Path $out 'family.jpg'), 0, 0, $fw, $fh, 1200, [int](1200 * $fh / $fw), 0.16, 0.08, 'soft')   # desaturate + grade tames the neon tones

# ---- certificates: straight resave at web size (no grading on documents)
foreach ($c in 'cert-iso', 'cert-gmp') {
  $f = Join-Path $cache "$c.jpg"
  $im = [System.Drawing.Image]::FromFile($f); $cw = $im.Width; $ch = $im.Height; $im.Dispose()
  [Fx]::Portrait($f, (Join-Path $out "$c.jpg"), 0, 0, $cw, $ch, 1000, [int](1000 * $ch / $cw), 0, 0, 'none')
}
Get-ChildItem $out | Select-Object Name, @{n='KB';e={[int]($_.Length/1kb)}} | Format-Table -AutoSize | Out-String
