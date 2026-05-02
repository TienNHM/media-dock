using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http.HttpResults;

namespace MediaDock.Api.ExceptionHandling;

/// <summary>Maps FluentValidation failures to RFC 9457-compatible problem payloads for minimal APIs.</summary>
public sealed class FluentValidationExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not ValidationException vex)
            return false;

        var errors = vex.Errors
            .GroupBy(e =>
                string.IsNullOrEmpty(e.PropertyName) ? string.Empty : e.PropertyName)
            .ToDictionary(
                static g => g.Key.Length > 0 ? g.Key : "request",
                g => g.Select(e => e.ErrorMessage).Distinct().ToArray());

        await TypedResults.ValidationProblem(errors).ExecuteAsync(httpContext);
        return true;
    }
}
