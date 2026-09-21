/**
 * Download BEL media (teams / players / gallery / covers) from belcs2.by
 * into apps/api/uploads/bel/ for local serving via /uploads/bel/...
 */
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..", "..");
const OUT = join(ROOT, "apps", "api", "uploads", "bel");
const BASE = "https://www.belcs2.by";

/** Active 5-man lineups for seed (extras on site = history / bench). */
export const BEL_ROSTERS = {
  "ug-hub": {
    name: "UG_HUB",
    shortName: "UGH",
    region: "Vitebsk",
    logo: `${BASE}/assets/teams/ug_hub.webp`,
    folder: "ug",
    players: ["Faizer", "ALPHA", "shimu", "pavlysha666", "tokyoking"],
  },
  skynet: {
    name: "SKYNET",
    shortName: "SKY",
    region: "Hrodna",
    logo: `${BASE}/assets/teams/skynet.webp`,
    folder: "skynet",
    players: ["pogwasst", "barsuk", "KENHY", "yisb", "uNdo"],
  },
  "meta-arena": {
    name: "META ARENA",
    shortName: "META",
    region: "Minsk",
    logo: `${BASE}/assets/teams/meta.webp`,
    folder: "meta",
    players: ["ArmanZwerrr", "ch1psik", "bonya", "Roomz", "Phoenix"],
  },
  cyberloga: {
    name: "Cyberloga",
    shortName: "CLG",
    region: "Minsk",
    logo: `${BASE}/assets/teams/cyberloga.webp`,
    folder: "cyberloga",
    players: ["heartbrxk3n", "bexoff", "LOLLIPOP21K", "AZ3RTIXX", "rblbalkagoat"],
  },
  pixel: {
    name: "PIXEL",
    shortName: "PXL",
    region: "Mogilev",
    logo: `${BASE}/assets/teams/pixel.webp`,
    folder: "pixel",
    players: ["Nikola", "lavr3n", "fr1soy", "paralyzed666", "Antarctica"],
  },
  plazma: {
    name: "PLAZMA",
    shortName: "PLZ",
    region: "Minsk",
    logo: `${BASE}/assets/teams/plazma.webp`,
    folder: "plazma",
    players: ["em0", "Steve21", "Deitas", "At0m", "zerixxxxx"],
  },
  cybergamesport: {
    name: "CyberGameSport",
    shortName: "CGS",
    region: "Slutsk",
    logo: `${BASE}/assets/teams/cybergamesport.webp`,
    folder: "cgs",
    players: ["c47s", "Flo1x", "Kanoshixo", "Kazamii", "akutsi"],
  },
  playday: {
    name: "Playday",
    shortName: "PDY",
    region: "Minsk",
    logo: `${BASE}/assets/teams/playday.webp`,
    folder: "playday",
    players: ["EropBuTaJIu4", "Nillow", "gurman", "PunchCyan", "Duran4e1as"],
  },
  vibe: {
    name: "VIBE",
    shortName: "VIBE",
    region: "Hrodna",
    logo: `${BASE}/assets/teams/vibe.webp`,
    folder: "vibe",
    players: ["arman", "roomz", "phoenix", "ch1psik", "rivan"],
  },
  cyberxata: {
    name: "CYBERXATA",
    shortName: "CXA",
    region: "Soligorsk",
    logo: `${BASE}/assets/teams/cyberxata.webp`,
    folder: "cyberxata",
    players: ["senya", "1337fated", "M1nis", "lordstonez", "lesch143"],
  },
  bastion: {
    name: "Bastion",
    shortName: "BAS",
    region: "Belarus",
    logo: `${BASE}/assets/teams/bastion.webp`,
    folder: "bastion",
    players: ["read9x", "starbtw", "soyf", "jumanji", "frozendog"],
  },
  cyberbar: {
    name: "Cyber Bar",
    shortName: "CBR",
    region: "Belarus",
    logo: `${BASE}/assets/teams/cyberbar.webp`,
    folder: "cyber-bar",
    players: ["Fariday", "pr3d1ct", "Ehonej", "Tooky", "Kon-Shisho"],
  },
  arearegion: {
    name: "AREA REGION",
    shortName: "AREA",
    region: "Belarus",
    logo: `${BASE}/assets/teams/arearegion.webp`,
    folder: "area",
    players: ["mdl", "Vladyo", "fankyo", "egus", "Gamash"],
  },
  actionpoint: {
    name: "Action Point",
    shortName: "AP",
    region: "Belarus",
    logo: `${BASE}/assets/teams/actionpoint.webp`,
    folder: "action",
    players: ["MoSgAs", "worldislost", "eMAIYo", "yolo", "tsuhinaru"],
  },
  tron: {
    name: "TRON",
    shortName: "TRON",
    region: "Belarus",
    logo: `${BASE}/assets/teams/tron.webp`,
    folder: "tron",
    players: ["temporale", "sekt1en", "Magpie", "Bolt9RA", "Foxan"],
  },
  click: {
    name: "CLICK",
    shortName: "CLK",
    region: "Belarus",
    logo: `${BASE}/assets/teams/click.webp`,
    folder: "click",
    players: ["goto", "malva", "s3rzhik", "dancha", "valdes"],
  },
};

const EXTRA_ASSETS = [
  "/assets/bel-logo-color.webp",
  "/assets/bel-logo-full-light.webp",
  "/assets/bel-hero.webp",
  "/assets/bel-overview.webp",
  "/assets/gallery/gallery1.webp",
  "/assets/gallery/gallery2.webp",
  "/assets/gallery/gallery3.webp",
  "/assets/gallery/gallery4.webp",
];

function localPathFromUrl(url) {
  const u = new URL(url);
  // /assets/players/ug/Faizer.webp -> players/ug/Faizer.webp
  const rel = u.pathname.replace(/^\/assets\//, "");
  return join(OUT, rel);
}

function publicUrlFromLocal(absPath) {
  const rel = relative(join(ROOT, "apps", "api", "uploads"), absPath).replace(/\\/g, "/");
  return `/uploads/${rel}`;
}

async function download(url) {
  const dest = localPathFromUrl(url);
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest)) return { url, dest, skipped: true };
  const res = await fetch(url, {
    headers: { "User-Agent": "ByHLTV-media-sync/1.0" },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await pipeline(res.body, createWriteStream(dest));
  return { url, dest, skipped: false };
}

function collectUrls() {
  const urls = new Set(EXTRA_ASSETS.map((p) => `${BASE}${p}`));
  for (const team of Object.values(BEL_ROSTERS)) {
    urls.add(team.logo);
    for (const nick of team.players) {
      urls.add(`${BASE}/assets/players/${team.folder}/${nick}.webp`);
    }
  }
  // Extra known portraits (bench/history) still useful for gallery density
  const extras = [
    "cyberloga/k1slll",
    "cyberloga/hinzok",
    "cyberloga/nefiss",
    "cyberloga/dazzy",
    "meta/lollipop21k",
    "meta/ksolter",
    "meta/mendel",
    "meta/mdl",
    "meta/znxxx",
    "cyberxata/superb666",
    "cyberxata/-trackk",
    "cyberxata/rlanen",
    "cyberxata/kommunarka",
    "cyberxata/supra",
    "cyberxata/kata733",
    "cyberxata/kazami",
    "cyberxata/floix",
    "connect/Kardinal",
    "connect/Nesh",
    "connect/Thereau",
    "connect/starsk1y",
    "connect/daym1o",
  ];
  for (const p of extras) urls.add(`${BASE}/assets/players/${p}.webp`);
  urls.add(`${BASE}/assets/teams/connect.webp`);
  return [...urls];
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const urls = collectUrls();
  let ok = 0;
  let skip = 0;
  let fail = 0;
  const manifest = { teams: {}, players: {}, gallery: [], covers: {} };

  for (const url of urls) {
    try {
      const r = await download(url);
      if (r.skipped) skip += 1;
      else ok += 1;
      const pub = publicUrlFromLocal(r.dest);
      if (url.includes("/gallery/")) manifest.gallery.push(pub);
      else if (url.includes("/teams/")) {
        const key = url.split("/").pop().replace(/\.webp$/i, "");
        manifest.teams[key] = pub;
      } else if (url.includes("/players/")) {
        const parts = url.split("/players/")[1].replace(/\.webp$/i, "").split("/");
        const folder = parts[0];
        const nick = parts.slice(1).join("/");
        if (!manifest.players[folder]) manifest.players[folder] = {};
        manifest.players[folder][nick] = pub;
      } else if (url.includes("bel-overview") || url.includes("bel-hero") || url.includes("bel-logo")) {
        const key = url.split("/").pop().replace(/\.webp$/i, "");
        manifest.covers[key] = pub;
      }
    } catch (e) {
      fail += 1;
      console.warn("FAIL", url, e.message);
    }
  }

  // Seed-friendly map: teamSlug -> { logo, players: { nick -> photo } }
  const seedMap = {};
  for (const [slug, team] of Object.entries(BEL_ROSTERS)) {
    const logoKey = team.logo.split("/").pop().replace(/\.webp$/i, "");
    seedMap[slug] = {
      name: team.name,
      shortName: team.shortName,
      region: team.region,
      logo: manifest.teams[logoKey] ?? team.logo,
      players: team.players.map((nick) => ({
        nickname: nick,
        photoUrl: manifest.players[team.folder]?.[nick] ?? `${BASE}/assets/players/${team.folder}/${nick}.webp`,
      })),
    };
  }

  const manifestPath = join(OUT, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        source: BASE,
        downloadedAt: new Date().toISOString(),
        counts: { ok, skip, fail, total: urls.length },
        gallery: manifest.gallery,
        covers: manifest.covers,
        seedMap,
      },
      null,
      2,
    ),
  );

  console.log(JSON.stringify({ ok, skip, fail, total: urls.length, manifest: manifestPath }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
