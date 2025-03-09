import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
console.log('Electron starting...');


function createWindow() {
  const win = new BrowserWindow({
    width: 300,
    height: 200,
    x: 0,
    y: 0,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true // Secure setting
    },
    transparent: true,
    frame: false,
    alwaysOnTop: true
  });

  console.log('Window created, loading URL...');
  win.loadURL('http://localhost:5173')
    .then(() => console.log('URL loaded successfully'))
    .catch(err => console.error('Failed to load URL:', err.message));
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Renderer failed to load:', errorCode, errorDescription);
  });
  win.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('Preload error at', preloadPath, ':', error.stack);
  });
  win.webContents.on('did-finish-load', () => {
    console.log('Renderer finished loading');
  });
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Console message [${level}]: ${message} (at ${sourceId}:${line})`);
  });
  win.webContents.openDevTools();
  return win;
}

app.whenReady().then(() => {
  console.log('App ready...');
  const win = createWindow();

  // Handle IPC for screen.getAllDisplays
  ipcMain.handle('get-monitors', () => {
    console.log('Main process: get-monitors called');
    return screen.getAllDisplays();
  });

  console.log('Registering Ctrl+Alt+D...');
  const registration = globalShortcut.register('Ctrl+Alt+D', () => {
    console.log('Ctrl+Alt+D triggered, visibility:', win.isVisible());
    win.isVisible() ? win.hide() : win.show();
  });

  if (!registration) {
    console.error('Failed to register Ctrl+Alt+D shortcut - possible OS conflict');
  } else {
    console.log('Ctrl+Alt+D shortcut registered successfully');
  }

  const altRegistration = globalShortcut.register('F5', () => {
    console.log('F5 triggered, visibility:', win.isVisible());
    win.isVisible() ? win.hide() : win.show();
  });

  if (!altRegistration) {
    console.error('Failed to register F5 shortcut');
  } else {
    console.log('F5 shortcut registered successfully');
  }
}).catch(err => console.error('App failed:', err));

app.on('window-all-closed', () => {
  console.log('Window closed, quitting...');
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

console.log('Main process starting...');