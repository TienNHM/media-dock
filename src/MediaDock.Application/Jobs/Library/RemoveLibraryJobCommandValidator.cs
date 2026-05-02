using FluentValidation;

namespace MediaDock.Application.Jobs.Library;

public sealed class RemoveLibraryJobCommandValidator : AbstractValidator<RemoveLibraryJobCommand>
{
    public RemoveLibraryJobCommandValidator()
    {
        RuleFor(x => x.JobId).NotEmpty();
    }
}
