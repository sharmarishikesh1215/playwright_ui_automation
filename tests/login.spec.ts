import { test, expect } from "@playwright/test";
import axios from "axios";
import "dotenv/config";

const SLACK_CHANNEL = "social"; // e.g., C12345678
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
/**
 * In GitHub Actions, secrets are injected as environment variables.
 * No code change is needed here to access SLACK_WEBHOOK_URL,
 * as process.env.SLACK_WEBHOOK_URL will be set by the workflow.
 * Just ensure your GitHub Actions workflow sets the secret:
 * 
 *    env:
 *      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
 */

async function sendSlackWebhookMessage(message: string) {
  if (!SLACK_WEBHOOK_URL) {
    console.error("SLACK_WEBHOOK_URL is not defined.");
    return;
  }
  try {
    const response = await axios.post(
      SLACK_WEBHOOK_URL,
      { text: message },
      { headers: { "Content-Type": "application/json" } }
    );
    if (response.status !== 200) {
      console.error("Slack webhook backend error:", response.data);
    }
  } catch (err) {
    console.error("Slack webhook send failed:", err);
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("https://www.sacredgroves.earth/");
  await expect(page).toHaveTitle(
    "Protect Environment, Wildlife, Endangered Animals, Natural Habitats - Sacred Groves"
  );
});

test("Is Google Map API working", async ({ page }, testInfo) => {
  let status = "passed";
  try {
    await page.waitForTimeout(6000);
    const iframe = page.frameLocator(
      "//iframe[@src='https://outshade.sacredgroves.earth/api/sutra/map/forest?iframe_height=300&iframe_width=500&zoom_start=3']"
    );
    const mapElement = iframe.locator("div[id^='map_']");
    await mapElement.waitFor({ state: "visible", timeout: 15000 });
  } catch (e) {
    status = "failed";
    throw e;
  } finally {
    await sendSlackWebhookMessage(`Test "${testInfo.title}" has ${status}.`);
  }
});

test("Carousel is working", async ({ page }) => {
  await page.locator("(//img[@class='blogImgTop'])[1]").click();
  await page.waitForTimeout(2000);

  await page
    .locator("//h4[text()='Recent images of Coed Rhyal']")
    .scrollIntoViewIfNeeded();
  let status = "passed";
  try {
    if (
      await page.locator("(//img[@alt='Woodland overview'])[1]").isVisible()
    ) {
      // await page.screenshot({ path: "screenshot.png" });
      console.log("Carousel image is visible.");
    }
  } catch (e) {
    status = "failed";
    throw e;
  } finally {
    await sendSlackWebhookMessage(`Test "Carousel is working" has ${status}.`);
  }
});
