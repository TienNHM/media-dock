using MediatR;

namespace MediaDock.Application.Schedules;

public sealed record DeleteScheduleCommand(Guid Id) : IRequest<bool>;
