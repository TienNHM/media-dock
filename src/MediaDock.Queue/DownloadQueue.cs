using System.Threading.Channels;
using MediaDock.Application.Ports.Queue;

namespace MediaDock.Queue;

public sealed class DownloadQueue : IDownloadQueue
{
    private readonly Channel<JobEnvelope> _channel = Channel.CreateBounded<JobEnvelope>(new BoundedChannelOptions(1024)
    {
        FullMode = BoundedChannelFullMode.Wait,
        SingleReader = true,
        SingleWriter = false
    });

    public ValueTask EnqueueAsync(JobEnvelope envelope, CancellationToken cancellationToken = default) =>
        _channel.Writer.WriteAsync(envelope, cancellationToken);

    public ValueTask<JobEnvelope> DequeueAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAsync(cancellationToken);
}
