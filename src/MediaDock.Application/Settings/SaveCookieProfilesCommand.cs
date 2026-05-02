using MediatR;
using MediaDock.Application.Ports.Settings;

namespace MediaDock.Application.Settings;

public sealed record SaveCookieProfilesCommand(IReadOnlyList<CookieProfileDto> Profiles) : IRequest<Unit>;
