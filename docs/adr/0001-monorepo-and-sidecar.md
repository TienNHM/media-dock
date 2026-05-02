# ADR 0001: Monorepo + .NET sidecar

## Status

Accepted

## Context

MediaDock targets a premium desktop workflow with durable acquisition, queueing, and future SaaS portability.

## Decision

- Monorepo with `apps/*` (Electron, Angular, hosts) and `src/*` (.NET modular monolith).
- Desktop uses a **.NET sidecar** (ASP.NET Core + hosted queue runner) rather than Node-only orchestration.
- Angular talks to the sidecar over localhost HTTP + SignalR.

## Consequences

- Clear security boundary (no Node `fs` in renderer).
- Worker host (`apps/worker`) can reuse the same modules for split deployment later.
