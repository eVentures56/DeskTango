declare global {
    interface Window {
      deskTango: {
        getMonitors: () => Promise<{ id: number; bounds: { x: number; y: number; width: number; height: number } }[]>;
        moveWindow: (windowId: number, monitorId: number) => Promise<{ success: boolean; error?: string }>;
      };
    }
  }