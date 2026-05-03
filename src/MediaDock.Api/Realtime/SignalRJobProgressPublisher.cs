using MediaDock.Application.Ports.Progress;
using MediaDock.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace MediaDock.Api.Realtime;

public sealed class SignalRJobProgressPublisher(IHubContext<JobsHub> hub) : IJobProgressPublisher
{
    public Task PublishAsync(JobProgressDto progress, CancellationToken cancellationToken = default) =>
        hub.Clients.All.SendAsync("jobProgress", progress, cancellationToken);
}
