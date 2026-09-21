import { Injectable, Logger } from "@nestjs/common";

export type ParsedDemoPlayer = {
  steamId: string;
  name: string;
  team?: string;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  damage: number;
  openingKills: number;
  kastRounds: number;
  roundsPlayed: number;
};

export type ParsedDemoRound = {
  roundNumber: number;
  winnerSide: string;
  team1Score: number;
  team2Score: number;
  bombPlanted: boolean;
};

export type ParsedDemo = {
  mapName: string;
  team1Score: number;
  team2Score: number;
  players: ParsedDemoPlayer[];
  rounds: ParsedDemoRound[];
};

type DeathEvent = {
  attacker_steamid?: string | number;
  user_steamid?: string | number;
  attacker_name?: string;
  user_name?: string;
  assister_steamid?: string | number;
  headshot?: boolean;
  total_rounds_played?: number;
  attacker_team_name?: string;
  user_team_name?: string;
};

type RoundEndEvent = {
  winner?: string;
  reason?: number | string;
  total_rounds_played?: number;
  ct_team_score?: number;
  t_team_score?: number;
};

@Injectable()
export class DemoParserService {
  private readonly log = new Logger(DemoParserService.name);

  async parseFile(path: string): Promise<ParsedDemo> {
    // Native binding — loaded at runtime so API can boot without the package in edge cases.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const demoparser = require("@laihoe/demoparser2") as {
      parseEvent: (
        file: string,
        event: string,
        playerExtra?: string[],
        otherExtra?: string[],
      ) => unknown[];
      parseHeader?: (file: string) => { map_name?: string; mapName?: string };
    };

    let mapName = "Unknown";
    try {
      if (typeof demoparser.parseHeader === "function") {
        const header = demoparser.parseHeader(path);
        mapName = header.map_name || header.mapName || mapName;
      }
    } catch (err) {
      this.log.warn(`parseHeader failed: ${err instanceof Error ? err.message : err}`);
    }

    const deaths = (demoparser.parseEvent(
      path,
      "player_death",
      ["team_name"],
      ["total_rounds_played"],
    ) ?? []) as DeathEvent[];

    const roundEnds = (demoparser.parseEvent(
      path,
      "round_end",
      [],
      ["total_rounds_played", "ct_team_score", "t_team_score"],
    ) ?? []) as RoundEndEvent[];

    let hurts: Array<{
      attacker_steamid?: string | number;
      dmg_health?: number;
      total_rounds_played?: number;
    }> = [];
    try {
      hurts = (demoparser.parseEvent(path, "player_hurt", [], ["total_rounds_played"]) ??
        []) as typeof hurts;
    } catch {
      /* optional */
    }

    const players = new Map<string, ParsedDemoPlayer>();
    const ensure = (steamId: string, name: string) => {
      let p = players.get(steamId);
      if (!p) {
        p = {
          steamId,
          name: name || "Player",
          kills: 0,
          deaths: 0,
          assists: 0,
          headshots: 0,
          damage: 0,
          openingKills: 0,
          kastRounds: 0,
          roundsPlayed: 0,
        };
        players.set(steamId, p);
      }
      return p;
    };

    const sid = (v: string | number | undefined) =>
      v === undefined || v === null || v === "0" || v === 0 ? "" : String(v);

    const openingByRound = new Set<number>();

    for (const d of deaths) {
      const attacker = sid(d.attacker_steamid);
      const victim = sid(d.user_steamid);
      const assister = sid(d.assister_steamid);
      const round = Number(d.total_rounds_played ?? 0);

      if (attacker && attacker !== victim) {
        const a = ensure(attacker, d.attacker_name ?? "Player");
        a.kills += 1;
        if (d.headshot) a.headshots += 1;
        if (d.attacker_team_name) a.team = d.attacker_team_name;
        if (!openingByRound.has(round)) {
          openingByRound.add(round);
          a.openingKills += 1;
        }
      }
      if (victim) {
        const v = ensure(victim, d.user_name ?? "Player");
        v.deaths += 1;
        if (d.user_team_name) v.team = d.user_team_name;
      }
      if (assister && assister !== attacker) {
        const as = ensure(assister, "Player");
        as.assists += 1;
      }
    }

    for (const h of hurts) {
      const attacker = sid(h.attacker_steamid);
      if (!attacker) continue;
      const p = ensure(attacker, "Player");
      p.damage += Math.max(0, Number(h.dmg_health ?? 0));
    }

    // Approximate KAST: rounds with kill or assist count as kast rounds
    const roundsWithKa = new Map<string, Set<number>>();
    for (const d of deaths) {
      const round = Number(d.total_rounds_played ?? 0);
      const attacker = sid(d.attacker_steamid);
      const assister = sid(d.assister_steamid);
      if (attacker) {
        if (!roundsWithKa.has(attacker)) roundsWithKa.set(attacker, new Set());
        roundsWithKa.get(attacker)!.add(round);
      }
      if (assister) {
        if (!roundsWithKa.has(assister)) roundsWithKa.set(assister, new Set());
        roundsWithKa.get(assister)!.add(round);
      }
    }
    for (const [steamId, set] of roundsWithKa) {
      const p = players.get(steamId);
      if (p) p.kastRounds = set.size;
    }

    const rounds: ParsedDemoRound[] = [];
    let team1Score = 0;
    let team2Score = 0;
    for (const r of roundEnds) {
      const winnerRaw = String(r.winner ?? "").toLowerCase();
      const winnerSide =
        winnerRaw.includes("t") && !winnerRaw.includes("ct")
          ? "T"
          : winnerRaw.includes("ct")
            ? "CT"
            : winnerRaw === "2"
              ? "T"
              : "CT";
      const ct = Number(r.ct_team_score ?? team1Score);
      const t = Number(r.t_team_score ?? team2Score);
      // Store CT as team1 score axis for map (ops can remap); series uses winnerId later
      team1Score = Math.max(team1Score, ct);
      team2Score = Math.max(team2Score, t);
      rounds.push({
        roundNumber: Number(r.total_rounds_played ?? rounds.length) + 1,
        winnerSide,
        team1Score: ct,
        team2Score: t,
        bombPlanted: false,
      });
    }

    if (!rounds.length && (team1Score === 0 || team2Score === 0)) {
      // Fallback from death max round
      const maxRound = Math.max(0, ...deaths.map((d) => Number(d.total_rounds_played ?? 0)));
      team1Score = Math.ceil((maxRound + 1) / 2);
      team2Score = Math.floor((maxRound + 1) / 2);
    }

    const totalRounds = Math.max(rounds.length, team1Score + team2Score, 1);
    for (const p of players.values()) {
      p.roundsPlayed = totalRounds;
      if (p.damage <= 0) {
        p.damage = Math.round((p.kills * 80 + p.assists * 20) * 1.1);
      }
    }

    if (mapName === "Unknown" && path) {
      const base = path.split(/[/\\]/).pop() ?? "";
      const m = base.match(/de_([a-z0-9]+)/i);
      if (m) mapName = m[1];
    }

    return {
      mapName,
      team1Score,
      team2Score,
      players: [...players.values()],
      rounds,
    };
  }
}
