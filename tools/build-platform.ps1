param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('yandex', 'local')]
  [string]$Platform
)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputRoot = [IO.Path]::GetFullPath((Join-Path $root 'output'))
$destination = [IO.Path]::GetFullPath((Join-Path $outputRoot $Platform))
$zipPath = [IO.Path]::GetFullPath((Join-Path $outputRoot ("jor-{0}.zip" -f $Platform)))
$outputPrefix = $outputRoot.TrimEnd('\') + '\'

if (-not $destination.StartsWith($outputPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'Invalid output path'
}

if (Test-Path -LiteralPath $destination) {
  Remove-Item -LiteralPath $destination -Recurse -Force
}
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Path $destination -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $destination 'platforms') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'index.html') -Destination (Join-Path $destination 'index.html')
foreach ($directory in @('css', 'fonts', 'js', 'audio', 'sprites')) {
  Copy-Item -LiteralPath (Join-Path $root $directory) -Destination (Join-Path $destination $directory) -Recurse
}
Copy-Item -LiteralPath (Join-Path $root ("platforms\{0}" -f $Platform)) -Destination (Join-Path $destination 'platforms') -Recurse

$indexPath = Join-Path $destination 'index.html'
$index = [IO.File]::ReadAllText($indexPath)
if ($Platform -ne 'yandex') {
  $index = [Text.RegularExpressions.Regex]::Replace($index, '(?m)^\s*<script src="/sdk\.js"></script>\r?\n?', '')
  $index = [Text.RegularExpressions.Regex]::Replace($index, '(?m)^\s*<script src="platforms/yandex/early\.js"></script>\r?\n?', '')
  $index = $index.Replace('platforms/yandex/config.js', ("platforms/{0}/config.js" -f $Platform))
  $index = $index.Replace('platforms/yandex/adapter.js', ("platforms/{0}/adapter.js" -f $Platform))
  $index = $index.Replace('<title>Gulp &mdash; Yandex Games</title>', '<title>Gulp</title>')
}
[IO.File]::WriteAllText($indexPath, $index, (New-Object Text.UTF8Encoding($false)))

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::Open($zipPath, [IO.Compression.ZipArchiveMode]::Create)
try {
  $sourcePrefix = $destination.TrimEnd('\') + '\'
  foreach ($file in Get-ChildItem -LiteralPath $destination -File -Recurse) {
    $entryName = $file.FullName.Substring($sourcePrefix.Length).Replace('\', '/')
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $archive,
      $file.FullName,
      $entryName,
      [IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }
} finally {
  $archive.Dispose()
}

Write-Output $destination
Write-Output $zipPath
