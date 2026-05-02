<#
.SYNOPSIS
    Build a desktop release: SPA (production), self-contained MediaDock API, Electron NSIS installer + portable.

.EXAMPLE
    .\scripts\release-desktop.ps1
.EXAMPLE
    .\scripts\release-desktop.ps1 -SkipBinariesFetch
.EXAMPLE
    .\scripts\release-desktop.ps1 -Runtime linux-x64 -SkipInstaller
#>
param(
    [switch] $SkipWebBuild,
    [switch] $SkipApiPublish,
    [switch] $SkipElectron,
    [switch] $SkipBinariesFetch,
    [switch] $SkipInstaller,
    [string] $Runtime = 'win-x64'
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$desktop = Join-Path $root 'apps/desktop-shell'
$bundle = Join-Path $desktop 'bundle-dist'
$apiCsproj = Join-Path $root 'apps/api/MediaDock.Api.csproj'
$spaSrc = Join-Path $root 'apps/web/dist/web/browser'
$electronOutSlug = (($Runtime -replace '[\\/]+', '-') -replace '[^a-zA-Z0-9._+-]+', '-')
$electronOutAbs = Join-Path $desktop "release-$electronOutSlug"

function Use-Robocopy {
    param([string]$From, [string]$To)
    New-Item -ItemType Directory -Force $To | Out-Null
    & robocopy $From $To /MIR /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit $LASTEXITCODE" }
}

Write-Host "`n== MediaDock desktop release ($Runtime) ==" -ForegroundColor Cyan
Write-Host "Repo: $root`nBundle staging: $bundle`n"

if (-not $SkipBinariesFetch) {
    Write-Host '[1/4] yt-dlp + ffmpeg (apps/api/Resources/binaries)' -ForegroundColor Yellow
    & (Join-Path $root 'scripts/fetch-binaries.ps1')
}

if (-not $SkipApiPublish) {
    if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
        throw 'dotnet SDK not found on PATH'
    }

    Write-Host '[2/4] dotnet publish API (Release, self-contained)' -ForegroundColor Yellow
    Remove-Item -LiteralPath $bundle -Recurse -Force -ErrorAction SilentlyContinue

    dotnet publish $apiCsproj `
        --configuration Release `
        --runtime $Runtime `
        --self-contained true `
        -o (Join-Path $bundle 'api')

    if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed ($LASTEXITCODE)" }
}
else {
    $exeLeaf = if ($Runtime -like 'win*') { 'MediaDock.Api.exe' } else { 'MediaDock.Api' }
    $exePath = Join-Path (Join-Path $bundle 'api') $exeLeaf
    if (-not (Test-Path $exePath)) {
        throw "Skipping API publish but bundle-dist is missing '$exeLeaf'. Run release without -SkipApiPublish first."
    }
}

if (-not $SkipWebBuild) {
    Write-Host '[3/4] npm run web:build (production)' -ForegroundColor Yellow
    Push-Location $root
    try {
        npm run web:build
        if ($LASTEXITCODE -ne 0) { throw "web build failed ($LASTEXITCODE)" }
    }
    finally {
        Pop-Location
    }
}

if (-not (Test-Path (Join-Path $spaSrc 'index.html'))) {
    throw "SPA not found: $spaSrc - run npm run web:build"
}

Write-Host '     Copy SPA to bundle-dist/web/browser ...' -ForegroundColor DarkGray
Use-Robocopy -From $spaSrc -To (Join-Path $bundle 'web/browser')

if (-not $SkipElectron) {
    Write-Host '[4/4] electron-builder' -ForegroundColor Yellow
    $ridKey = ([string]$Runtime).ToLower()

    Push-Location $desktop
    try {
        $env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'

        $ebArgs = @(
            'electron-builder',
            '--publish', 'never',
            "--config.directories.output=$electronOutAbs"
        )

        if ($SkipInstaller) {
            $ebArgs += '--dir'
        }

        if ($ridKey.StartsWith('win-')) {
            $ebArgs += '--win'
            if ($ridKey -match 'arm64') { $ebArgs += '--arm64' }
            elseif ($ridKey -match 'ia32') { $ebArgs += '--ia32' }
            elseif ($ridKey -match 'x86|x64|amd64') { $ebArgs += '--x64' }
            else {
                Write-Warning "Không nhận dạng CPU từ '$Runtime'; dùng --x64."
                $ebArgs += '--x64'
            }
        }
        elseif ($ridKey.StartsWith('linux-')) {
            $ebArgs += '--linux'
            if ($ridKey -match 'arm64') { $ebArgs += '--arm64' }
            else { $ebArgs += '--x64' }
        }
        elseif ($ridKey.StartsWith('osx-') -or $ridKey.StartsWith('darwin-')) {
            $ebArgs += '--mac'
            if ($ridKey -match 'arm64') { $ebArgs += '--arm64' }
            else { $ebArgs += '--x64' }
        }
        else {
            throw "Runtime không được hỗ trợ cho electron-builder: $Runtime - dạng ví dụ: win-x64, win-arm64, linux-x64, osx-arm64."
        }

        Write-Host "     Electron output: $electronOutAbs" -ForegroundColor DarkGray
        & npx --yes @ebArgs

        if ($LASTEXITCODE -ne 0) { throw "electron-builder failed ($LASTEXITCODE)" }
    }
    finally {
        Pop-Location
    }
}

Write-Host "`nHoàn thành. Runtime=$Runtime -> apps/desktop-shell/release-$electronOutSlug/" -ForegroundColor Green
