import { Injectable } from "@nestjs/common";

export const GSI_CFG_FILENAME = "gamestate_integration_byhltv.cfg";

@Injectable()
export class GsiCfgService {
  buildUri(publicBase: string, token: string): string {
    const base = publicBase.replace(/\/$/, "");
    const prefix = base.endsWith("/api/v1") ? base : `${base}/api/v1`;
    return `${prefix}/gsi/${token}`;
  }

  buildCfg(uri: string, token: string): string {
    return `"ByHLTV GSI Configuration"
{
    "uri" "${uri}"
    "timeout" "5.0"
    "buffer"  "0.1"
    "throttle" "0.1"
    "heartbeat" "30.0"
    "auth"
    {
        "token" "${token}"
    }
    "data"
    {
        "provider"               "1"
        "map"                    "1"
        "map_team_ct"            "1"
        "map_team_t"             "1"
        "round"                  "1"
        "player_id"              "1"
        "player_state"           "1"
        "player_weapons"         "1"
        "player_match_stats"     "1"
        "allplayers_id"          "1"
        "allplayers_state"       "1"
        "allplayers_match_stats" "1"
        "allplayers_weapons"     "1"
        "allplayers_position"    "1"
        "bomb"                   "1"
        "phase_countdowns"       "1"
        "grenades"               "1"
    }
}
`;
  }

  installHints(): string[] {
    return [
      `Dedicated: place ${GSI_CFG_FILENAME} in csgo/cfg/ (full 10-player allplayers_*).`,
      `Client listen: Steam/.../game/csgo/cfg/${GSI_CFG_FILENAME} — or install on each player PC; API merges by steamid.`,
      "Bots do not appear in GSI — need real players.",
      "Restart CS2 / dedicated after installing the cfg, then join the match.",
      "Public host must be reachable from the game PC (LAN IP or tunnel), not only localhost on another machine.",
    ];
  }

  resolvePublicBase(overrideHost?: string): string {
    if (overrideHost?.trim()) {
      const h = overrideHost.trim();
      if (h.startsWith("http://") || h.startsWith("https://")) return h.replace(/\/$/, "");
      return `http://${h}`;
    }
    if (process.env.GSI_PUBLIC_BASE_URL?.trim()) {
      return process.env.GSI_PUBLIC_BASE_URL.trim().replace(/\/$/, "");
    }
    const port = process.env.PORT ?? "4000";
    return `http://localhost:${port}`;
  }
}
