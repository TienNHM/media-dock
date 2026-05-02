using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediaDock.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NotificationJobId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "job_id",
                table: "notifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_notifications_job_id",
                table: "notifications",
                column: "job_id");

            migrationBuilder.AddForeignKey(
                name: "fk_notifications_jobs_job_id",
                table: "notifications",
                column: "job_id",
                principalTable: "jobs",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_notifications_jobs_job_id",
                table: "notifications");

            migrationBuilder.DropIndex(
                name: "ix_notifications_job_id",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "job_id",
                table: "notifications");
        }
    }
}
