using MediatR;
using MediaDock.Domain.Jobs;

namespace MediaDock.Application.Jobs.Library;

public sealed record GetLibraryArtifactPreviewQuery(Guid JobId, Guid ArtifactId)
    : IRequest<LibraryArtifactPreview?>;

public sealed record LibraryArtifactPreview(string FullPath, string ContentType, string FileName);
