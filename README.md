# MediaDock

Desktop-first **Media Acquisition Platform** (Electron + Angular + ASP.NET Core 9 + SQLite) per the architecture plan in `.cursor/plans/`.

## Prerequisites

- .NET SDK 9+
- Node.js 20+ / npm 10+

## Real downloads (Windows)

1. Fetch **yt-dlp** and **ffmpeg** into `apps/api/Resources/binaries/` (copied to the API output on build):

   ```powershell
   npm run fetch:binaries
   ```

   Or: `powershell -File scripts/fetch-binaries.ps1`. If the pinned ffmpeg URL 404s, install [ffmpeg](https://ffmpeg.org/download.html) yourself and copy `ffmpeg.exe` next to `yt-dlp.exe`, or set `Acquisition:FfmpegPath` in configuration.

2. Restart the API so `Resources/binaries` is copied to `bin/.../Resources/binaries/`.

3. Confirm: `GET http://127.0.0.1:17888/health/binaries` should report **Healthy** (not “stub mode” / missing ffmpeg).

4. Optional: set `Acquisition:UseStubWhenBinaryMissing` to `false` (user secrets or env) so missing binaries fail fast instead of using stubs.

JSON API responses serialize `JobStatus` as strings (`"Queued"`, …) for the Angular UI.

## Quick start (development)

### 1) API sidecar

```powershell
dotnet run --project apps/api/MediaDock.Api.csproj
```

- HTTP: `http://127.0.0.1:17888`
- Health: `GET /health/live`, `GET /health/ready`, `GET /health/binaries`
- Jobs: `POST /api/jobs`, `GET /api/jobs`
- SignalR hub: `/hubs/jobs` (`jobProgress` events)

### 2) Angular UI

```powershell
npm run web:dev
```

Open `http://localhost:4200`.

### 3) Electron shell (optional)

In another terminal:

```powershell
npm run desktop:dev
```

The desktop shell attempts to spawn the API via `dotnet run` and opens the web dev server URL.

## Monorepo layout

- `apps/api` — ASP.NET Core host (API + worker in-process)
- `apps/worker` — standalone worker host (SaaS split stub)
- `apps/web` — Angular + PrimeNG (Aura) UI
- `apps/desktop-shell` — Electron main/preload/sidecar supervisor
- `src/*` — .NET modular monolith projects

## Scripts

| Script | Description |
|--------|-------------|
| `npm run web:dev` | Angular dev server |
| `npm run web:build` | Angular production build |
| `npm run desktop:dev` | Electron (dev) |

See also [`scripts/dev.ps1`](scripts/dev.ps1).

## Configuration

- API SQLite + logs: `%LocalAppData%/MediaDock/`
- Runtime file for Electron discovery: `%LocalAppData%/MediaDock/sidecar-runtime.json`
- Development auth: **no token** (see `apps/api/Program.cs`). Production should set `Sidecar__AuthToken`.

## License

TBD.
