import {app, ipcMain} from 'electron';
import path from 'path';
import type {SafeAny} from '../../../shared/types/db';

let addon: unknown;
if (!app.isPackaged) {
  addon = require(path.join(__dirname, '../src/native-addon/build/Release/window-addon.node'));
} else {
  const isMac = process.platform === 'darwin';
  const addonPath = isMac
    ? path.join(
        app.getAppPath(),
        '../app.asar.unpacked/node_modules/window-addon/window-addon.node',
      )
    : path.join(
        process.resourcesPath,
        'app.asar.unpacked/node_modules/window-addon/window-addon.node',
      );

  try {
    addon = require(addonPath);
  } catch (error) {
    console.error('Failed to load addon:', error);
    console.error('Attempted path:', addonPath);
  }
}

export const initSyncService = () => {
  if (!addon) {
    console.error('Window addon not loaded properly');
    return;
  }

  const windowManager = new (addon as SafeAny).WindowManager();

  ipcMain.handle('window-arrange', async (_, args) => {
    const {mainPid, childPids, columns, size, spacing} = args;

    try {
      if (!windowManager) {
        throw new Error('WindowManager not initialized');
      }

      windowManager.arrangeWindows(mainPid, childPids, columns, size, spacing);
      return {success: true};
    } catch (error) {
      console.error('Window arrangement failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};
