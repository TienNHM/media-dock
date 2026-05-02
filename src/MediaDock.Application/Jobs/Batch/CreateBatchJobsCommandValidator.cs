using FluentValidation;

namespace MediaDock.Application.Jobs.Batch;

public sealed class CreateBatchJobsCommandValidator : AbstractValidator<CreateBatchJobsCommand>
{
    public CreateBatchJobsCommandValidator()
    {
        RuleFor(x => x.Urls).NotNull();
        RuleFor(x => x.Urls).Must(urls => urls.Any(u => !string.IsNullOrWhiteSpace(u)))
            .WithMessage("At least one non-empty URL is required.");
    }
}
