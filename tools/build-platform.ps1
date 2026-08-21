param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('yandex', 'vk', 'crazygames', 'local')]
  [string]$Platform,
  [switch]$SkipArchive
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
if (-not $SkipArchive -and (Test-Path -LiteralPath $zipPath)) {
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
  $platformTitle = if ($Platform -eq 'vk') { '&#1046;&#1086;&#1088;' } else { 'Gulp' }
  $index = $index.Replace('<title>Gulp &mdash; Yandex Games</title>', ("<title>{0}</title>" -f $platformTitle))
  if ($Platform -eq 'vk') {
    $configScript = '  <script src="platforms/vk/config.js"></script>'
    $bridgeScript = '  <script src="platforms/vk/vk-bridge.min.js"></script>'
    $adapterScript = '  <script src="platforms/vk/adapter.js"></script>'
    $backendScript = '  <script src="platforms/vk/backend-client.js"></script>'
    $index = $index.Replace($configScript, $bridgeScript + [Environment]::NewLine + $configScript)
    $index = $index.Replace($adapterScript, $backendScript + [Environment]::NewLine + $adapterScript)
  } elseif ($Platform -eq 'crazygames') {
    $configScript = '  <script src="platforms/crazygames/config.js"></script>'
    $sdkScript = '  <script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>'
    $index = $index.Replace($configScript, $sdkScript + [Environment]::NewLine + $configScript)
  }
}
[IO.File]::WriteAllText($indexPath, $index, (New-Object Text.UTF8Encoding($false)))

if (-not $SkipArchive) {
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
}

Write-Output $destination
if (-not $SkipArchive) {
  Write-Output $zipPath
}
