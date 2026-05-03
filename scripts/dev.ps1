param(
  [ValidateSet("api", "web", "desktop", "all")]
  [string]$Target = "all"
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

Write-Host "Repo: $(Get-Location)" -ForegroundColor Cyan

if ($Target -eq "api" -or $Target -eq "all") {
  Write-Host "`n==> Starting API (new window)..." -ForegroundColor Yellow
  Start-Process pwsh -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location `"$(Get-Location)`"; dotnet run --project src/MediaDock.Api/MediaDock.Api.csproj"
  ) | Out-Null
}

if ($Target -eq "web" -or $Target -eq "all") {
  Write-Host "`n==> Starting Angular dev server (new window)..." -ForegroundColor Yellow
  Start-Process pwsh -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location `"$(Get-Location)`"; npm run dev:spa"
  ) | Out-Null
}

if ($Target -eq "desktop" -or $Target -eq "all") {
  Write-Host "`n==> Starting Electron desktop shell (new window)..." -ForegroundColor Yellow
  Start-Process pwsh -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location `"$(Get-Location)`"; npm run dev:electron"
  ) | Out-Null
}

Write-Host "`nDone." -ForegroundColor Green
