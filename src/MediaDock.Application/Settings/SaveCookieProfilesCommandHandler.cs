using MediatR;
using MediaDock.Application.Ports.Settings;

namespace MediaDock.Application.Settings;

public sealed class SaveCookieProfilesCommandHandler(ICookieProfileStore store)
    : IRequestHandler<SaveCookieProfilesCommand, Unit>
{
    public async Task<Unit> Handle(SaveCookieProfilesCommand request, CancellationToken cancellationToken)
    {
        await store.SaveAllAsync(request.Profiles, cancellationToken);
        return Unit.Value;
    }
}
