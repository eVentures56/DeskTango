import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
console.log('Electron starting...');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    transparent: true,
    frame: false,
    alwaysOnTop: true,
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

  return win;
}

let mainWindow;

app.whenReady().then(() => {
  console.log('App ready...');
  mainWindow = createWindow();

  ipcMain.handle('get-monitors', () => {
    console.log('Main process: get-monitors called');
    return screen.getAllDisplays().map(display => ({
      id: display.id,
      bounds: display.bounds,
    }));
  });

  ipcMain.handle('move-window', async (event, { windowId, monitorId }) => {
    console.log(`Main process: move-window called with windowId=${windowId}, monitorId=${monitorId}`);
    const win = BrowserWindow.fromId(windowId);
    if (!win) {
      console.error(`Window with ID ${windowId} not found`);
      return { success: false, error: 'Window not found' };
    }

    if (monitorId === null) {
      const currentBounds = win.getBounds();
      console.log(`Returning current bounds for window ${windowId}:`, currentBounds);
      return { success: true, bounds: currentBounds };
    }

    const displays = screen.getAllDisplays();
    const targetDisplay = displays.find(d => d.id === monitorId);
    if (targetDisplay) {
      console.log(`Moving window ${windowId} to monitor ${monitorId} at bounds:`, targetDisplay.bounds);
      const newBounds = {
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: win.getBounds().width,
        height: win.getBounds().height,
      };
      win.setBounds(newBounds);
      return { success: true, bounds: newBounds };
    }

    console.error(`Monitor with ID ${monitorId} not found`);
    return { success: false, error: 'Monitor not found' };
  });

  ipcMain.handle('save-scenario', async (event, name) => {
    console.log(`Main process: save-scenario called with name=${name}`);
    const windows = BrowserWindow.getAllWindows().map(win => ({
      id: win.id,
      bounds: win.getBounds(),
    }));
    const scenariosFile = join(__dirname, 'scenarios.json');
    try {
      let data = {};
      try {
        const fileData = await readFile(scenariosFile, 'utf8');
        data = JSON.parse(fileData);
        // Handle old format: if data doesn't have a "scenarios" key, assume it's the old format
        if (!data.scenarios) {
          data = { scenarios: data, points: 0, theme: 'dark' };
        }
      } catch (err) {
        console.log('No existing scenarios file, creating new one');
      }
      data.scenarios = data.scenarios || {};
      data.scenarios[name] = windows;
      await writeFile(scenariosFile, JSON.stringify(data, null, 2));
      return { success: true, windows };
    } catch (err) {
      console.error(`Failed to save scenario ${name}:`, err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('load-scenario', async (event, name) => {
    console.log(`Main process: load-scenario called with name=${name}`);
    const scenariosFile = join(__dirname, 'scenarios.json');
    try {
      const fileData = await readFile(scenariosFile, 'utf8');
      const data = JSON.parse(fileData);
      let scenarios;
      // Handle both old and new formats
      if (data.scenarios) {
        scenarios = data.scenarios;
      } else {
        scenarios = data; // Old format
      }
      if (scenarios[name]) {
        const windows = scenarios[name];
        windows.forEach(winData => {
          const win = BrowserWindow.fromId(winData.id);
          if (win) win.setBounds(winData.bounds);
        });
        return { success: true };
      } else {
        return { success: false, error: `Scenario ${name} not found` };
      }
    } catch (err) {
      console.error(`Failed to load scenario ${name}:`, err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('load-scenarios', async () => {
    console.log('Main process: load-scenarios called');
    const scenariosFile = join(__dirname, 'scenarios.json');
    try {
      const fileData = await readFile(scenariosFile, 'utf8');
      const data = JSON.parse(fileData);
      let scenarios;
      let points = 0;
      let theme = 'dark';
      // Handle both old and new formats
      if (data.scenarios) {
        scenarios = data.scenarios;
        points = data.points || 0;
        theme = data.theme || 'dark';
      } else {
        scenarios = data; // Old format
      }
      return {
        success: true,
        scenarios: Object.entries(scenarios).map(([name, windows]) => ({ name, windows })),
        points,
        theme,
      };
    } catch (err) {
      console.log('No scenarios file or error loading:', err);
      return { success: true, scenarios: [], points: 0, theme: 'dark' };
    }
  });

  ipcMain.handle('update-points', async (event, newPoints) => {
    console.log(`Main process: update-points called with points=${newPoints}`);
    const scenariosFile = join(__dirname, 'scenarios.json');
    try {
      let data = {};
      try {
        const fileData = await readFile(scenariosFile, 'utf8');
        data = JSON.parse(fileData);
        // Handle old format
        if (!data.scenarios) {
          data = { scenarios: data, points: 0, theme: 'dark' };
        }
      } catch (err) {
        console.log('No existing scenarios file, creating new one');
      }
      data.points = newPoints;
      await writeFile(scenariosFile, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (err) {
      console.error('Failed to update points:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('update-theme', async (event, newTheme) => {
    console.log(`Main process: update-theme called with theme=${newTheme}`);
    const scenariosFile = join(__dirname, 'scenarios.json');
    try {
      let data = {};
      try {
        const fileData = await readFile(scenariosFile, 'utf8');
        data = JSON.parse(fileData);
        // Handle old format
        if (!data.scenarios) {
          data = { scenarios: data, points: 0, theme: 'dark' };
        }
      } catch (err) {
        console.log('No existing scenarios file, creating new one');
      }
      data.theme = newTheme;
      await writeFile(scenariosFile, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (err) {
      console.error('Failed to update theme:', err);
      return { success: false, error: err.message };
    }
  });

  console.log('Registering Ctrl+Alt+D...');
  const registration = globalShortcut.register('Ctrl+Alt+D', () => {
    console.log('Ctrl+Alt+D triggered, visibility:', mainWindow.isVisible());
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  if (!registration) {
    console.error('Failed to register Ctrl+Alt+D shortcut - possible OS conflict');
  } else {
    console.log('Ctrl+Alt+D shortcut registered successfully');
  }

  const altRegistration = globalShortcut.register('F5', () => {
    console.log('F5 triggered, visibility:', mainWindow.isVisible());
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
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