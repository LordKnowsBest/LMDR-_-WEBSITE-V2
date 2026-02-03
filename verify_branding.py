from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Define files to verify
        files_to_verify = [
            ("src/public/carrier/Carrier_Welcome.html", "carrier_welcome.png"),
            ("src/public/recruiter/RECRUITER_LEADERBOARD.html", "recruiter_leaderboard.png"),
            ("src/public/carrier/Carrier Solutions - Retention-Focused.html", "carrier_solutions.png")
        ]

        output_dir = "/home/jules/verification"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        for filepath, screenshot_name in files_to_verify:
            abs_path = os.path.abspath(filepath)
            print(f"Verifying {abs_path}...")

            try:
                page.goto(f"file://{abs_path}")

                # Take screenshot
                output_path = os.path.join(output_dir, screenshot_name)
                page.screenshot(path=output_path, full_page=True)
                print(f"Screenshot saved to {output_path}")

            except Exception as e:
                print(f"Error verifying {filepath}: {e}")

        browser.close()

if __name__ == "__main__":
    run()
