using MediaDock.Api.Auth;

namespace MediaDock.Api.Middleware;

/// <summary>
/// Validates X-MediaDock-Token when a shared token is configured.
/// </summary>
public sealed class LocalSidecarAuthMiddleware(RequestDelegate next, SidecarRuntimeAuth runtimeAuth)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (string.IsNullOrWhiteSpace(runtimeAuth.Token))
        {
            await next(context);
            return;
        }

        if (context.Request.Path.StartsWithSegments("/health"))
        {
            await next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue("X-MediaDock-Token", out var supplied) ||
            !string.Equals(supplied.ToString(), runtimeAuth.Token, StringComparison.Ordinal))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }

        await next(context);
    }
}

public static class LocalSidecarAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseLocalSidecarAuth(this IApplicationBuilder app) =>
        app.UseMiddleware<LocalSidecarAuthMiddleware>();
}
