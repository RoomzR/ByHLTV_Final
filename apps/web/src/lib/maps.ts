/** Active ByHLTV map pool (7 maps). */
export const CS2_MAP_POOL = [
  "Nuke",
  "Mirage",
  "Ancient",
  "Anubis",
  "Dust2",
  "Inferno",
  "Cache",
] as const;

export type Cs2MapName = (typeof CS2_MAP_POOL)[number];

const ALIASES: Record<string, Cs2MapName> = {
  nuke: "Nuke",
  mirage: "Mirage",
  ancient: "Ancient",
  anubis: "Anubis",
  dust2: "Dust2",
  dust_2: "Dust2",
  "dust 2": "Dust2",
  inferno: "Inferno",
  cache: "Cache",
};

export function normalizeMapName(raw: string): string {
  const cleaned = raw.replace(/^de_/i, "").trim();
  if (!cleaned) return "Unknown";
  const key = cleaned.toLowerCase().replace(/\s+/g, " ");
  if (ALIASES[key]) return ALIASES[key];
  const compact = key.replace(/[^a-z0-9]/g, "");
  if (ALIASES[compact]) return ALIASES[compact];
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function mapSlug(name: string): string {
  return normalizeMapName(name).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * HLTV-style map screenshot background (webp).
 * Falls back to stylized SVG if the photo asset is missing.
 */
export function mapImageSrc(name: string): string {
  return `/maps/${mapSlug(name)}.webp`;
}

/** Decorative SVG fallback when photo is unavailable. */
export function mapFallbackSrc(name: string): string {
  return `/maps/${mapSlug(name)}.svg`;
}

export const DEFAULT_MAP_POOL_JSON = JSON.stringify([...CS2_MAP_POOL]);
