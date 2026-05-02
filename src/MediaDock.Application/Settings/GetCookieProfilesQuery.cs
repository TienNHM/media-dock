using MediatR;
using MediaDock.Application.Ports.Settings;

namespace MediaDock.Application.Settings;

public sealed record GetCookieProfilesQuery : IRequest<IReadOnlyList<CookieProfileDto>>;
