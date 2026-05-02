# MediaDock

Desktop-first **Media Acquisition Platform** (Electron + Angular + ASP.NET Core 9 + SQLite) per the architecture plan in `.cursor/plans/`.

## Prerequisites

- .NET SDK 9+
- Node.js 20+ / npm 10+

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
