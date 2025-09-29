import { test, expect, _electron } from '@playwright/test';

const getApp = async () => {
  const electronApp = await _electron.launch({
    args: ['src-tauri/target/release/freelance-flow', '--no-sandbox'],
  });
  return {
    app: electronApp,
    window: await electronApp.firstWindow(),
  };
};

test.describe('Search functionality', () => {
  test('should filter projects by name', async () => {
    const { app, window } = await getApp();
    await window.waitForSelector('h1:has-text("Dashboard")');

    // Navigate to Clients page to add a client first
    await window.click('text=Clients');
    await window.waitForSelector('h1:has-text("Clients")');

    // Add a client
    await window.click('button:has-text("Add New Client")');
    await window.fill('input#clientName', 'Test Client for Project');
    await window.fill('input#clientEmail', 'test.client.project@email.com');
    await window.click('button:has-text("Add Client")');
    await window.waitForSelector('text=Client added successfully!');

    // Navigate to Projects page
    await window.click('text=Projects');
    await window.waitForSelector('h1:has-text("Projects")');

    // Add a couple of projects
    await window.click('button:has-text("Create New Project")');
    await window.waitForSelector('h2:has-text("Create New Project")');
    await window.fill('input#name', 'Alpha Project');
    await window.selectOption('select#clientId', { label: 'Test Client for Project' });
    await window.click('button:has-text("Create Project")');
    await window.waitForSelector('text=Project created successfully!');

    await window.click('button:has-text("Create New Project")');
    await window.waitForSelector('h2:has-text("Create New Project")');
    await window.fill('input#name', 'Beta Project');
    await window.selectOption('select#clientId', { label: 'Test Client for Project' });
    await window.click('button:has-text("Create Project")');
    await window.waitForSelector('text=Project created successfully!');

    // Search for a project
    await window.fill('input[placeholder="Search projects..."]', 'Alpha');

    // Assert that only the matching project is visible
    await expect(window.locator('text=Alpha Project')).toBeVisible();
    await expect(window.locator('text=Beta Project')).not.toBeVisible();

    await app.close();
  });

  test('should filter clients by name', async () => {
    const { app, window } = await getApp();
    await window.waitForSelector('h1:has-text("Dashboard")');

    // Navigate to Clients page
    await window.click('text=Clients');
    await window.waitForSelector('h1:has-text("Clients")');

    // Add a couple of clients
    await window.click('button:has-text("Add New Client")');
    await window.fill('input#clientName', 'First Client');
    await window.fill('input#clientEmail', 'first@client.com');
    await window.click('button:has-text("Add Client")');
    await window.waitForSelector('text=Client added successfully!');

    await window.click('button:has-text("Add New Client")');
    await window.fill('input#clientName', 'Second Client');
    await window.fill('input#clientEmail', 'second@client.com');
    await window.click('button:has-text("Add Client")');
    await window.waitForSelector('text=Client added successfully!');

    // Search for a client
    await window.fill('input[placeholder="Search clients..."]', 'First');

    // Assert that only the matching client is visible
    await expect(window.locator('text=First Client')).toBeVisible();
    await expect(window.locator('text=Second Client')).not.toBeVisible();

    await app.close();
  });
});