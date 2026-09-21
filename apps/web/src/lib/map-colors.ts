import { normalizeMapName } from "@/lib/maps";

/** HLTV-like map label banner colors */
export const MAP_BANNER: Record<string, string> = {
  Nuke: "#b8453a",
  Inferno: "#3a6ea8",
  Mirage: "#6b4f96",
  Dust2: "#b08a2e",
  Ancient: "#3d7a5c",
  Anubis: "#b0893a",
  Cache: "#4a6f8a",
  Vertigo: "#5a6a7a",
  Overpass: "#3a7a8a",
};

export function mapBannerColor(mapName: string): string {
  return MAP_BANNER[normalizeMapName(mapName)] ?? "#4a5560";
}
