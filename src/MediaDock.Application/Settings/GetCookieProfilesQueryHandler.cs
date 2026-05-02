using MediatR;
using MediaDock.Application.Ports.Settings;

namespace MediaDock.Application.Settings;

public sealed class GetCookieProfilesQueryHandler(ICookieProfileStore store)
    : IRequestHandler<GetCookieProfilesQuery, IReadOnlyList<CookieProfileDto>>
{
    public Task<IReadOnlyList<CookieProfileDto>> Handle(GetCookieProfilesQuery request, CancellationToken cancellationToken) =>
        store.GetAllAsync(cancellationToken);
}
