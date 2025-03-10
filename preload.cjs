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
      console.log('getMonitors received:', JSON.stringify(displays, null, 2));
      return displays;
    },
    moveWindow: async (windowId, monitorId) => {
      console.log(`moveWindow called with windowId=${windowId}, monitorId=${monitorId}, invoking IPC...`);
      const result = await ipcRenderer.invoke('move-window', { windowId, monitorId });
      console.log('moveWindow result:', JSON.stringify(result, null, 2));
      return result;
    },
    saveScenario: async (name) => {
      console.log(`saveScenario called with name=${name}, invoking IPC...`);
      const result = await ipcRenderer.invoke('save-scenario', name);
      console.log('saveScenario result:', JSON.stringify(result, null, 2));
      return result;
    },
    loadScenario: async (name) => {
      console.log(`loadScenario called with name=${name}, invoking IPC...`);
      const result = await ipcRenderer.invoke('load-scenario', name);
      console.log('loadScenario result:', JSON.stringify(result, null, 2));
      return result;
    },
    loadScenarios: async () => {
      console.log('loadScenarios called, invoking IPC...');
      const result = await ipcRenderer.invoke('load-scenarios');
      console.log('loadScenarios result:', JSON.stringify(result, null, 2));
      return result;
    },
  });
  console.log('deskTango exposed successfully');
} catch (err) {
  console.error('Preload execution failed:', err.stack);
}
console.log('Preload.cjs execution completed');