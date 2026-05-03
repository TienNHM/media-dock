const { app, BrowserWindow, ipcMain, shell, nativeTheme } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { startSidecar, stopSidecar } = require('../sidecar/supervisor.cjs');
const { spaIndexHtml } = require('../sidecar/content-paths.cjs');
const {
  coerceLang,
  setApplicationMenuFromLocale,
} = require('./menu-locale.cjs');

/** @type {import('electron').BrowserWindow | undefined} */
let mainWindow;

ipcMain.handle('mediadock:openExternal', async (_event, url) => {
  await shell.openExternal(String(url));
});

function assertAbsoluteFilePath(p) {
  const s = String(p ?? '').trim();
  if (!s || !path.isAbsolute(s)) throw new Error('Invalid path');
  return s;
}

ipcMain.handle('mediadock:showItemInFolder', async (_event, fullPath) => {
  const p = assertAbsoluteFilePath(fullPath);
  shell.showItemInFolder(p);
});

function localePrefsPath() {
  return path.join(app.getPath('userData'), 'mediadock-locale.json');
}

function readStoredAppLang() {
  try {
    const raw = fs.readFileSync(localePrefsPath(), 'utf8');
    const j = JSON.parse(raw);
    return coerceLang(j?.lang);
  } catch {
    try {
      return coerceLang(app.getLocale?.());
    } catch {
      return 'en';
    }
  }
}

function writeStoredAppLang(lang) {
  try {
    fs.mkdirSync(path.dirname(localePrefsPath()), { recursive: true });
    fs.writeFileSync(localePrefsPath(), JSON.stringify({ lang: coerceLang(lang) }, null, 0), 'utf8');
  } catch {
    /* ignore */
  }
}

ipcMain.handle('mediadock:setMenuLocale', (_event, lang) => {
  const code = coerceLang(lang);
  writeStoredAppLang(code);
  setApplicationMenuFromLocale(code);
});

function sidecarRuntimeJsonPath() {
  if (process.platform === 'win32') {
    const la = process.env.LOCALAPPDATA;
    if (la) return path.join(la, 'MediaDock', 'sidecar-runtime.json');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'MediaDock', 'sidecar-runtime.json');
  }
  const xdg = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  return path.join(xdg, 'MediaDock', 'sidecar-runtime.json');
}

ipcMain.handle('mediadock:sidecarRuntime', () => {
  try {
    const fp = sidecarRuntimeJsonPath();
    const raw = fs.readFileSync(fp, 'utf8');
    const j = JSON.parse(raw);
    const port = typeof j.Port === 'number' ? j.Port : typeof j.port === 'number' ? j.port : 17888;
    const authToken =
      typeof j.AuthToken === 'string' ? j.AuthToken : typeof j.authToken === 'string' ? j.authToken : '';
    const apiBaseUrl = `http://127.0.0.1:${port}`;
    return { port, authToken, apiBaseUrl };
  } catch {
    return {
      port: 17888,
      authToken: '',
      apiBaseUrl: 'http://127.0.0.1:17888',
    };
  }
});

ipcMain.handle('mediadock:previewVideo', async (_event, fullPath) => {
  const p = assertAbsoluteFilePath(fullPath);
  await fs.promises.access(p, fs.constants.R_OK);
  const fileUrl = pathToFileURL(p).href;
  const safeAttr = fileUrl.replace(/"/g, '&quot;');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title></head><body style="margin:0;background:#0b0c0e;display:flex;align-items:center;justify-content:center;min-height:100vh"><video controls autoplay playsinline style="max-width:100%;max-height:100vh" src="${safeAttr}"></video></body></html>`;
  const child = new BrowserWindow({
    width: 1100,
    height: 720,
    title: path.basename(p),
    autoHideMenuBar: true,
    backgroundColor: '#0b0c0e',
    webPreferences: {
      sandbox: false,
      webSecurity: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await child.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
});

function createWindow() {
  nativeTheme.themeSource = 'dark';

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1100,
    minHeight: 720,
    title: 'MediaDock',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const devUrl = process.env.MEDIADOCK_WEB_URL ?? 'http://localhost:4200';
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL(devUrl).catch(() => {
      // If the Angular dev server isn't up yet, still open the window; user can refresh.
      void mainWindow?.loadURL('data:text/html,<meta charset=utf-8><p>Start the web app: <code>npm run dev:spa</code></p>');
    });
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(spaIndexHtml());
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  setApplicationMenuFromLocale(readStoredAppLang());

  try {
    await startSidecar();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[MediaDock] sidecar failed to start', e);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  await stopSidecar();
});
