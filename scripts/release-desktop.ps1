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
$apiCsproj = Join-Path $root 'src/MediaDock.Api/MediaDock.Api.csproj'
$spaSrc = Join-Path $root 'apps/web/dist/web/browser'
$electronOutSlug = (($Runtime -replace '[\\/]+', '-') -replace '[^a-zA-Z0-9._+-]+', '-')
$electronOutAbs = Join-Path $desktop "release-$electronOutSlug"

function Use-Robocopy {
    param([string]$From, [string]$To)
    New-Item -ItemType Directory -Force $To | Out-Null
    & robocopy $From $To /MIR /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit $LASTEXITCODE" }
}

function Stop-MediaDockForReleaseBuild {
    # electron-builder fails if resources\app.asar is locked (prior unpack / dev / Explorer / AV).
    $releaseRoot = ([System.IO.Path]::GetFullPath($electronOutAbs))
    $deskRoot = ([System.IO.Path]::GetFullPath($desktop))

    foreach ($leaf in @('MediaDock')) {
        Get-Process -Name $leaf -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
    }

    $releasePrefix = $releaseRoot.TrimEnd('\') + '\'
    $deskPrefix = $deskRoot.TrimEnd('\') + '\'
    foreach ($proc in Get-Process -ErrorAction SilentlyContinue) {
        try {
            $exe = $proc.Path
            if ([string]::IsNullOrWhiteSpace($exe)) { continue }
            if ($exe.StartsWith($releasePrefix, [StringComparison]::OrdinalIgnoreCase)) {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            }
        }
        catch {
            continue
        }
    }

    # Hoisted Electron dev can live under repo node_modules under desktop-shell subtree.
    foreach ($leaf in @('electron', 'Electron')) {
        foreach ($proc in Get-Process -Name $leaf -ErrorAction SilentlyContinue) {
            try {
                $exe = $proc.Path
                if (-not [string]::IsNullOrWhiteSpace($exe) -and
                    $exe.StartsWith($deskPrefix, [StringComparison]::OrdinalIgnoreCase)) {
                    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                }
            }
            catch {
                continue
            }
        }
    }

    Get-CimInstance Win32_Process -Filter "Name = 'MediaDock.exe'" -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

    Start-Sleep -Seconds 3
}

function Clear-ElectronReleaseOutputDir {
    param([string]$releaseDir)
    if (-not $releaseDir) { return }

    function Remove-PathWithRetries {
        param([string]$Path)
        foreach ($attempt in 1..14) {
            if (-not (Test-Path -LiteralPath $Path)) {
                return
            }

            Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
            if (-not (Test-Path -LiteralPath $Path)) {
                return
            }

            Start-Sleep -Milliseconds 700
        }
    }

    if (-not (Test-Path -LiteralPath $releaseDir)) {
        return
    }

    Remove-PathWithRetries -Path $releaseDir
    if (Test-Path -LiteralPath $releaseDir) {
        $junk = Join-Path $env:TEMP ('mediadock-release-old-' + [guid]::NewGuid().ToString('N'))
        try {
            Move-Item -LiteralPath $releaseDir -Destination $junk -Force -ErrorAction Stop
        }
        catch {
            throw @"
Cannot recycle release output (locked?): $releaseDir
Close MediaDock, any Explorer windows on release-win-* / win-unpacked, then retry.
$($_.Exception.Message)
"@
        }

        Remove-Item -LiteralPath $junk -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n== MediaDock desktop release ($Runtime) ==" -ForegroundColor Cyan
Write-Host "Repo: $root`nBundle staging: $bundle`n"

if (-not $SkipBinariesFetch) {
    Write-Host '[1/4] yt-dlp + ffmpeg (src/MediaDock.Api/Resources/binaries; skip if already present)' -ForegroundColor Yellow
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
    Write-Host '[3/4] Angular production build (configuration desktop, baseHref ./ for Electron)' -ForegroundColor Yellow
    Push-Location $root
    try {
        npm run build:spa-desktop
        if ($LASTEXITCODE -ne 0) { throw "web build failed ($LASTEXITCODE)" }
    }
    finally {
        Pop-Location
    }
}

if (-not (Test-Path (Join-Path $spaSrc 'index.html'))) {
    throw "SPA not found: $spaSrc - run npm run build:spa-desktop"
}

Write-Host '     Copy SPA to bundle-dist/web/browser ...' -ForegroundColor DarkGray
Use-Robocopy -From $spaSrc -To (Join-Path $bundle 'web/browser')

if (-not $SkipElectron) {
    Write-Host '[4/4] electron-builder' -ForegroundColor Yellow
    $ridKey = ([string]$Runtime).ToLower()

    # Build into a fresh subfolder under the repo (not %TEMP%). Reusing workspace release-*/win-unpacked often locks app.asar
    # (MediaDock running, Defender, Cursor indexing). Promote results into release-<rid> only after succeed.
    $stagingRoot = Join-Path $desktop '.electron-builder-staging'
    New-Item -ItemType Directory -Force $stagingRoot | Out-Null
    $stagingOut = Join-Path $stagingRoot ("$electronOutSlug-" + [guid]::NewGuid().ToString('N'))

    Push-Location $desktop
    try {
        $env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'

        New-Item -ItemType Directory -Force $stagingOut | Out-Null

        $ebArgs = @(
            'electron-builder',
            '--publish', 'never',
            "--config.directories.output=$stagingOut"
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

        Write-Host "     Electron staging (repo): $stagingOut" -ForegroundColor DarkGray
        & npx --yes @ebArgs

        if ($LASTEXITCODE -ne 0) {
            Remove-Item -LiteralPath $stagingOut -Recurse -Force -ErrorAction SilentlyContinue
            throw "electron-builder failed ($LASTEXITCODE)"
        }

        Write-Host '     Promote staged build -> apps/desktop-shell/release-<rid>/ (closing old MediaDock)...' `
            -ForegroundColor DarkGray
        Stop-MediaDockForReleaseBuild
        Clear-ElectronReleaseOutputDir $electronOutAbs
        New-Item -ItemType Directory -Force $electronOutAbs | Out-Null

        & robocopy $stagingOut $electronOutAbs /MIR /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
        if ($LASTEXITCODE -ge 8) {
            throw @"
promote robocopy failed ($LASTEXITCODE). Old release folder locked?
Installers remain in staging (copy manually):
  $stagingOut
Delete apps/desktop-shell/release-$electronOutSlug and retry after closing Explorer/MediaDock.
"@
        }

        Remove-Item -LiteralPath $stagingOut -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "     Electron output: $electronOutAbs" -ForegroundColor DarkGray
    }
    finally {
        Pop-Location
    }
}

Write-Host "`nHoàn thành. Runtime=$Runtime -> apps/desktop-shell/release-$electronOutSlug/" -ForegroundColor Green
