/**
 * Render ByHLTV role divider PNGs (1920×1080) from role-dividers.html
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROLES_DIR = path.resolve(__dirname, "../roles");
const HTML = path.join(ROLES_DIR, "role-dividers.html");

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
  // Ensure webfonts are applied
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(400);

  const slides = await page.$$(".slide");
  for (const slide of slides) {
    const file = await slide.getAttribute("data-file");
    if (!file) continue;
    const out = path.join(ROLES_DIR, file);
    await slide.screenshot({ path: out, type: "png" });
    const st = fs.statSync(out);
    console.log(`OK ${file} (${st.size} bytes)`);
  }

  await browser.close();
  console.log(`Done → ${ROLES_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
