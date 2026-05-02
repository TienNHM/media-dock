const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mediadock', {
  platform: process.platform,
  openExternal: (url) => ipcRenderer.invoke('mediadock:openExternal', url),
});
