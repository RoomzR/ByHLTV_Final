/**
 * Capture FULL-PAGE ByHLTV screenshots for commercial presentation.
 * Requires: web :3000, api :4000, playwright chromium installed.
 *
 * Naming: zero-padded screen ids matching deck order (info slides are PPTX-only).
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "presentation", "screens");
const BASE = process.env.WEB_URL ?? "http://localhost:3000";

/** Screenshot slides only — info/title slides live in PPTX/HTML without PNGs */
const SLIDES = [
  // Block A / B — public
  { id: "10-home", path: "/", caption: "Главная", block: "public" },
  { id: "11-matches", path: "/matches", caption: "Матчи", block: "public" },
  {
    id: "12-match-detail",
    path: "/matches/bel-s2-grand-final",
    caption: "Карточка матча · статистика",
    block: "public",
  },
  { id: "13-results", path: "/results", caption: "Результаты", block: "public" },
  { id: "14-live", path: "/live", caption: "Live", block: "public" },
  { id: "15-events", path: "/events", caption: "Турниры", block: "public" },
  {
    id: "16-event-detail",
    path: "/events/bel-season-2",
    caption: "BEL Season 2",
    block: "public",
  },
  { id: "17-news", path: "/news", caption: "Новости", block: "public" },
  {
    id: "18-article",
    path: "/news/bel-demos-stats-pipeline",
    caption: "Статья",
    block: "public",
  },
  { id: "19-ranking", path: "/ranking", caption: "Рейтинг", block: "public" },
  { id: "20-players", path: "/players", caption: "Игроки", block: "public" },
  {
    id: "21-player-profile",
    path: "/players/ug-hub-faizer",
    caption: "Профиль игрока",
    block: "public",
  },
  { id: "22-teams", path: "/teams", caption: "Команды", block: "public" },
  { id: "23-team", path: "/teams/ug-hub", caption: "Команда", block: "public" },
  { id: "24-stats", path: "/stats", caption: "Статистика", block: "public" },
  { id: "25-top20", path: "/players/top20", caption: "Top-20", block: "public" },
  { id: "26-mvp", path: "/players/mvps", caption: "MVP", block: "public" },
  { id: "27-gallery", path: "/gallery", caption: "Галерея", block: "public" },
  { id: "28-forums", path: "/forums", caption: "Форумы", block: "public" },
  { id: "29-fantasy", path: "/fantasy", caption: "Fantasy", block: "public" },
  { id: "30-betting", path: "/betting", caption: "Betting", block: "public" },
  { id: "31-login", path: "/login", caption: "Вход", block: "public" },

  // Block C — USER
  { id: "40-user-profile", path: "/profile", caption: "USER · профиль", auth: "user", block: "user" },
  { id: "41-user-home", path: "/", caption: "USER · главная", auth: "user", block: "user" },

  // Block D — EDITOR (skip /admin root — denied)
  { id: "50-editor-news", path: "/admin/news", caption: "EDITOR · новости", auth: "editor", block: "editor" },
  { id: "51-editor-players", path: "/admin/players", caption: "EDITOR · игроки", auth: "editor", block: "editor" },
  { id: "52-editor-matches", path: "/admin/matches", caption: "EDITOR · матчи", auth: "editor", block: "editor" },
  { id: "53-editor-awards", path: "/admin/awards", caption: "EDITOR · награды", auth: "editor", block: "editor" },
  { id: "54-editor-gallery", path: "/admin/gallery", caption: "EDITOR · галерея", auth: "editor", block: "editor" },
  { id: "55-editor-ops", path: "/ops", caption: "EDITOR · ops", auth: "editor", block: "editor" },

  // Block E — MOD
  { id: "60-mod", path: "/mod", caption: "MOD · модерация", auth: "mod", block: "mod" },

  // Block F — TO
  { id: "70-to-ops", path: "/ops", caption: "TO · ops", auth: "to", block: "to" },
  {
    id: "71-to-live",
    path: "/ops/live/bel-showmatch-ugh-sky",
    caption: "TO · live console",
    auth: "to",
    block: "to",
  },

  // Block G — ADMIN / SUPERADMIN
  { id: "80-admin", path: "/admin", caption: "ADMIN · CMS", auth: "admin", block: "admin" },
  { id: "81-admin-users", path: "/admin/users", caption: "ADMIN · пользователи", auth: "admin", block: "admin" },
  { id: "82-admin-ads", path: "/admin/ads", caption: "ADMIN · реклама", auth: "admin", block: "admin" },
  {
    id: "83-admin-ads-analytics",
    path: "/admin/ads/analytics",
    caption: "ADMIN · ads analytics",
    auth: "admin",
    block: "admin",
  },
  {
    id: "84-admin-applications",
    path: "/admin/applications",
    caption: "ADMIN · заявки TO",
    auth: "admin",
    block: "admin",
  },
  { id: "85-admin-teams", path: "/admin/teams", caption: "ADMIN · команды", auth: "admin", block: "admin" },
  { id: "86-admin-ranking", path: "/admin/ranking", caption: "ADMIN · рейтинг", auth: "admin", block: "admin" },
];

const ACCOUNTS = {
  admin: { email: "admin@byhltv.local", password: "Admin123!" },
  to: { email: "to@byhltv.local", password: "ToAdmin123!" },
  user: { email: "user@byhltv.local", password: "User1234!" },
  editor: { email: "editor@byhltv.local", password: "Editor123!" },
  mod: { email: "mod@byhltv.local", password: "Mod1234!" },
};

fs.mkdirSync(OUT, { recursive: true });

async function waitSettled(page) {
  await page.waitForLoadState("domcontentloaded");
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch {
    /* long-lived sockets */
  }
  // Wait until common skeleton / pulse loaders disappear
  try {
    await page.waitForFunction(
      () => {
        const skeletons = document.querySelectorAll(
          '[class*="skeleton"],[class*="Skeleton"],[data-skeleton]',
        );
        const pulsing = [...document.querySelectorAll(".animate-pulse")];
        return skeletons.length === 0 && pulsing.length < 3;
      },
      { timeout: 8000 },
    );
  } catch {
    /* ok if skeletons persist briefly */
  }
  await page.waitForTimeout(1500);
  // Scroll to bottom then top so lazy content loads before fullPage shot
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const h = Math.max(
      document.body?.scrollHeight ?? 0,
      document.documentElement?.scrollHeight ?? 0,
    );
    const step = Math.max(400, Math.floor(window.innerHeight * 0.85));
    for (let y = 0; y < h; y += step) {
      window.scrollTo(0, y);
      await sleep(120);
    }
    window.scrollTo(0, h);
    await sleep(250);
    window.scrollTo(0, 0);
    await sleep(200);
  });
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 });
  } catch {
    /* ignore */
  }
  await page.waitForTimeout(400);
}

async function scrub(page) {
  await page
    .evaluate(() => {
      document
        .querySelectorAll(
          "nextjs-portal,[data-nextjs-toast],#__next-build-watcher,[data-cookie-banner],.Toastify,[data-sonner-toaster]",
        )
        .forEach((el) => el.remove());
    })
    .catch(() => null);
}

async function clearSession(page) {
  const context = page.context();
  await context.clearCookies();
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  }).catch(() => null);
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitSettled(page);
}

async function login(page, accountKey) {
  const acc = ACCOUNTS[accountKey];
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitSettled(page);
  await scrub(page);
  await page.fill("#login-email", acc.email);
  await page.fill("#login-password", acc.password);
  await Promise.all([
    page
      .waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 })
      .catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await waitSettled(page);
}

async function shoot(page, slide) {
  const file = `${slide.id}.png`;
  const dest = path.join(OUT, file);
  const url = `${BASE}${slide.path}`;
  console.log(`→ ${slide.id} ${url}`);
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    const status = resp?.status() ?? 0;
    if (status >= 400) {
      console.warn(`  skip HTTP ${status}`);
      return { ...slide, file: null, status: "skipped", reason: `HTTP ${status}` };
    }
    await waitSettled(page);
    await scrub(page);

    // Prefer native fullPage; cap extreme heights via clip stitch fallback
    const metrics = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return {
        width: Math.max(body.scrollWidth, html.scrollWidth, window.innerWidth),
        height: Math.max(body.scrollHeight, html.scrollHeight, window.innerHeight),
      };
    });

    const MAX_H = 16000; // Playwright / Chromium practical limit
    if (metrics.height <= MAX_H) {
      await page.screenshot({
        path: dest,
        type: "png",
        fullPage: true,
        animations: "disabled",
      });
    } else {
      // Stitch vertical slices
      const { createRequire } = await import("node:module");
      const require = createRequire(import.meta.url);
      let sharp;
      try {
        sharp = require("sharp");
      } catch {
        // Fallback: clip to max height fullPage won't work — use viewport scroll stitch with canvas via CDP
        console.warn(`  page ${metrics.height}px tall — capturing top ${MAX_H}px`);
        await page.screenshot({
          path: dest,
          type: "png",
          fullPage: false,
          clip: { x: 0, y: 0, width: 1920, height: Math.min(metrics.height, MAX_H) },
          animations: "disabled",
        });
      }
      if (sharp) {
        const vh = 1080;
        const slices = [];
        for (let y = 0; y < metrics.height; y += vh) {
          const h = Math.min(vh, metrics.height - y);
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await page.waitForTimeout(150);
          const buf = await page.screenshot({
            type: "png",
            fullPage: false,
            clip: { x: 0, y: 0, width: 1920, height: h },
            animations: "disabled",
          });
          slices.push({ buf, h });
        }
        let composite = sharp({
          create: {
            width: 1920,
            height: metrics.height,
            channels: 3,
            background: { r: 18, g: 18, b: 18 },
          },
        });
        const inputs = [];
        let top = 0;
        for (const s of slices) {
          inputs.push({ input: s.buf, top, left: 0 });
          top += s.h;
        }
        await composite.composite(inputs).png().toFile(dest);
      }
    }

    const size = fs.statSync(dest).size;
    // Read dimensions via image-size if available
    let dims = null;
    try {
      const { createRequire } = await import("node:module");
      const require = createRequire(import.meta.url);
      const imageSizeMod = require("image-size");
      const imageSize = imageSizeMod.imageSize ?? imageSizeMod.default ?? imageSizeMod;
      dims = imageSize(fs.readFileSync(dest));
    } catch {
      dims = { width: metrics.width, height: metrics.height };
    }
    console.log(
      `  ok ${(size / 1024).toFixed(0)} KB · ${dims?.width ?? "?"}×${dims?.height ?? "?"} (page ~${metrics.height}px)`,
    );
    if ((dims?.height ?? 0) <= 1100 && metrics.height > 1200) {
      console.warn(`  WARN: screenshot height looks viewport-cropped (page ${metrics.height}px)`);
    }
    return {
      ...slide,
      file,
      status: "ok",
      bytes: size,
      url: slide.path,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      pageHeight: metrics.height,
    };
  } catch (err) {
    console.warn(`  FAIL ${err.message}`);
    return { ...slide, file: null, status: "failed", reason: err.message };
  }
}

async function main() {
  // Remove old viewport-only screens so deck doesn't mix generations
  for (const f of fs.readdirSync(OUT)) {
    if (f.endsWith(".png") || f === "manifest.json") {
      fs.unlinkSync(path.join(OUT, f));
    }
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: "ru-RU",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  const results = [];
  let currentAuth = null;

  for (const slide of SLIDES) {
    const need = slide.auth ?? null;
    if (need !== currentAuth) {
      console.log(`Clear session → ${need ?? "anon"}…`);
      await clearSession(page);
      currentAuth = null;
      if (need) {
        console.log(`Login as ${need}…`);
        try {
          await login(page, need);
          currentAuth = need;
        } catch (err) {
          console.warn(`Login failed for ${need}: ${err.message}`);
          results.push({
            ...slide,
            file: null,
            status: "failed",
            reason: `login: ${err.message}`,
          });
          continue;
        }
      }
    }
    results.push(await shoot(page, slide));
  }

  const ok = results.filter((r) => r.status === "ok");
  const short = ok.filter((r) => (r.height ?? 0) > 0 && (r.height ?? 0) <= 1100 && (r.pageHeight ?? 0) > 1200);

  const manifest = {
    generatedAt: new Date().toISOString(),
    captureMode: "fullPage",
    viewport: { width: 1920, height: 1080 },
    baseUrl: BASE,
    brand: { bg: "#121212", accent: "#8BB41A", live: "#C41E3A" },
    slides: results.map((r, i) => ({
      slide: i + 1,
      id: r.id,
      file: r.file,
      caption: r.caption,
      path: r.path,
      status: r.status,
      reason: r.reason ?? null,
      auth: r.auth ?? null,
      block: r.block ?? null,
      width: r.width ?? null,
      height: r.height ?? null,
      pageHeight: r.pageHeight ?? null,
      bytes: r.bytes ?? null,
    })),
    quality: {
      ok: ok.length,
      total: results.length,
      suspectedViewportCrop: short.map((r) => r.id),
    },
  };

  const manifestPath = path.join(OUT, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nManifest → ${manifestPath}`);
  console.log(`OK: ${ok.length} / ${results.length}`);
  if (short.length) {
    console.warn(`Suspected cropped: ${short.map((r) => r.id).join(", ")}`);
  }

  await browser.close();
  if (ok.length < results.length * 0.8) process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
