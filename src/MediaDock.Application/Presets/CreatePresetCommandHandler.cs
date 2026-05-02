using MediaDock.Application.Ports.Presets;
using MediaDock.Domain.Presets;
using MediatR;

namespace MediaDock.Application.Presets;

public sealed class CreatePresetCommandHandler(IPresetRepository presets) : IRequestHandler<CreatePresetCommand, Guid>
{
    public async Task<Guid> Handle(CreatePresetCommand request, CancellationToken cancellationToken)
    {
        var id = Guid.CreateVersion7();
        var now = DateTime.UtcNow;
        if (request.IsDefault)
        {
            var existing = await presets.ListAsync(cancellationToken);
            foreach (var p in existing.Where(x => x.IsDefault))
            {
                p.IsDefault = false;
            }
        }

        await presets.AddAsync(
            new Preset
            {
                Id = id,
                Name = request.Name.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                SpecJson = string.IsNullOrWhiteSpace(request.SpecJson) ? "{}" : request.SpecJson.Trim(),
                IsDefault = request.IsDefault,
                CreatedAt = now,
                UpdatedAt = now
            },
            cancellationToken);
        await presets.SaveChangesAsync(cancellationToken);
        return id;
    }
}
