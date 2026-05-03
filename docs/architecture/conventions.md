# Kiến trúc & quy ước (tham chiếu nhanh)

## Nguyên tắc bố cục (1 câu)

| Cây thư mục | Chỉ chứa |
|-------------|----------|
| **`src/`** (thư mục ở **root repo**) | Toàn bộ C#: API host, worker host, thư viện, test. *(Không gói trong `dotnet/`.)* |
| **`apps/`** | Chỉ ứng dụng **frontend / desktop** (Angular, Electron). Không đặt project .NET ở đây. |
| **`scripts/`** | Automation (PowerShell), kèm `scripts/packaging/` cho manifest pin binary (dùng dần cho CI). NPM workspaces: chỉ `apps/web`, `apps/desktop-shell` (xem root `package.json`). |

CI GitHub Actions: [`.github/workflows/build.yml`](../../.github/workflows/build.yml) — không dùng thư mục `infrastructure/` rời rạc.

Chi tiết quyết định nền: [`docs/adr/0001-monorepo-and-sidecar.md`](../adr/0001-monorepo-and-sidecar.md).

Tham chiếu phân lớp kiểu **ABP** (không dùng framework, chỉ chuẩn hóa tư duy): [`docs/architecture/abp-inspired-practices.md`](abp-inspired-practices.md).

## .NET (`src/` ở root)

- **`MediaDock.Api`** — ASP.NET Core: HTTP, SignalR, endpoint, composition root cho bản desktop/in-process worker.
- **`MediaDock.Worker`** — host worker độc lập (tách deploy sau này).
- **`MediaDock.Domain`** — entity/value object.
- **`MediaDock.Application`** — MediatR, port (`Ports/`), FluentValidation.
- **`MediaDock.Infrastructure`** — EF/SQLite, repository, acquisition (yt-dlp/ffmpeg), durable queue hosted services, OS notification stub, binary health check — *gom trong một assembly để solution gọn*, vẫn tách folder theo nghiệp vụ.

Thứ tự phụ thuộc: **Domain không reference project MediaDock khác**. Application chỉ phụ thuộc Domain (+ port). Infrastructure implement port và chứa hạ tầng kỹ thuật; **Api** và **Worker** chỉ tham chiếu Application + Infrastructure (và Worker không cần reference riêng tới queue/acquisition nữa).

MSBuild chung: [`Directory.Build.props`](../../Directory.Build.props). Package versions: [`Directory.Packages.props`](../../Directory.Packages.props).

## Angular (`apps/web`)

- Import: **`@app/*`** → `src/app/*`; **`@web-root/*`** → góc package web (ví dụ `package.json`).
- **`core/`** — HTTP, config, model, state dùng lại.
- **`features/<name>/`** — theo route; lazy-load trong `app.routes.ts`.
- **`layout/`** — shell.

## Mở rộng

- **HTTP / SignalR mới**: endpoint trong `src/MediaDock.Api`, xử lý trong `MediaDock.Application`, persistence trong Infrastructure nếu cần.
- **Màn hình mới**: `apps/web/src/app/features/...` + route; service API trong `core/services/` nếu tái sử dụng.
