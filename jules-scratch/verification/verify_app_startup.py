from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Log console messages
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    # The dev server is running on the new port
    page.goto("http://localhost:1421/")

    try:
        # Wait for the body to be visible
        expect(page.locator("body")).to_be_visible(timeout=30000)

        # Wait for the main content to be attached
        page.wait_for_selector("main", timeout=30000)

        # Wait for the "Loading your data..." message to disappear
        expect(page.locator("text=Loading your data...")).not_to_be_visible(timeout=30000)

        # Give the page a moment to settle
        time.sleep(2)

        page.screenshot(path="jules-scratch/verification/verification.png")

    except Exception as e:
        page.screenshot(path="jules-scratch/verification/error.png")
        print(page.content)
        raise e

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)