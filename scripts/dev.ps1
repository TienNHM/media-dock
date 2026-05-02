param(
  [ValidateSet("api", "web", "all")]
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
    "Set-Location `"$(Get-Location)`"; dotnet run --project apps/api/MediaDock.Api.csproj"
  ) | Out-Null
}

if ($Target -eq "web" -or $Target -eq "all") {
  Write-Host "`n==> Starting Angular dev server (new window)..." -ForegroundColor Yellow
  Start-Process pwsh -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location `"$(Get-Location)`"; npm run web:dev"
  ) | Out-Null
}

Write-Host "`nDone. For Electron: npm run desktop:dev" -ForegroundColor Green
