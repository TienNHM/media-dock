# ADR 0002: Tham chiếu phân lớp kiểu ABP (không adopt framework)

## Status

Accepted

## Context

Team muốn bám **best practices** phổ biến trong hệ sinh thái .NET (đặc biệt [ABP Framework](https://abp.io/)) để dễ onboard, review và mở rộng, trong khi MediaDock vẫn là stack tự chọn (MediatR, Minimal API, EF, không `Volo.Abp.*`).

## Decision

- **Không** thêm dependency ABP vào solution hiện tại.
- **Có** tài liện đối chiếu chính thức: [`docs/architecture/abp-inspired-practices.md`](../architecture/abp-inspired-practices.md), liên kết trực tiếp tới tài liệu ABP về layered structure và application services.
- Code hiện tại (Domain / Application + Ports / Infrastructure gom hạ tầng / Api) được xem là **tương đương chức năng** với mô hình lớp ABP; có thể tách thêm assembly (Contracts, module nhỏ) khi coupling đòi hỏi (xem [`abp-inspired-practices.md`](../architecture/abp-inspired-practices.md)).

## Consequences

- Onboarding có thể dùng từ vựng ABP (Domain, Application, DTO, repository abstraction) mà không học toàn bộ ABP runtime.
- Nếu sau này adopt ABP hoặc tách module, ADR này và doc abp-inspired là điểm bắt đầu traceability.
