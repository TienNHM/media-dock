<#
  Downloads yt-dlp + ffmpeg (Windows x64) into src/MediaDock.Api/Resources/binaries so the API can run real acquisition
  without relying on PATH. Rebuild or restart the API after running this script.

  If yt-dlp.exe / ffmpeg.exe already exist and look valid, downloads are skipped (so package:desktop does not
  re-fetch every run). Use -Force to replace them.

  Optional: set UseStubWhenBinaryMissing to false in appsettings or user secrets once binaries exist.
#>
param(
  [switch]$SkipFfmpeg,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outDir = Join-Path $root "src/MediaDock.Api/Resources/binaries"
New-Item -ItemType Directory -Force $outDir | Out-Null

Write-Host "Output: $outDir" -ForegroundColor Cyan

# yt-dlp (single exe)
$ytDlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
$ytDlpOut = Join-Path $outDir "yt-dlp.exe"
$ytPresent =
  (-not $Force) -and
  (Test-Path -LiteralPath $ytDlpOut) -and
  ((Get-Item -LiteralPath $ytDlpOut).Length -ge 50KB)
if ($ytPresent) {
  Write-Host "`nyt-dlp.exe already present (skip). Use scripts/fetch-binaries.ps1 -Force to refresh." `
    -ForegroundColor DarkGray
}
else {
  Write-Host "`nDownloading yt-dlp..." -ForegroundColor Yellow
  Invoke-WebRequest -Uri $ytDlpUrl -OutFile $ytDlpOut -UseBasicParsing
  Write-Host "  -> $ytDlpOut" -ForegroundColor Green
}

if ($SkipFfmpeg) {
  Write-Host "`nSkipped ffmpeg (-SkipFfmpeg). Install ffmpeg separately and set Acquisition:FfmpegPath or PATH." -ForegroundColor Yellow
  exit 0
}

$ffmpegOut = Join-Path $outDir "ffmpeg.exe"
$ffmpegPresent =
  (-not $Force) -and
  (Test-Path -LiteralPath $ffmpegOut) -and
  ((Get-Item -LiteralPath $ffmpegOut).Length -ge 1MB)

if ($ffmpegPresent) {
  Write-Host "ffmpeg.exe already present (skip). Use scripts/fetch-binaries.ps1 -Force to refresh." `
    -ForegroundColor DarkGray
}
else {
  # ffmpeg: Gyan essentials build (zip, pinned release — update URL if 404)
  $ffmpegZipUrl = "https://github.com/GyanD/codexffmpeg/releases/download/7.1/ffmpeg-7.1-essentials_build.zip"
  $tmp = Join-Path $env:TEMP ("mediadock-ffmpeg-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Force $tmp | Out-Null
  try {
    $zipPath = Join-Path $tmp "ffmpeg.zip"
    Write-Host "`nDownloading ffmpeg (~80MB, Gyan essentials 7.1)..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $ffmpegZipUrl -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath $tmp -Force
    $ffmpeg = Get-ChildItem -Path $tmp -Filter ffmpeg.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $ffmpeg) {
      throw "ffmpeg.exe not found after extracting $ffmpegZipUrl. Download ffmpeg manually and copy ffmpeg.exe to:`n  $outDir"
    }
    Copy-Item $ffmpeg.FullName $ffmpegOut -Force
    Write-Host "  -> $ffmpegOut" -ForegroundColor Green
  }
  finally {
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
  }
}

Write-Host "`nDone. Restart the API (dotnet run) and check GET /health/binaries." -ForegroundColor Green
