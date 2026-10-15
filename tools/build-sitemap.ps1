<#
  Writes sitemap.xml at the site root: the static pages plus one product.html?p=<id> URL per
  product in assets/js/catalog.js. Reads local files only (no network). build-data.ps1 runs it
  after every catalogue rebuild; it can also be run on its own:

      powershell -ExecutionPolicy Bypass -File tools\build-sitemap.ps1
      powershell -ExecutionPolicy Bypass -File tools\build-sitemap.ps1 -LastMod 2026-10-15

  dist\ (the offline phone demo) and tools\ are deliberately left out.
#>
param(
  [string]$BaseUrl = 'https://zeus-shourya.github.io/chaudhary-nutrition/',
  [string]$LastMod = (Get-Date).ToString('yyyy-MM-dd')
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Add-Type -AssemblyName System.Web.Extensions
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = [int]::MaxValue
$utf8 = New-Object System.Text.UTF8Encoding($false)
if (-not $BaseUrl.EndsWith('/')) { $BaseUrl += '/' }

$catJs = [IO.File]::ReadAllText((Join-Path $root 'assets\js\catalog.js'), $utf8)
$catalog = $ser.DeserializeObject($catJs.Substring($catJs.IndexOf('{')).TrimEnd(";`r`n "))
$products = @($catalog['products'])

# indexable static pages (home = the bare base URL, never index.html)
$pages = @('', 'shop.html', 'finder.html', 'about.html', 'salon.html', 'certificates.html', 'contact.html')
$urls = New-Object System.Collections.ArrayList
foreach ($pg in $pages) { [void]$urls.Add($BaseUrl + $pg) }
foreach ($p in $products) { [void]$urls.Add($BaseUrl + 'product.html?p=' + [Uri]::EscapeDataString([string]$p['id'])) }

$sb = New-Object System.Text.StringBuilder
[void]$sb.Append("<?xml version=`"1.0`" encoding=`"UTF-8`"?>`n")
[void]$sb.Append("<urlset xmlns=`"http://www.sitemaps.org/schemas/sitemap/0.9`">`n")
foreach ($u in $urls) {
  [void]$sb.Append("  <url><loc>" + [Security.SecurityElement]::Escape($u) + "</loc><lastmod>$LastMod</lastmod></url>`n")
}
[void]$sb.Append("</urlset>`n")

$out = Join-Path $root 'sitemap.xml'
[IO.File]::WriteAllText($out, $sb.ToString(), $utf8)
Write-Host ("sitemap: {0}  ({1} URLs: {2} pages + {3} products)" -f $out, $urls.Count, $pages.Count, $products.Count)
