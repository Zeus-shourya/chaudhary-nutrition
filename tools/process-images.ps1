<#
  Downloads every product photo from the store CDN and re-edits it for the redesign
  (see imgfx.cs): studio shots get a clean white backdrop, consistent framing and a
  feathered edge so they sit on the site's tinted cards; lifestyle shots get a gentle
  palette grade. Output: assets/img/p/<id>-<n>.jpg (1000px) and <id>-<n>-s.jpg (600px,
  first two images only, used on cards).

      powershell -ExecutionPolicy Bypass -File tools\process-images.ps1 [-Force]

  Run build-data.ps1 first (it writes the manifest), and again with -NoFetch after
  this so catalog.js picks up the studio/lifestyle flags.
#>
param([switch]$Force, [string]$Only = '')

$ErrorActionPreference = 'Stop'
$root  = Split-Path $PSScriptRoot -Parent
$cache = Join-Path $PSScriptRoot '.cache'
$raw   = Join-Path $cache 'raw'
$out   = Join-Path $root 'assets\img\p'
New-Item -ItemType Directory -Force $raw, $out | Out-Null

Add-Type -AssemblyName System.Web.Extensions
Add-Type -Path (Join-Path $PSScriptRoot 'imgfx.cs') -ReferencedAssemblies System.Drawing, System.Core
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = [int]::MaxValue
$utf8 = New-Object System.Text.UTF8Encoding($false)

$manifest = $ser.DeserializeObject([System.IO.File]::ReadAllText((Join-Path $cache 'manifest.json'), $utf8))

# ---- download (curl --parallel with a config file)
$cfg = New-Object System.Text.StringBuilder
$need = 0
foreach ($m in $manifest) {
  $n = 1
  foreach ($u in $m['imgs']) {
    $f = Join-Path $raw ("{0}-{1}.jpg" -f $m['id'], $n)
    if ($Force -or -not (Test-Path $f) -or (Get-Item $f).Length -lt 2000) {
      $sep = if ($u.Contains('?')) { '&' } else { '?' }
      [void]$cfg.AppendLine("url = `"$u${sep}width=1500&format=pjpg`"")
      [void]$cfg.AppendLine("output = `"$($f -replace '\\','/')`"")
      $need++
    }
    $n++
  }
}
if ($need -gt 0) {
  $cfgFile = Join-Path $cache 'curl.cfg'
  [System.IO.File]::WriteAllText($cfgFile, $cfg.ToString(), $utf8)
  Write-Host "downloading $need images..."
  & curl.exe -sL --parallel --parallel-max 8 -A 'Mozilla/5.0' -K $cfgFile
}

# ---- process
$meta = @{}
$done = 0; $sw = [System.Diagnostics.Stopwatch]::StartNew()
foreach ($m in $manifest) {
  $id = $m['id']
  if ($Only -and $id -notlike $Only) { continue }
  $flags = ''
  $count = 0
  for ($n = 1; $n -le $m['imgs'].Count; $n++) {
    $src = Join-Path $raw "$id-$n.jpg"
    if (-not (Test-Path $src)) { Write-Host "missing $src" -ForegroundColor DarkYellow; continue }
    $large = Join-Path $out "$id-$n.jpg"
    $small = if ($n -le 2) { Join-Path $out "$id-$n-s.jpg" } else { '' }
    try {
      $flags += [Fx]::ProcessProduct($src, $large, $small, ($n -eq 1))
      $count++
    } catch { Write-Host "failed $id-$n : $($_.Exception.Message)" -ForegroundColor Red }
    $done++
  }
  $meta[$id] = @{ n = $count; studio = $flags }
}
Write-Host ("processed {0} images in {1:n0}s" -f $done, $sw.Elapsed.TotalSeconds)

if (-not $Only) {
  [System.IO.File]::WriteAllText((Join-Path $cache 'imgmeta.json'), $ser.Serialize($meta), $utf8)
  $studio = ($meta.Values | Where-Object { $_.studio.StartsWith('1') }).Count
  Write-Host "primary images: $studio studio / $($meta.Count - $studio) lifestyle"
}
