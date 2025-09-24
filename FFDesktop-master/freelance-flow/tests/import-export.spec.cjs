const { test, expect, _electron: electron } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('Import and Export Buttons', async () => {
  const electronApp = await electron.launch({ args: ['.', '--no-sandbox'] });
  const appPath = await electronApp.evaluate(async ({ app }) => {
    return app.getAppPath();
  });
  const window = await electronApp.firstWindow();

  // Navigate to settings
  await window.click('text=Settings');

  // Export data
  const downloadPromise = window.waitForEvent('download');
  await window.click('text=Export Data');
  const download = await downloadPromise;
  const downloadPath = path.join('/tmp', download.suggestedFilename());
  await download.saveAs(downloadPath);

  // Verify that the file was downloaded
  expect(fs.existsSync(downloadPath)).toBeTruthy();

  // Import data
  await window.click('text=Import Data');
  await window.setInputFiles('input[type="file"]', downloadPath);

  // Verify that the data was imported
  const toast = await window.waitForSelector('text=Data imported successfully!');
  expect(toast).toBeTruthy();

  await electronApp.close();
});
