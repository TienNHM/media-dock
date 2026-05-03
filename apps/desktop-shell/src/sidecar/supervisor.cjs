const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const { monorepoRoot, publishedApiExe } = require('./content-paths.cjs');

/** @type {import('node:child_process').ChildProcess | undefined} */
let sidecarProc;

/** @deprecated Use monorepoRoot() — kept for main process imports that expect repo paths in dev */
function repoRoot() {
  return monorepoRoot();
}

function dotnetPath() {
  return process.env.DOTNET_ROOT ? path.join(process.env.DOTNET_ROOT, 'dotnet') : 'dotnet';
}

async function pingHealth(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(300, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForLive(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await pingHealth(url)) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Sidecar did not become healthy at ${url}`);
}

/** True if something is accepting TCP connections (API may still be booting). */
function canConnectTcp(host, port, timeoutMs = 350) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function startSidecar() {
  if (sidecarProc) return;

  if (process.env.MEDIADOCK_SKIP_SIDECAR === '1') {
    // eslint-disable-next-line no-console
    console.warn('[MediaDock] MEDIADOCK_SKIP_SIDECAR=1 — not spawning API (use an existing dotnet run / dev.ps1 window).');
    return;
  }

  const apiHost = process.env.MEDIADOCK_API_HOST || '127.0.0.1';
  const apiPort = parseInt(process.env.MEDIADOCK_API_PORT || '17888', 10) || 17888;
  const listenUrl = `http://${apiHost}:${apiPort}`;
  const liveUrl = `${listenUrl}/health/live`;

  const published = publishedApiExe();
  const apiProject = path.join(monorepoRoot(), 'src', 'MediaDock.Api', 'MediaDock.Api.csproj');

  const canDevRun = fs.existsSync(apiProject);

  if (!published && !canDevRun) {
    // eslint-disable-next-line no-console
    console.warn('[MediaDock] Neither published API nor project found; skipping sidecar spawn.', {
      apiProject,
    });
    return;
  }

  // Avoid spawning when an API already answers on this URL.
  if (await pingHealth(liveUrl)) {
    // eslint-disable-next-line no-console
    console.warn(`[MediaDock] API already healthy at ${liveUrl}; skipping sidecar spawn.`);
    return;
  }

  if (await canConnectTcp(apiHost, apiPort)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[MediaDock] Port ${apiPort} is in use; waiting for existing API (avoid duplicate bind)…`,
    );
    await waitForLive(liveUrl, 90_000);
    return;
  }

  const envAsp = published
    ? (process.env.ASPNETCORE_ENVIRONMENT ?? 'Production')
    : (process.env.ASPNETCORE_ENVIRONMENT ?? 'Development');

  if (published) {
    const apiDir = path.dirname(published);
    sidecarProc = spawn(published, [], {
      cwd: apiDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        ASPNETCORE_ENVIRONMENT: envAsp,
        ASPNETCORE_URLS: listenUrl,
        DOTNET_EnableDiagnostics: '0',
      },
    });
    // eslint-disable-next-line no-console
    console.warn('[MediaDock] Starting bundled API:', published);
  } else {
    sidecarProc = spawn(dotnetPath(), ['run', '--project', apiProject, '--configuration', 'Debug'], {
      cwd: monorepoRoot(),
      stdio: 'inherit',
      env: {
        ...process.env,
        ASPNETCORE_ENVIRONMENT: envAsp,
        ASPNETCORE_URLS: listenUrl,
      },
    });
  }

  sidecarProc.on('exit', (code, signal) => {
    // eslint-disable-next-line no-console
    console.warn('[MediaDock] sidecar exited', { code, signal });
    sidecarProc = undefined;
  });

  await waitForLive(liveUrl, 120_000);
}

async function stopSidecar() {
  if (!sidecarProc) return;
  sidecarProc.kill();
  sidecarProc = undefined;
}

module.exports = { startSidecar, stopSidecar, repoRoot };
