using FluentValidation;

namespace MediaDock.Application.Jobs.CreateJob;

public sealed class CreateJobCommandValidator : AbstractValidator<CreateJobCommand>
{
    public CreateJobCommandValidator()
    {
        RuleFor(x => x.Url)
            .NotEmpty()
            .Must(u => Uri.TryCreate(u, UriKind.Absolute, out _))
            .WithMessage("Url must be a valid absolute URI.");
    }
}
