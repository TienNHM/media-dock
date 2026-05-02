<#
.SYNOPSIS
    Chạy release-desktop.ps1 cho nhiều RID (SPA build một lần, API + Electron cho từng runtime).

.EXAMPLE
    .\scripts\release-desktop-matrix.ps1
.EXAMPLE
    .\scripts\release-desktop-matrix.ps1 -Runtimes 'win-x64','linux-x64'
#>
param(
    [string[]] $Runtimes = @('win-x64', 'win-arm64')
)

$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'release-desktop.ps1'

if (-not $Runtimes -or $Runtimes.Count -eq 0) {
    throw '-Runtimes is empty.'
}

$i = 0
foreach ($r in $Runtimes) {
    $rid = [string]$r
    Write-Host "`n>>> Matrix $($i + 1)/$($Runtimes.Count) : $rid <<<`n" -ForegroundColor Magenta

    $pass = @{ Runtime = $rid }
    if ($i -gt 0) {
        $pass.SkipWebBuild = $true
        $pass.SkipBinariesFetch = $true
    }

    & $script @pass
    $i++
}

Write-Host "`nAll matrix builds finished.`nOutput: apps/desktop-shell/release-<runtime>/ ..." -ForegroundColor Green
