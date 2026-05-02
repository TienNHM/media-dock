const { Menu, app } = require('electron');

const LABELS = {
  en: {
    about: 'About MediaDock',
    services: 'Services',
    hide: 'Hide MediaDock',
    hideOthers: 'Hide Others',
    unhide: 'Show All',
    quitApp: 'Quit MediaDock',
    file: 'File',
    edit: 'Edit',
    view: 'View',
    window: 'Window',
    help: 'Help',
    close: 'Close',
    quit: 'Exit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    pasteAndMatchStyle: 'Paste and Match Style',
    delete: 'Delete',
    selectAll: 'Select All',
    speech: 'Speech',
    startSpeaking: 'Start Speaking',
    stopSpeaking: 'Stop Speaking',
    reload: 'Reload',
    forceReload: 'Force Reload',
    toggleDevTools: 'Toggle Developer Tools',
    resetZoom: 'Actual Size',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    toggleFullscreen: 'Toggle Full Screen',
    minimize: 'Minimize',
    zoom: 'Zoom',
    front: 'Bring All to Front',
  },
  vi: {
    about: 'Giới thiệu MediaDock',
    services: 'Dịch vụ',
    hide: 'Ẩn MediaDock',
    hideOthers: 'Ẩn các phần khác',
    unhide: 'Hiện tất cả',
    quitApp: 'Thoát MediaDock',
    file: 'Tệp',
    edit: 'Sửa',
    view: 'Xem',
    window: 'Cửa sổ',
    help: 'Trợ giúp',
    close: 'Đóng',
    quit: 'Thoát',
    undo: 'Hoàn tác',
    redo: 'Làm lại',
    cut: 'Cắt',
    copy: 'Sao chép',
    paste: 'Dán',
    pasteAndMatchStyle: 'Dán và khớp định dạng',
    delete: 'Xóa',
    selectAll: 'Chọn tất cả',
    speech: 'Giọng nói',
    startSpeaking: 'Bắt đầu đọc',
    stopSpeaking: 'Dừng đọc',
    reload: 'Tải lại',
    forceReload: 'Tải lại bắt buộc',
    toggleDevTools: 'Bật/tắt DevTools',
    resetZoom: 'Kích thước gốc',
    zoomIn: 'Phóng to',
    zoomOut: 'Thu nhỏ',
    toggleFullscreen: 'Toàn màn hình',
    minimize: 'Thu nhỏ',
    zoom: 'Phóng to cửa sổ',
    front: 'Đưa tất cả lên phía trước',
  },
};

/** @returns {'en' | 'vi'} */
function coerceLang(lang) {
  const s = String(lang ?? '').toLowerCase();
  return s === 'vi' ? 'vi' : 'en';
}

/**
 * Apply OS menu bar strings (Electron main process — not Angular).
 * @param {'en' | 'vi'} lang
 */
function setApplicationMenuFromLocale(lang) {
  const code = coerceLang(lang);
  const L = LABELS[code];
  const isMac = process.platform === 'darwin';

  /** @type {Electron.MenuItemConstructorOptions[]} */
  const template = [];

  if (isMac) {
    template.push({
      label: app.name,
      submenu: [
        { role: 'about', label: L.about },
        { type: 'separator' },
        { role: 'services', label: L.services },
        { type: 'separator' },
        { role: 'hide', label: L.hide },
        { role: 'hideOthers', label: L.hideOthers },
        { role: 'unhide', label: L.unhide },
        { type: 'separator' },
        { role: 'quit', label: L.quitApp },
      ],
    });
  }

  template.push({
    label: L.file,
    submenu: isMac ? [{ role: 'close', label: L.close }] : [{ role: 'quit', label: L.quit }],
  });

  const editSubmenu = [
    { role: 'undo', label: L.undo },
    { role: 'redo', label: L.redo },
    { type: 'separator' },
    { role: 'cut', label: L.cut },
    { role: 'copy', label: L.copy },
    { role: 'paste', label: L.paste },
    ...(isMac
      ? [
          { role: 'pasteAndMatchStyle', label: L.pasteAndMatchStyle },
          { role: 'delete', label: L.delete },
          { role: 'selectAll', label: L.selectAll },
          { type: 'separator' },
          {
            label: L.speech,
            submenu: [
              { role: 'startSpeaking', label: L.startSpeaking },
              { role: 'stopSpeaking', label: L.stopSpeaking },
            ],
          },
        ]
      : [
          { role: 'pasteAndMatchStyle', label: L.pasteAndMatchStyle },
          { role: 'delete', label: L.delete },
          { role: 'selectAll', label: L.selectAll },
        ]),
  ];

  template.push({ label: L.edit, submenu: editSubmenu });

  template.push({
    label: L.view,
    submenu: [
      { role: 'reload', label: L.reload },
      { role: 'forceReload', label: L.forceReload },
      { role: 'toggleDevTools', label: L.toggleDevTools },
      { type: 'separator' },
      { role: 'resetZoom', label: L.resetZoom },
      { role: 'zoomIn', label: L.zoomIn },
      { role: 'zoomOut', label: L.zoomOut },
      { type: 'separator' },
      { role: 'togglefullscreen', label: L.toggleFullscreen },
    ],
  });

  template.push({
    label: L.window,
    submenu: [
      { role: 'minimize', label: L.minimize },
      { role: 'zoom', label: L.zoom },
      ...(isMac ? [{ type: 'separator' }, { role: 'front', label: L.front }] : [{ role: 'close', label: L.close }]),
    ],
  });

  if (!isMac) {
    template.push({
      label: L.help,
      submenu: [
        {
          label: L.about,
          click: async () => {
            const { dialog } = require('electron');
            await dialog.showMessageBox({
              type: 'info',
              title: L.about,
              message: `${app.name} ${app.getVersion?.() ?? ''}`.trim(),
            });
          },
        },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = {
  coerceLang,
  setApplicationMenuFromLocale,
};
