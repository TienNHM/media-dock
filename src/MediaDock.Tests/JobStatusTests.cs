using FluentAssertions;
using MediaDock.Domain.Jobs;
using Xunit;

namespace MediaDock.Tests;

public sealed class JobStatusTests
{
    [Fact]
    public void JobStatus_values_are_stable_for_persistence()
    {
        Enum.GetNames<JobStatus>().Should().Contain("Queued");
        ((int)JobStatus.Queued).Should().Be(3);
    }
}
