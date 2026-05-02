using MediaDock.Domain.Jobs;
using MediaDock.Domain.Notifications;
using MediaDock.Domain.Presets;
using MediaDock.Domain.Schedules;
using MediaDock.Domain.Settings;
using Microsoft.EntityFrameworkCore;

namespace MediaDock.Infrastructure.Persistence;

public sealed class MediaDockDbContext(DbContextOptions<MediaDockDbContext> options) : DbContext(options)
{
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<JobSpec> JobSpecs => Set<JobSpec>();
    public DbSet<JobProgress> JobProgress => Set<JobProgress>();
    public DbSet<JobArtifact> JobArtifacts => Set<JobArtifact>();
    public DbSet<Preset> Presets => Set<Preset>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<AppSetting> Settings => Set<AppSetting>();
    public DbSet<InAppNotification> Notifications => Set<InAppNotification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Job>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.Status, x.Priority, x.ScheduledAt });
            e.HasIndex(x => new { x.SourcePlatform, x.CompletedAt });
            e.HasOne(x => x.CurrentSpec)
                .WithOne(x => x.Job)
                .HasForeignKey<JobSpec>(x => x.JobId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Progress)
                .WithOne(x => x.Job)
                .HasForeignKey<JobProgress>(x => x.JobId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Artifacts)
                .WithOne(x => x.Job)
                .HasForeignKey(x => x.JobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<JobSpec>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.JobId).IsUnique();
        });
        modelBuilder.Entity<JobProgress>(e => e.HasKey(x => x.JobId));
        modelBuilder.Entity<JobArtifact>(e => e.HasKey(x => x.Id));
        modelBuilder.Entity<Preset>(e => e.HasKey(x => x.Id));
        modelBuilder.Entity<Schedule>(e => e.HasKey(x => x.Id));
        modelBuilder.Entity<AppSetting>(e =>
        {
            e.HasKey(x => new { x.Key, x.Scope });
        });
        modelBuilder.Entity<InAppNotification>(e => e.HasKey(x => x.Id));
    }

    public static void ConfigureSqlite(DbContextOptionsBuilder options, string connectionString)
    {
        options.UseSqlite(connectionString, sqlite =>
        {
            sqlite.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
        });
        options.UseSnakeCaseNamingConvention();
    }
}
