# MediaDock

Desktop-first **Media Acquisition Platform** (Electron + Angular + ASP.NET Core 9 + SQLite) per the architecture plan in `.cursor/plans/`.

## Prerequisites

- .NET SDK 9+
- Node.js 20+ / npm 10+

## Real downloads (Windows)

1. Fetch **yt-dlp** and **ffmpeg** into `src/MediaDock.Api/Resources/binaries/` (copied to the API output on build):

   ```powershell
   npm run download:native-binaries
   ```

   Or: `powershell -File scripts/fetch-binaries.ps1`. If the pinned ffmpeg URL 404s, install [ffmpeg](https://ffmpeg.org/download.html) yourself and copy `ffmpeg.exe` next to `yt-dlp.exe`, or set `Acquisition:FfmpegPath` in configuration.

2. Restart the API so `Resources/binaries` is copied to `bin/.../Resources/binaries/`.

3. Confirm: `GET http://127.0.0.1:17888/health/binaries` should report **Healthy** (not “stub mode” / missing ffmpeg).

4. Optional: set `Acquisition:UseStubWhenBinaryMissing` to `false` (user secrets or env) so missing binaries fail fast instead of using stubs.

JSON API responses serialize `JobStatus` as strings (`"Queued"`, …) for the Angular UI.

## Quick start (development)

### 1) API sidecar

```powershell
dotnet run --project src/MediaDock.Api/MediaDock.Api.csproj
```

- HTTP: `http://127.0.0.1:17888`
- Health: `GET /health/live`, `GET /health/ready`, `GET /health/binaries`
- Jobs: `POST /api/jobs`, `GET /api/jobs`
- SignalR hub: `/hubs/jobs` (`jobProgress` events)

### 2) Angular UI

```powershell
npm run dev:spa
```

Open `http://localhost:4200`.

### 3) Electron shell (optional)

In another terminal:

```powershell
npm run dev:electron
```

The desktop shell attempts to spawn the API via `dotnet run` and opens the web dev server URL.

## Monorepo layout

Một rule đơn giản: **`src/` (root) = toàn bộ C#**, **`apps/` = chỉ giao diện chạy được** (web + desktop). NPM workspaces: chỉ **`apps/web`** và **`apps/desktop-shell`**. *(Khác `apps/web/src` — đó là mã Angular.)*

- `src/*` — **6 project .NET**: **MediaDock.Api**, **MediaDock.Worker**, **MediaDock.Domain**, **MediaDock.Application**, **MediaDock.Infrastructure** (gom acquisition, queue, health check binaries, notification sink vào đây), **MediaDock.Tests**
- `apps/web` — Angular + PrimeNG (Aura) UI
- `apps/desktop-shell` — Electron (main/preload/sidecar)
- `scripts/` — PowerShell build/dev/fetch; `scripts/packaging/` — manifest pin nhị phân (tương lai CI)

Quy ước chi tiết: [`docs/architecture/conventions.md`](docs/architecture/conventions.md). Tham chiếu phân lớp kiểu ABP (không dùng framework): [`docs/architecture/abp-inspired-practices.md`](docs/architecture/abp-inspired-practices.md). CI: [`.github/workflows/build.yml`](.github/workflows/build.yml).

## Scripts (root `package.json`)

| Script | Mô tả |
|--------|--------|
| `npm run dev:spa` | Chạy Angular (`ng serve`) — UI SPA |
| `npm run dev:electron` | Electron dev (terminal khác cần `dev:spa`) |
| `npm run build:spa-desktop` | **Bundle cho desktop** — production, `baseHref: ./` (cấu hình `desktop`). `package:desktop` gọi lệnh này. |
| `npm run build:spa-hosted` | **Deploy web** (CDN / domain gốc) — `baseHref: /` (xem `app.config.ts`). CI job `web` build bản này. Subpath (`/app/`) → `npx ng build --configuration hosted --base-href /app/` trong `apps/web`. |
| `npm run download:native-binaries` | yt-dlp + ffmpeg → `src/MediaDock.Api/Resources/binaries` |
| `npm run package:desktop` | Đóng gói desktop đầy đủ (API + SPA + installer) |
| `npm run package:desktop:multi-runtime` | Nhiều RID, một lần build SPA ([`scripts/release-desktop-matrix.ps1`](scripts/release-desktop-matrix.ps1)) |

*(Trong `apps/web/angular.json`, Angular CLI vẫn dùng tên target dạng `web:build:…` — đó là builder nội bộ, không trùng với các script ở root.)*

Khác (không bọc trong `package.json`): **Angular test** — `npm run test -w apps/web`; **Electron gói thử** — `npm run build -w apps/desktop-shell`; **.NET** — `dotnet restore|build|test MediaDock.sln` (giống [`.github/workflows/build.yml`](.github/workflows/build.yml)).

Extra release options (`-SkipElectron`, `-SkipBinariesFetch`, `-SkipWebBuild`, …) are documented at the top of [`scripts/release-desktop.ps1`](scripts/release-desktop.ps1).

See also [`scripts/dev.ps1`](scripts/dev.ps1).

## Configuration

- API SQLite + logs: `%LocalAppData%/MediaDock/`
- **Video downloads:** each job writes **directly under** `{downloadsRoot}` (flat; see `GET /api/runtime/downloads`). Default root: `%LocalAppData%/MediaDock/downloads`. Override with `Acquisition:DownloadsRootPath` or persisted DB setting in Settings.
- Runtime file for Electron discovery: `%LocalAppData%/MediaDock/sidecar-runtime.json`
- Development auth: **no token** (see `src/MediaDock.Api/Program.cs`). Production should set `Sidecar__AuthToken`.

## License

TBD.
