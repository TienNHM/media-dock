using MediatR;
using MediaDock.Domain.Schedules;

namespace MediaDock.Application.Schedules;

public sealed record ListSchedulesQuery : IRequest<IReadOnlyList<Schedule>>;
