/**
 * Render ByHLTV end-slide PNG (1920×1080) from thanks-slide.html
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROLES_DIR = path.resolve(__dirname, "../roles");
const PRES_DIR = path.resolve(__dirname, "..");
const HTML = path.join(ROLES_DIR, "thanks-slide.html");
const OUT_NAME = "99-thanks.png";
const COPY_NAME = "99-thanks-for-watching.png";

async function main() {
  if (!fs.existsSync(HTML)) {
    throw new Error(`Missing ${HTML}`);
  }
  fs.mkdirSync(ROLES_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  await page.goto(`file://${HTML.replace(/\\/g, "/")}`, {
    waitUntil: "networkidle",
  });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(400);

  const slide = await page.$(".slide");
  if (!slide) throw new Error("No .slide found");

  const out = path.join(ROLES_DIR, OUT_NAME);
  await slide.screenshot({ path: out, type: "png" });
  const st = fs.statSync(out);
  console.log(`OK ${OUT_NAME} (${st.size} bytes) → ${out}`);

  const copy = path.join(PRES_DIR, COPY_NAME);
  fs.copyFileSync(out, copy);
  console.log(`OK ${COPY_NAME} → ${copy}`);

  await browser.close();
  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
