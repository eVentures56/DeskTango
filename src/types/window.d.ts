import { Display } from 'electron';

declare global {
  interface Window {
    deskTango: {
      getMonitors: () => Display[];
    };
  }
}