# Tham chiếu best practices (ABP Framework)

MediaDock **không** dùng package ABP (`Volo.Abp.*`). Tài liệu này mượn **mô hình phân lớp và thói quen** mà [ABP](https://abp.io/) khuyến nghị, để team cùng ngôn ngữ với cộng đồng .NET lớn và dễ mở rộng sau này (kể cả nếu một ngày tách module hoặc cân nhắc framework).

**Tài liệu gốc ABP (đọc song song):**

- [Layered web application (solution template)](https://abp.io/docs/latest/solution-templates/layered-web-application) — cấu trúc project trong solution nhiều lớp.
- [Domain Driven Design (overview)](https://abp.io/docs/latest/framework/architecture/domain-driven-design) — tinh thần phân lớp Domain / Application / Infrastructure.
- [Application services](https://abp.io/docs/latest/framework/architecture/domain-driven-design/application-services) — một use case rõ ràng, DTO tách entity.
- [Application services — best practices](https://abp.io/docs/latest/framework/architecture/best-practices/application-services) — checklist hành vi tốt.

---

## Bảng đối chiếu nhanh

| Lớp / project trong ABP (ý tưởng) | MediaDock hiện tại | Ghi chú |
|-----------------------------------|--------------------|--------|
| **Domain** | `MediaDock.Domain` | Entity, value object; không phụ thuộc Application/Infrastructure. |
| **Domain.Shared** *(optional trong ABP)* | *(chưa có)* | Có thể thêm sau cho enum/constant dùng chung nhiều host mà không kéo cả Domain. |
| **Application.Contracts** *(tuỳ chọn)* | Hiện **gom** vào Application (commands/queries/handlers cùng solution gọn); có thể tách assembly sau nếu cần boundary rõ cho client. |
| **Application** (use case) | `MediaDock.Application` — MediatR handlers, FluentValidation, `Ports/*` | Tương đương “application service” ABP: một command/query = một luồng nghiệp vụ. |
| **EntityFrameworkCore** / integrations | `MediaDock.Infrastructure` — DB, yt-dlp/ffmpeg, durable queue hosts, stub notification sink | Một assembly, nhiều folder; ít `.csproj` hơn, vẫn tách Concern trong code. |
| **HttpApi** | `MediaDock.Api/Endpoints/*`, `Hubs/*` | ABP thường tách controller project; MediaDock gom minimal API + host — chấp nhận được cho product nhỏ. |
| **HttpApi.Host** | `MediaDock.Api` (cùng project) | Composition root: DI, middleware, `Program.cs`. |

---

## Nguyên tắc ABP “ăn được ngay” (không cần framework)

1. **Domain “thuần”**  
   Entity không phụ thuộc EF, không chứa DTO cho HTTP. Đúng hướng [DDD layers](https://abp.io/docs/latest/framework/architecture/domain-driven-design/layers).

2. **Application = orchestration**  
   Handler MediatR gọi repository/port, publish event, validate — không nhét logic truy cập DB trực tiếp bằng `DbContext` trong Application (trừ khi cố ý và có lý do rất rõ).

3. **Ports (`Application/Ports`) ≈ abstraction hạ tầng**  
   Giống tinh thần ABP: Application định nghĩa **interface**, Infrastructure **implement**. Giữ interface gọn, đặt tên theo nghiệp vụ (`IJobRepository`, `IDownloadQueue`, …).

4. **Một use case — một entry rõ ràng**  
   ABP khuyến khích application service method tập trung; với MediatR: **một `IRequest` + một handler** (đã làm với `CreateJobCommand`, `ListJobsQuery`, …) — tránh handler “làm trăm thứ”.

5. **DTO vs entity**  
   API và Angular nhận DTO/record phù hợp serialization; không expose trực tiếp graph entity phức tạp — trùng với [application service best practices](https://abp.io/docs/latest/framework/architecture/domain-driven-design/application-services).

6. **Validation tại biên Application**  
   FluentValidation + pipeline (đã có `ValidationBehavior`) — tương tự ABP validation trên input DTO.

---

## Hướng tiến hóa (khi repo lớn hơn)

- **Tách `Application.Contracts`** lại thành project riêng nếu sau này cần publish contract cho client mà không kéo cả handlers.
- Thêm **`MediaDock.Domain.Shared`**: chỉ khi enum/constant/permission string cần share giữa Domain và nhiều host mà không muốn reference full Domain.
- **Modular monolith kiểu ABP**: tách bounded context thành folder/module với `DependencyInjection` riêng — có thể làm dần trong cùng solution trước khi tách assembly.

---

## Khi nào nên cân nhắc ABP thật?

Khi cần **module plug-in, permission đa tenant, background job framework, UI theme Razor, code generation CRUD** sẵn — lúc đó migration sang ABP là quyết định sản phẩm/đội lớn, không chỉ “refactor nhẹ”. Trước mắt, bám checklist trên giữ codebase sạch và tương thích tư duy ABP.
