const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

/** @type {import('node:child_process').ChildProcess | undefined} */
let sidecarProc;

function repoRoot() {
  // apps/desktop-shell/src/sidecar -> ../../../../ (repo root)
  return path.resolve(__dirname, '../../../../');
}

function dotnetPath() {
  return process.env.DOTNET_ROOT ? path.join(process.env.DOTNET_ROOT, 'dotnet') : 'dotnet';
}

async function waitForLive(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(250, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Sidecar did not become healthy at ${url}`);
}

async function startSidecar() {
  if (sidecarProc) return;

  const apiProject = path.join(repoRoot(), 'apps', 'api', 'MediaDock.Api.csproj');
  if (!fs.existsSync(apiProject)) {
    // eslint-disable-next-line no-console
    console.warn('[MediaDock] API project not found; skipping sidecar spawn:', apiProject);
    return;
  }

  sidecarProc = spawn(dotnetPath(), ['run', '--project', apiProject, '--configuration', 'Debug'], {
    cwd: repoRoot(),
    stdio: 'inherit',
    env: {
      ...process.env,
      ASPNETCORE_ENVIRONMENT: 'Development',
      ASPNETCORE_URLS: 'http://127.0.0.1:17888',
    },
  });

  sidecarProc.on('exit', (code, signal) => {
    // eslint-disable-next-line no-console
    console.warn('[MediaDock] sidecar exited', { code, signal });
    sidecarProc = undefined;
  });

  await waitForLive('http://127.0.0.1:17888/health/live', 60_000);
}

async function stopSidecar() {
  if (!sidecarProc) return;
  sidecarProc.kill();
  sidecarProc = undefined;
}

module.exports = { startSidecar, stopSidecar, repoRoot };
