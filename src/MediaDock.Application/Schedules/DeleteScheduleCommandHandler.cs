using MediaDock.Application.Ports.Schedules;
using MediatR;

namespace MediaDock.Application.Schedules;

public sealed class DeleteScheduleCommandHandler(IScheduleRepository schedules) : IRequestHandler<DeleteScheduleCommand, bool>
{
    public async Task<bool> Handle(DeleteScheduleCommand request, CancellationToken cancellationToken)
    {
        var s = await schedules.GetByIdAsync(request.Id, cancellationToken);
        if (s is null)
            return false;
        schedules.Remove(s);
        await schedules.SaveChangesAsync(cancellationToken);
        return true;
    }
}
