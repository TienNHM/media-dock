using System.Security.Cryptography;
using MediaDock.Acquisition;
using MediaDock.Api.Endpoints;
using MediaDock.Api.Hubs;
using MediaDock.Api.Auth;
using MediaDock.Api.Middleware;
using MediaDock.Api.Realtime;
using MediaDock.Api.Runtime;
using MediaDock.Application;
using MediaDock.Application.Ports.Progress;
using MediaDock.Diagnostics;
using MediaDock.Infrastructure;
using MediaDock.Infrastructure.Persistence;
using MediaDock.Notifications;
using MediaDock.Queue;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog(
    (_, cfg) => cfg
        .MinimumLevel.Information()
        .WriteTo.Console()
        .WriteTo.File(
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "MediaDock",
                "_logs",
                "api-.log"),
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 14));

var dataDir = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
    "MediaDock");
Directory.CreateDirectory(dataDir);
Directory.CreateDirectory(Path.Combine(dataDir, "_logs"));
var dbPath = Path.Combine(dataDir, "mediadock.db");
var connectionString = $"Data Source={dbPath}";

var sidecarPort = builder.Configuration.GetValue("Sidecar:Port", 17888);
var authToken = builder.Configuration["Sidecar:AuthToken"];
if (string.IsNullOrWhiteSpace(authToken) && !builder.Environment.IsDevelopment())
    authToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

builder.Services.AddSingleton(new SidecarRuntimeAuth { Token = authToken });

builder.WebHost.UseUrls($"http://127.0.0.1:{sidecarPort}");

builder.Services.Configure<AcquisitionOptions>(builder.Configuration.GetSection(AcquisitionOptions.SectionName));

builder.Services.AddApplication();
builder.Services.AddInfrastructure(connectionString);
builder.Services.AddAcquisition();
builder.Services.AddQueueInfrastructure();
builder.Services.AddSingleton<INotificationSink, NullNotificationSink>();
builder.Services.AddSingleton<IJobProgressPublisher, SignalRJobProgressPublisher>();
builder.Services.AddSingleton<SidecarRuntimeWriter>();

builder.Services.AddHealthChecks()
    .AddDbContextCheck<MediaDockDbContext>("database")
    .AddMediaDockBinaryHealthCheck();

builder.Services.AddSignalR();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyHeader()
        .AllowAnyMethod()
        .SetIsOriginAllowed(_ => true)));

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MediaDockDbContext>();
    await db.Database.MigrateAsync();
}

app.UseSerilogRequestLogging();
app.UseCors();
app.UseLocalSidecarAuth();

if (app.Environment.IsDevelopment())
    app.UseDeveloperExceptionPage();

app.MapOpenApi();
app.MapHealthChecks(
    "/health/ready",
    new HealthCheckOptions { Predicate = r => r.Name is "database" or "binaries" });
app.MapHealthChecks(
    "/health/binaries",
    new HealthCheckOptions { Predicate = r => r.Name == "binaries" });
app.MapGet("/health/live", () => Results.Text("OK", "text/plain"));

app.MapJobsEndpoints();
app.MapHub<JobsHub>("/hubs/jobs");

var writer = app.Services.GetRequiredService<SidecarRuntimeWriter>();
await writer.WriteAsync(sidecarPort, authToken ?? string.Empty, CancellationToken.None);

app.Run();
