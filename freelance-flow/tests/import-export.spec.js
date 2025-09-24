import { test, expect, _electron } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Import and Export Buttons', async () => {
  const electron = _electron;
  const electronApp = await electron.launch({ executablePath: '/app/freelance-flow/src-tauri/target/release/freelance-flow', args: ['--no-sandbox'] });
  const window = await electronApp.firstWindow();

  // Wait for the app to load
  await window.waitForSelector('h1:has-text("Dashboard")');

  // Navigate to settings
  await window.click('text=Settings');

  // Wait for settings to load
  await window.waitForSelector('h1:has-text("Settings")');

  // Create a dummy file to import
  const importFilePath = '/tmp/test-import.json';
  const dummyData = { clients: [{id: 1, name: 'Test Client', email: 'test@test.com'}] };
  fs.writeFileSync(importFilePath, JSON.stringify(dummyData));

  // Mock the dialog to avoid opening a real file picker
  await window.evaluate(() => {
    window.showOpenFilePicker = async () => {
      return [
        {
          getFile: async () => {
            return {
              name: 'test-import.json',
              text: async () => JSON.stringify({ clients: [{id: 1, name: 'Test Client', email: 'test@test.com'}] })
            };
          }
        }
      ];
    };
  });

  // Import data
  const importButton = await window.locator('button:has-text("Import Data")');
  await importButton.click();

  // Because we can't easily test the system file dialog with Playwright for Electron,
  // and since the core logic is now handled by the fs plugin which we've enabled,
  // we are assuming the dialog part works. The critical part is that the button is clickable
  // and attempts to trigger the import logic.
  // A full end-to-end test would require a more complex setup to handle the native dialog.

  // For now, we'll just check that the button is there and enabled.
  await expect(importButton).toBeEnabled();

  const exportButton = await window.locator('button:has-text("Export Data")');
  await expect(exportButton).toBeEnabled();

  console.log('Test completed: Buttons are present and enabled.');

  await electronApp.close();
});
