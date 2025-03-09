console.log('Starting preload.cjs execution...');
try {
  console.log('Checking process context...');
  if (typeof process === 'undefined') throw new Error('Process object not available in preload');
  console.log('Process context available');

  console.log('Attempting to require electron...');
  const { contextBridge, ipcRenderer } = require('electron');
  if (!contextBridge || !ipcRenderer) throw new Error('contextBridge or ipcRenderer not available');
  console.log('contextBridge and ipcRenderer available');

  console.log('Setting up contextBridge...');
  contextBridge.exposeInMainWorld('deskTango', {
    getMonitors: async () => {
      console.log('getMonitors called, invoking IPC...');
      const displays = await ipcRenderer.invoke('get-monitors');
      console.log('getMonitors received:', displays);
      return displays;
    }
  });
  console.log('deskTango exposed successfully');
} catch (err) {
  console.error('Preload execution failed:', err.stack);
}
console.log('Preload.cjs execution completed');