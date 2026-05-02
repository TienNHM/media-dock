using MediatR;

namespace MediaDock.Application.Schedules;

public sealed record CreateScheduleCommand(string Cron, string Timezone, string JobTemplateJson, bool Enabled = true)
    : IRequest<Guid>;
