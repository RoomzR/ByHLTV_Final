/**
 * Build ByHLTV commercial PPTX: info slides (Russian bullets) + full-page screenshots.
 * Uses pptxgenjs (python-pptx equivalent workflow available in Node).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import PptxGenJS from "pptxgenjs";

const require = createRequire(import.meta.url);
const imageSizeMod = require("image-size");
const imageSize = imageSizeMod.imageSize ?? imageSizeMod.default ?? imageSizeMod;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const screensDir = path.join(root, "screens");
const manifestPath = path.join(screensDir, "manifest.json");
const outPathPreferred = path.join(root, "ByHLTV-Presentation.pptx");
const outPathFallback = path.join(root, "ByHLTV-Presentation-v2.pptx");
let outPath = outPathPreferred;

const BG = "121212";
const ACCENT = "8BB41A";
const LIVE = "C41E3A";
const MUTED = "A0A0A0";
const WHITE = "FFFFFF";
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const byId = Object.fromEntries(
  manifest.slides.filter((s) => s.status === "ok" && s.file).map((s) => [s.id, s]),
);

function mustScreen(id) {
  const s = byId[id];
  if (!s) throw new Error(`Missing screen in manifest: ${id}`);
  const p = path.join(screensDir, s.file);
  if (!fs.existsSync(p)) throw new Error(`Missing file: ${s.file}`);
  return { ...s, abs: p };
}

/** Full deck: info + screens in client-facing order */
const DECK = [
  {
    type: "title",
    title: "ByHLTV",
    subtitle: "Белорусский HLTV для CS2",
    note: "Портал · Live · CMS · Реклама",
  },
  {
    type: "info",
    kicker: "Блок A · Продукт",
    title: "Что это",
    bullets: [
      "Публичный портал CS2: матчи, новости, рейтинг, игроки, команды",
      "Live-трансляции матчей и операторская консоль (GSI / demos)",
      "CMS и роли: редактор, модератор, организатор, админ",
      "Рекламные слоты и аналитика показов",
    ],
  },
  { type: "screen", id: "10-home", caption: "Главная" },

  {
    type: "info",
    kicker: "Блок B · Публичный сайт",
    title: "Публичный сайт",
    bullets: [
      "Навигация как у HLTV: матчи → результаты → live → турниры",
      "Контент: новости, рейтинг, игроки, команды, статистика, награды",
      "Сообщество: галерея, форумы, fantasy, betting, вход",
    ],
  },
  { type: "screen", id: "11-matches", caption: "Матчи" },
  { type: "screen", id: "12-match-detail", caption: "Карточка матча · статистика" },
  { type: "screen", id: "13-results", caption: "Результаты" },
  { type: "screen", id: "14-live", caption: "Live" },
  { type: "screen", id: "15-events", caption: "Турниры" },
  { type: "screen", id: "16-event-detail", caption: "Турнир · BEL Season 2" },
  { type: "screen", id: "17-news", caption: "Новости" },
  { type: "screen", id: "18-article", caption: "Статья" },
  { type: "screen", id: "19-ranking", caption: "Рейтинг" },
  { type: "screen", id: "20-players", caption: "Игроки" },
  { type: "screen", id: "21-player-profile", caption: "Профиль игрока" },
  { type: "screen", id: "22-teams", caption: "Команды" },
  { type: "screen", id: "23-team", caption: "Страница команды" },
  { type: "screen", id: "24-stats", caption: "Статистика" },
  { type: "screen", id: "25-top20", caption: "Awards · Top-20" },
  { type: "screen", id: "26-mvp", caption: "Awards · MVP" },
  { type: "screen", id: "27-gallery", caption: "Галерея" },
  { type: "screen", id: "28-forums", caption: "Форумы" },
  { type: "screen", id: "29-fantasy", caption: "Fantasy" },
  { type: "screen", id: "30-betting", caption: "Betting" },
  { type: "screen", id: "31-login", caption: "Вход" },

  {
    type: "info",
    kicker: "Блок C · USER",
    title: "Роль USER",
    bullets: [
      "Личный кабинет фаната: профиль и настройки",
      "Авторизованный просмотр публичного сайта",
    ],
  },
  { type: "screen", id: "40-user-profile", caption: "USER · профиль", role: "USER" },
  { type: "screen", id: "41-user-home", caption: "USER · главная", role: "USER" },

  {
    type: "info",
    kicker: "Блок D · EDITOR",
    title: "Editor CMS",
    bullets: [
      "Новости, игроки, матчи, награды, галерея",
      "Доступ к ops без полного /admin",
      "Точки входа: /admin/news, /admin/players, …",
    ],
  },
  { type: "screen", id: "50-editor-news", caption: "EDITOR · новости", role: "EDITOR" },
  { type: "screen", id: "51-editor-players", caption: "EDITOR · игроки", role: "EDITOR" },
  { type: "screen", id: "52-editor-matches", caption: "EDITOR · матчи", role: "EDITOR" },
  { type: "screen", id: "53-editor-awards", caption: "EDITOR · награды", role: "EDITOR" },
  { type: "screen", id: "54-editor-gallery", caption: "EDITOR · галерея", role: "EDITOR" },
  { type: "screen", id: "55-editor-ops", caption: "EDITOR · ops", role: "EDITOR" },

  {
    type: "info",
    kicker: "Блок E · MODERATOR",
    title: "Модерация",
    bullets: [
      "Очередь жалоб и модерация контента сообщества",
      "Кабинет: /mod",
    ],
  },
  { type: "screen", id: "60-mod", caption: "MOD · модерация", role: "MOD" },

  {
    type: "info",
    kicker: "Блок F · Tournament Admin",
    title: "Workflow организатора",
    bullets: [
      "Заявки TO, ops-кабинет, live-консоль матча",
      "Демо / GSI-операции на /ops и /ops/live/{slug}",
    ],
  },
  { type: "screen", id: "70-to-ops", caption: "TO · ops", role: "TO" },
  { type: "screen", id: "71-to-live", caption: "TO · live console", role: "TO" },

  {
    type: "info",
    kicker: "Блок G · ADMIN",
    title: "Admin / Superadmin",
    bullets: [
      "Пользователи, реклама, аналитика, заявки TO",
      "Команды и рейтинг в CMS",
      "Полный доступ к /admin",
    ],
  },
  { type: "screen", id: "80-admin", caption: "ADMIN · CMS", role: "ADMIN" },
  { type: "screen", id: "81-admin-users", caption: "ADMIN · пользователи", role: "ADMIN" },
  { type: "screen", id: "82-admin-ads", caption: "ADMIN · реклама", role: "ADMIN" },
  { type: "screen", id: "83-admin-ads-analytics", caption: "ADMIN · ads analytics", role: "ADMIN" },
  { type: "screen", id: "84-admin-applications", caption: "ADMIN · заявки TO", role: "ADMIN" },
  { type: "screen", id: "85-admin-teams", caption: "ADMIN · команды", role: "ADMIN" },
  { type: "screen", id: "86-admin-ranking", caption: "ADMIN · рейтинг", role: "ADMIN" },

  {
    type: "info",
    kicker: "Блок H · Итог",
    title: "Стек и следующий шаг",
    bullets: [
      "Next.js · NestJS · Prisma · Socket.IO · demoparser",
      "Роли: USER / EDITOR / MOD / TO / ADMIN",
      "Контакты: [placeholder] · demo: localhost:3000",
    ],
  },
  {
    type: "collage",
    caption: "Публичный сайт + live ops — один продукт",
    files: ["10-home.png", "71-to-live.png"],
  },
];

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDESCREEN_16x9", width: SLIDE_W, height: SLIDE_H });
pptx.layout = "WIDESCREEN_16x9";
pptx.author = "ByHLTV";
pptx.title = "ByHLTV — Презентация v2";

function addAccentBar(slide, y = 0) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y,
    w: 0.14,
    h: SLIDE_H,
    fill: { color: ACCENT },
    line: { color: ACCENT },
  });
}

function fitImage(absPath) {
  const buf = fs.readFileSync(absPath);
  const { width, height } = imageSize(buf);
  const maxW = SLIDE_W;
  const maxH = SLIDE_H - 0.48; // leave caption strip
  const scale = Math.min(maxW / width, maxH / height);
  const w = width * scale;
  const h = height * scale;
  return {
    w,
    h,
    x: (SLIDE_W - w) / 2,
    y: (maxH - h) / 2,
    width,
    height,
  };
}

function addCaption(slide, text, role, num) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: SLIDE_H - 0.48,
    w: SLIDE_W,
    h: 0.48,
    fill: { color: BG },
    line: { color: BG },
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: SLIDE_H - 0.48,
    w: 0.12,
    h: 0.48,
    fill: { color: ACCENT },
    line: { color: ACCENT },
  });
  slide.addText(text, {
    x: 0.28,
    y: SLIDE_H - 0.42,
    w: 9.5,
    h: 0.36,
    fontSize: 13,
    fontFace: "Arial",
    color: WHITE,
    margin: 0,
  });
  if (role) {
    slide.addText(role, {
      x: SLIDE_W - 2.6,
      y: SLIDE_H - 0.42,
      w: 1.3,
      h: 0.36,
      fontSize: 11,
      fontFace: "Arial",
      bold: true,
      color: LIVE,
      align: "right",
      margin: 0,
    });
  }
  slide.addText(String(num).padStart(2, "0"), {
    x: SLIDE_W - 1.1,
    y: SLIDE_H - 0.42,
    w: 0.9,
    h: 0.36,
    fontSize: 12,
    fontFace: "Arial",
    color: ACCENT,
    align: "right",
    margin: 0,
  });
}

let n = 0;
for (const item of DECK) {
  n += 1;
  const slide = pptx.addSlide();
  slide.background = { color: BG };

  if (item.type === "title") {
    addAccentBar(slide);
    slide.addText(item.title, {
      x: 0.7,
      y: 2.2,
      w: 12,
      h: 1.2,
      fontSize: 54,
      fontFace: "Arial",
      bold: true,
      color: WHITE,
      margin: 0,
    });
    slide.addText(item.subtitle, {
      x: 0.7,
      y: 3.5,
      w: 12,
      h: 0.55,
      fontSize: 24,
      fontFace: "Arial",
      color: ACCENT,
      margin: 0,
    });
    slide.addText(item.note, {
      x: 0.7,
      y: 4.3,
      w: 12,
      h: 0.4,
      fontSize: 16,
      fontFace: "Arial",
      color: MUTED,
      margin: 0,
    });
    continue;
  }

  if (item.type === "info") {
    addAccentBar(slide);
    slide.addText(item.kicker, {
      x: 0.7,
      y: 1.5,
      w: 11,
      h: 0.35,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: ACCENT,
      margin: 0,
    });
    slide.addText(item.title, {
      x: 0.7,
      y: 2.0,
      w: 11,
      h: 0.7,
      fontSize: 36,
      fontFace: "Arial",
      bold: true,
      color: WHITE,
      margin: 0,
    });
    slide.addText(
      item.bullets.map((b) => ({ text: b, options: { breakLine: true } })),
      {
        x: 0.7,
        y: 3.0,
        w: 11.5,
        h: 3.5,
        fontSize: 18,
        fontFace: "Arial",
        color: "DDDDDD",
        paraSpaceAfter: 10,
        bullet: { code: "25CF" },
        margin: 0,
      },
    );
    slide.addText(String(n).padStart(2, "0"), {
      x: SLIDE_W - 1.2,
      y: SLIDE_H - 0.55,
      w: 0.9,
      h: 0.35,
      fontSize: 12,
      fontFace: "Arial",
      color: ACCENT,
      align: "right",
      margin: 0,
    });
    continue;
  }

  if (item.type === "collage") {
    const left = path.join(screensDir, item.files[0]);
    const right = path.join(screensDir, item.files[1]);
    if (fs.existsSync(left) && fs.existsSync(right)) {
      const half = (SLIDE_W - 0.06) / 2;
      const imgH = SLIDE_H - 0.48;
      slide.addImage({ path: left, x: 0, y: 0, w: half, h: imgH });
      slide.addImage({ path: right, x: half + 0.06, y: 0, w: half, h: imgH });
    }
    addCaption(slide, item.caption, null, n);
    continue;
  }

  // screen
  const scr = mustScreen(item.id);
  const fit = fitImage(scr.abs);
  slide.addImage({
    path: scr.abs,
    x: fit.x,
    y: fit.y,
    w: fit.w,
    h: fit.h,
  });
  addCaption(slide, item.caption || scr.caption, item.role ?? null, n);
}

try {
  await pptx.writeFile({ fileName: outPath });
} catch (err) {
  if (err && (err.code === "EBUSY" || String(err.message).includes("EBUSY"))) {
    outPath = outPathFallback;
    await pptx.writeFile({ fileName: outPath });
  } else {
    throw err;
  }
}
const size = fs.statSync(outPath).size;
console.log(
  JSON.stringify(
    {
      outPath,
      size,
      sizeMB: +(size / 1024 / 1024).toFixed(2),
      deckSlides: DECK.length,
      screensOk: Object.keys(byId).length,
    },
    null,
    2,
  ),
);
if (size < 2 * 1024 * 1024) {
  console.error("PPTX too small — screenshots likely missing");
  process.exit(1);
}
