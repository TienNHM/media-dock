using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediaDock.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "jobs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    parent_job_id = table.Column<Guid>(type: "TEXT", nullable: true),
                    lineage_root_id = table.Column<Guid>(type: "TEXT", nullable: true),
                    url = table.Column<string>(type: "TEXT", nullable: false),
                    source_platform = table.Column<string>(type: "TEXT", nullable: false),
                    status = table.Column<int>(type: "INTEGER", nullable: false),
                    priority = table.Column<int>(type: "INTEGER", nullable: false),
                    preset_id = table.Column<Guid>(type: "TEXT", nullable: true),
                    scheduled_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    attempt = table.Column<int>(type: "INTEGER", nullable: false),
                    last_error_class = table.Column<string>(type: "TEXT", nullable: true),
                    last_error_message = table.Column<string>(type: "TEXT", nullable: true),
                    correlation_id = table.Column<string>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    completed_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jobs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    type = table.Column<string>(type: "TEXT", nullable: false),
                    title = table.Column<string>(type: "TEXT", nullable: false),
                    body = table.Column<string>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    read_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notifications", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "presets",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    description = table.Column<string>(type: "TEXT", nullable: true),
                    spec_json = table.Column<string>(type: "TEXT", nullable: false),
                    is_default = table.Column<bool>(type: "INTEGER", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_presets", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "schedules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    cron = table.Column<string>(type: "TEXT", nullable: false),
                    timezone = table.Column<string>(type: "TEXT", nullable: false),
                    job_template_json = table.Column<string>(type: "TEXT", nullable: false),
                    next_run_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    last_run_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    enabled = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_schedules", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "settings",
                columns: table => new
                {
                    key = table.Column<string>(type: "TEXT", nullable: false),
                    scope = table.Column<int>(type: "INTEGER", nullable: false),
                    value_json = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_settings", x => new { x.key, x.scope });
                });

            migrationBuilder.CreateTable(
                name: "job_artifacts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    job_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    kind = table.Column<int>(type: "INTEGER", nullable: false),
                    path = table.Column<string>(type: "TEXT", nullable: false),
                    size_bytes = table.Column<long>(type: "INTEGER", nullable: true),
                    sha256 = table.Column<string>(type: "TEXT", nullable: true),
                    mime_type = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_artifacts", x => x.id);
                    table.ForeignKey(
                        name: "fk_job_artifacts_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "job_progress",
                columns: table => new
                {
                    job_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    bytes_done = table.Column<long>(type: "INTEGER", nullable: true),
                    bytes_total = table.Column<long>(type: "INTEGER", nullable: true),
                    speed_bps = table.Column<double>(type: "REAL", nullable: true),
                    eta_seconds = table.Column<int>(type: "INTEGER", nullable: true),
                    phase = table.Column<string>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_progress", x => x.job_id);
                    table.ForeignKey(
                        name: "fk_job_progress_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "job_specs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    job_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    attempt = table.Column<int>(type: "INTEGER", nullable: false),
                    spec_json = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_specs", x => x.id);
                    table.ForeignKey(
                        name: "fk_job_specs_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_job_artifacts_job_id",
                table: "job_artifacts",
                column: "job_id");

            migrationBuilder.CreateIndex(
                name: "ix_job_specs_job_id",
                table: "job_specs",
                column: "job_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_jobs_source_platform_completed_at",
                table: "jobs",
                columns: new[] { "source_platform", "completed_at" });

            migrationBuilder.CreateIndex(
                name: "ix_jobs_status_priority_scheduled_at",
                table: "jobs",
                columns: new[] { "status", "priority", "scheduled_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "job_artifacts");

            migrationBuilder.DropTable(
                name: "job_progress");

            migrationBuilder.DropTable(
                name: "job_specs");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "presets");

            migrationBuilder.DropTable(
                name: "schedules");

            migrationBuilder.DropTable(
                name: "settings");

            migrationBuilder.DropTable(
                name: "jobs");
        }
    }
}
