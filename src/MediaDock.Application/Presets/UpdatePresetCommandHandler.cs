using MediaDock.Application.Ports.Presets;
using MediatR;

namespace MediaDock.Application.Presets;

public sealed class UpdatePresetCommandHandler(IPresetRepository presets) : IRequestHandler<UpdatePresetCommand, bool>
{
    public async Task<bool> Handle(UpdatePresetCommand request, CancellationToken cancellationToken)
    {
        var p = await presets.GetByIdAsync(request.Id, cancellationToken);
        if (p is null)
            return false;

        if (request.IsDefault)
        {
            var all = await presets.ListAsync(cancellationToken);
            foreach (var x in all.Where(x => x.IsDefault && x.Id != request.Id))
                x.IsDefault = false;
        }

        p.Name = request.Name.Trim();
        p.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        p.SpecJson = string.IsNullOrWhiteSpace(request.SpecJson) ? "{}" : request.SpecJson.Trim();
        p.IsDefault = request.IsDefault;
        p.UpdatedAt = DateTime.UtcNow;
        await presets.SaveChangesAsync(cancellationToken);
        return true;
    }
}
