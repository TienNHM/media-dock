using MediatR;

namespace MediaDock.Application.Schedules;

public sealed record UpdateScheduleCommand(
    Guid Id,
    string Cron,
    string Timezone,
    string JobTemplateJson,
    bool Enabled) : IRequest<bool>;
