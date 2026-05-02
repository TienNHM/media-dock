using MediatR;

namespace MediaDock.Application.Jobs.Library;

public sealed record ListLibraryQuery(int Take = 100) : IRequest<IReadOnlyList<LibraryItemDto>>;

public sealed record LibraryItemDto(
    Guid JobId,
    string Url,
    string SourcePlatform,
    DateTime CompletedAt,
    IReadOnlyList<LibraryArtifactDto> Files);

public sealed record LibraryArtifactDto(Guid Id, string Kind, string Path, long? SizeBytes);
