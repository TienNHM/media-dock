const { app, BrowserWindow, ipcMain, shell, nativeTheme } = require('electron');
const path = require('node:path');
const { startSidecar, stopSidecar, repoRoot } = require('../sidecar/supervisor.cjs');

/** @type {import('electron').BrowserWindow | undefined} */
let mainWindow;

ipcMain.handle('mediadock:openExternal', async (_event, url) => {
  await shell.openExternal(String(url));
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
      void mainWindow?.loadURL('data:text/html,<meta charset=utf-8><p>Start the web app: <code>npm run web:dev</code></p>');
    });
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexHtml = path.join(repoRoot(), 'apps', 'web', 'dist', 'web', 'browser', 'index.html');
    void mainWindow.loadFile(indexHtml);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
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
