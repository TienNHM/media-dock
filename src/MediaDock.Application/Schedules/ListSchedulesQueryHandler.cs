using MediatR;
using MediaDock.Application.Ports.Schedules;
using MediaDock.Domain.Schedules;

namespace MediaDock.Application.Schedules;

public sealed class ListSchedulesQueryHandler(IScheduleRepository schedules)
    : IRequestHandler<ListSchedulesQuery, IReadOnlyList<Schedule>>
{
    public Task<IReadOnlyList<Schedule>> Handle(ListSchedulesQuery request, CancellationToken cancellationToken) =>
        schedules.ListAsync(cancellationToken);
}
