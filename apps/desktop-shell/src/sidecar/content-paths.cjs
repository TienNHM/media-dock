const fs = require('node:fs');
const path = require('node:path');

/** @returns {import('electron').App | undefined} */
function electronApp() {
  try {
    const { app } = require('electron');
    return app;
  } catch {
    return undefined;
  }
}

/** Monorepo root (contains apps/api, apps/web). */
function monorepoRoot() {
  return path.resolve(__dirname, '../../../../');
}

/**
 * When packaged with extraResources/to `mediadock`, content lives under `<resources>/mediadock`.
 * In dev use monorepo root as before.
 */
function contentRoot() {
  const ov = process.env.MEDIADOCK_CONTENT_ROOT?.trim();
  if (ov) return path.resolve(ov);

  const packaged = !!(electronApp()?.isPackaged && typeof process.resourcesPath === 'string');
  if (packaged && process.resourcesPath) {
    const bundled = path.join(process.resourcesPath, 'mediadock');
    const marker = path.join(bundled, 'web', 'browser', 'index.html');
    if (fs.existsSync(marker)) return bundled;
  }

  return monorepoRoot();
}

function spaIndexHtml() {
  const cr = contentRoot();
  const published = path.join(cr, 'web', 'browser', 'index.html');
  if (fs.existsSync(published)) return published;
  return path.join(cr, 'apps', 'web', 'dist', 'web', 'browser', 'index.html');
}

/** @returns {string | null} Absolute path to published API executable, if bundled. */
function publishedApiExe() {
  const cr = contentRoot();
  const apiRoot = path.join(cr, 'api');
  const winExe = path.join(apiRoot, 'MediaDock.Api.exe');
  const macLinux = path.join(apiRoot, 'MediaDock.Api');
  if (process.platform === 'win32' && fs.existsSync(winExe)) return winExe;
  if (fs.existsSync(macLinux)) return macLinux;
  return null;
}

module.exports = { electronApp, monorepoRoot, contentRoot, spaIndexHtml, publishedApiExe };
