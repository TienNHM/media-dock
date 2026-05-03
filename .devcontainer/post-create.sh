#!/usr/bin/env bash
set -euo pipefail

echo "== Installing system packages (ffmpeg, yt-dlp) =="
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ffmpeg yt-dlp
sudo rm -rf /var/lib/apt/lists/*

echo "== Installing npm dependencies (workspaces) =="
npm ci

echo "== Restoring .NET solution =="
dotnet restore MediaDock.sln

echo "== Done. Typical dev:"
echo "  Terminal 1: dotnet run --project src/MediaDock.Api/MediaDock.Api.csproj"
echo "  Terminal 2: npm run dev:spa"
echo "  Electron (dev:electron) is not set up for headless Linux; use desktop host or GUI forwarding if needed."
