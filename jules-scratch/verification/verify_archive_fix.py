import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:1420/")

            # Allow time for the app to load initial data
            await page.wait_for_timeout(3000)

            # 1. Create a new client
            await page.get_by_role("button", name="Clients").click()
            await page.get_by_role("button", name="Add Client").click()
            await page.get_by_label("Name").fill("Test Client Inc.")
            await page.get_by_label("Email").fill("test@client.com")
            await page.get_by_role("button", name="Save").click()
            await expect(page.get_by_text("Test Client Inc.")).to_be_visible()
            print("Client created successfully.")

            # 2. Create a new project for the client
            await page.get_by_role("button", name="Projects").click()
            await page.get_by_role("button", name="Add Project").click()
            await page.get_by_label("Project Name").fill("Website Redesign")
            await page.get_by_label("Client").select_option(label="Test Client Inc.")
            await page.get_by_role("button", name="Save").click()
            await expect(page.get_by_text("Website Redesign")).to_be_visible()
            print("Project created successfully.")

            # 3. Log time for the project
            await page.get_by_role("button", name="Time Tracking").click()
            await page.get_by_role("button", name="Log Time").click()
            await page.get_by_label("Project").select_option(label="Website Redesign")
            await page.get_by_label("Hours").fill("10")
            await page.get_by_role("button", name="Save").click()
            await expect(page.get_by_text("10h 0m")).to_be_visible()
            print("Time logged successfully.")

            # 4. Create an invoice
            await page.get_by_role("button", name="Invoices").click()
            await page.get_by_role("button", name="New Invoice").click()
            await page.get_by_label("Select Client").select_option(label="Test Client Inc.")
            await page.get_by_role("button", name="Find Billable Items").click()
            # Wait for the billable items modal to appear
            await expect(page.get_by_role("heading", name="Billable Items")).to_be_visible()
            await page.get_by_role("button", name="Create Invoice").click()
            # Wait for the success toast
            await expect(page.get_by_text("Invoice INV-")).to_be_visible()
            # Dismiss the toast by clicking somewhere else
            await page.get_by_role("heading", name="Invoices").click()
            # Find the new invoice in the list
            invoice_row = page.locator(".table-row:has-text('Test Client Inc.')")
            await expect(invoice_row).to_be_visible()
            print("Invoice created successfully.")

            # 5. Archive the project
            await page.get_by_role("button", name="Projects").click()
            project_row = page.locator(".table-row:has-text('Website Redesign')")
            await project_row.get_by_role("button", name="Archive").click()
            # Confirm the dialog if any (assuming there isn't one based on store logic)
            await expect(project_row).not_to_be_visible()
            print("Project archived successfully.")

            # 6. Verify both project and invoice are in the archived view
            await page.get_by_role("button", name="Archived Items").click()
            await expect(page.get_by_role("heading", name="Archived Items")).to_be_visible()

            # Check for archived project
            await expect(page.get_by_text("Website Redesign")).to_be_visible()

            # Check for archived invoice
            await expect(page.get_by_text("Test Client Inc.")).to_be_visible()

            print("Verification successful: Project and Invoice are both archived.")

            # 7. Take a screenshot
            await page.screenshot(path="jules-scratch/verification/verification.png")
            print("Screenshot saved to jules-scratch/verification/verification.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())