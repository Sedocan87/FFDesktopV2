from playwright.sync_api import sync_playwright, Page, expect
import time
import re

def run_verification(page: Page):
    """
    This script verifies the invoice creation flow.
    1. Navigates to the Invoices page.
    2. Opens the create invoice dialog.
    3. Finds billable items.
    4. Verifies the date format in the billable items modal.
    5. Creates an invoice.
    6. Verifies that the billed items no longer appear in the billable items list.
    """
    print("Navigating to the application...")
    page.goto("http://localhost:1421", timeout=60000)

    print("Waiting for application to load...")
    expect(page.get_by_role("link", name="Invoices")).to_be_visible(timeout=15000)

    print("Navigating to Invoices page...")
    page.get_by_role("link", name="Invoices").click()

    expect(page.get_by_role("button", name="Create New Invoice")).to_be_visible()

    # --- First Invoice Creation ---
    print("Opening create invoice dialog...")
    page.get_by_role("button", name="Create New Invoice").click()

    print("Waiting for create invoice dialog to open...")
    find_billable_items_button_1 = page.get_by_role("button", name="Find Billable Items")
    expect(find_billable_items_button_1).to_be_visible()

    print("Waiting for client options to load...")
    select_locator_1 = page.locator("#invoiceClient")
    expect(select_locator_1).to_contain_text("Test Client", timeout=10000)

    print("Selecting client...")
    select_locator_1.select_option(label="Test Client")

    print("Finding billable items...")
    find_billable_items_button_1.click()

    print("Waiting for billable items modal to open...")
    billable_modal_1 = page.get_by_role("dialog", name="Select Items to Invoice")
    expect(billable_modal_1).to_be_visible()

    create_invoice_button_1 = billable_modal_1.locator('button:last-child')
    expect(create_invoice_button_1).to_be_visible()

    print("Verifying date format in modal...")
    date_text_locator = billable_modal_1.get_by_text(re.compile(r"Work done on \d{1,2}/\d{1,2}/\d{4}"))
    expect(date_text_locator).to_be_visible()

    print("Taking screenshot of billable items modal...")
    page.screenshot(path="jules-scratch/verification/verification_before.png")

    print("Creating invoice...")
    create_invoice_button_1.click()

    expect(billable_modal_1).not_to_be_visible()

    # --- Verification Step ---
    print("Re-opening create invoice dialog to verify items are billed...")
    page.get_by_role("button", name="Create New Invoice").click()

    print("Waiting for create invoice dialog to open again...")
    find_billable_items_button_2 = page.get_by_role("button", name="Find Billable Items")
    expect(find_billable_items_button_2).to_be_visible()

    print("Waiting for client options to load again...")
    select_locator_2 = page.locator("#invoiceClient")
    expect(select_locator_2).to_contain_text("Test Client", timeout=10000)

    select_locator_2.select_option(label="Test Client")
    find_billable_items_button_2.click()

    print("Verifying that items are no longer available...")
    billable_modal_2 = page.get_by_role("dialog", name="Select Items to Invoice")
    expect(billable_modal_2).to_be_visible()
    expect(billable_modal_2.get_by_text("No unbilled items found for this client and currency.")).to_be_visible()

    print("Taking screenshot to confirm items are gone...")
    page.screenshot(path="jules-scratch/verification/verification_after.png")

    print("Verification script completed successfully.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
        finally:
            browser.close()

if __name__ == "__main__":
    main()