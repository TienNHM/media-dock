using MediaDock.Application.Ports.Presets;
using MediatR;

namespace MediaDock.Application.Presets;

public sealed class DeletePresetCommandHandler(IPresetRepository presets) : IRequestHandler<DeletePresetCommand, bool>
{
    public async Task<bool> Handle(DeletePresetCommand request, CancellationToken cancellationToken)
    {
        var p = await presets.GetByIdAsync(request.Id, cancellationToken);
        if (p is null)
            return false;
        presets.Remove(p);
        await presets.SaveChangesAsync(cancellationToken);
        return true;
    }
}
