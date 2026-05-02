const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mediadock', {
  platform: process.platform,
  openExternal: (url) => ipcRenderer.invoke('mediadock:openExternal', url),
  showItemInFolder: (fullPath) => ipcRenderer.invoke('mediadock:showItemInFolder', fullPath),
  previewVideo: (fullPath) => ipcRenderer.invoke('mediadock:previewVideo', fullPath),
});
