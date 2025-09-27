const { test, expect } = require('@playwright/test');

test.describe('Time Tracking View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
    // Click the "Time Tracking" nav link to navigate to the correct view
    await page.getByRole('link', { name: 'Time Tracking' }).click();
  });

  test('should display existing time entries with the correct project name', async ({ page }) => {
    // Check for the initial entry from initialData.js
    const recentEntriesTable = page.locator('h3:text("Recent Entries")').locator('..'); // Go up to the card

    // Check for the project name "Test Project" in the first row
    const firstRow = recentEntriesTable.locator('tbody tr').first();
    await expect(firstRow.locator('td').first()).toHaveText('Test Project');
  });

  test('should allow a user to log a new time entry and see it in the list', async ({ page }) => {
    // Fill out the "Log Time Manually" form
    await page.locator('#hours').fill('2.5');
    await page.locator('#date').fill('2025-09-26');
    await page.locator('#description').fill('Worked on the new feature.');

    // Select a project. We assume 'Test Project' is the first and default selection.
    await page.locator('#logProject').selectOption({ label: 'Test Project' });

    // Click the "Log Time" button
    await page.getByRole('button', { name: 'Log Time' }).click();

    // Expect a success toast message
    await expect(page.locator('text=Time entry logged successfully!')).toBeVisible();

    // Check that the new entry appears in the "Recent Entries" table
    const recentEntriesTable = page.locator('h3:text("Recent Entries")').locator('..');
    const newEntryRow = recentEntriesTable.locator('tbody tr').filter({
      hasText: 'Test Project'
    }).filter({
      hasText: '2.50'
    });

    await expect(newEntryRow).toBeVisible();
    await expect(newEntryRow.locator('td').nth(0)).toHaveText('Test Project');
    await expect(newEntryRow.locator('td').nth(1)).toHaveText('2.50');
  });
});