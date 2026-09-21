import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  MatchStatus,
  isContentStaff,
  isTournamentAdmin,
} from "@byhltv/shared";
import { computeFromBasicStats } from "@byhltv/rating-engine";
import { randomBytes } from "crypto";
import { sanitizeMatch } from "../../common/utils/sanitize-match";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { LiveGateway } from "../live/live.gateway";
import { PlayersService } from "../players/players.service";
import { GsiCfgService, GSI_CFG_FILENAME } from "./gsi-cfg.service";
import { gsiLiveStore, type LivePlayerSnapshot } from "./gsi-live-store";

type GsiWeapon = { name?: string; state?: string; type?: string };
type GsiPlayer = {
  steamid?: string;
  name?: string;
  team?: string;
  match_stats?: {
    kills?: number;
    assists?: number;
    deaths?: number;
    mvps?: number;
    score?: number;
  };
  state?: {
    health?: number;
    armor?: number;
    money?: number;
    helmet?: boolean;
    round_kills?: number;
    round_killhs?: number;
    round_totaldmg?: number;
  };
  weapons?: Record<string, GsiWeapon>;
};

type GsiPayload = {
  map?: {
    name?: string;
    phase?: string;
    round?: number;
    team_ct?: { score?: number; name?: string };
    team_t?: { score?: number; name?: string };
  };
  round?: { phase?: string; bomb?: string; win_team?: string };
  allplayers?: Record<string, GsiPlayer>;
  player?: GsiPlayer;
  phase_countdowns?: { phase?: string; phase_ends_in?: string };
  auth?: { token?: string };
};

type MatchWithMaps = {
  id: string;
  slug: string;
  eventId: string;
  team1Id: string;
  team2Id: string;
  team1Score: number;
  team2Score: number;
  team1Side: string | null;
  currentRound: number;
  roundTimeSec: number;
  activeMapName: string | null;
  gsiToken: string | null;
  status: string;
  format: string;
  maps: Array<{
    id: string;
    mapName: string;
    team1Score: number;
    team2Score: number;
    winnerId: string | null;
    order: number;
    team1Side: string | null;
  }>;
  team1: { id: string; name: string; shortName: string };
  team2: { id: string; name: string; shortName: string };
};

@Injectable()
export class GsiService {
  private lastRoundPhase = new Map<string, string>();
  private lastMapName = new Map<string, string>();
  private clientRoster = new Map<string, Map<string, { player: GsiPlayer; at: number }>>();

  constructor(
    private prisma: PrismaService,
    private live: LiveGateway,
    private players: PlayersService,
    private cfg: GsiCfgService,
  ) {}

  async ensureToken(
    matchIdOrSlug: string,
    actor: { id: string; role: string },
    opts?: { regenerate?: boolean },
  ) {
    const match = await this.findMatch(matchIdOrSlug);
    await this.assertCanOperateMatch(actor, match.eventId);
    if (match.gsiToken && !opts?.regenerate) {
      return { token: match.gsiToken, matchId: match.id, slug: match.slug };
    }
    const token = randomBytes(16).toString("hex");
    const updated = await this.prisma.match.update({
      where: { id: match.id },
      data: { gsiToken: token },
    });
    return { token: updated.gsiToken!, matchId: match.id, slug: match.slug };
  }

  async getConfig(
    matchIdOrSlug: string,
    actor: { id: string; role: string },
    host?: string,
  ) {
    const { token, matchId, slug } = await this.ensureToken(matchIdOrSlug, actor);
    const publicBase = this.cfg.resolvePublicBase(host);
    const uri = this.cfg.buildUri(publicBase, token);
    const cfg = this.cfg.buildCfg(uri, token);
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    return {
      token,
      matchId,
      slug,
      uri,
      cfg,
      fileName: GSI_CFG_FILENAME,
      installHints: this.cfg.installHints(),
      gsiLastAt: match?.gsiLastAt ?? null,
      gsiOnline: match?.gsiLastAt
        ? Date.now() - new Date(match.gsiLastAt).getTime() < 45_000
        : false,
    };
  }

  async assertCanOperateMatch(actor: { id: string; role: string }, eventId: string) {
    if (isContentStaff(actor.role)) return;
    if (!isTournamentAdmin(actor.role)) throw new ForbiddenException();
    const org = await this.prisma.eventOrganizer.findUnique({
      where: { eventId_userId: { eventId, userId: actor.id } },
    });
    if (!org) throw new ForbiddenException("Not an organizer of this event");
  }

  async ingest(token: string, body: GsiPayload) {
    const match = (await this.prisma.match.findUnique({
      where: { gsiToken: token },
      include: {
        maps: { orderBy: { order: "asc" } },
        team1: true,
        team2: true,
      },
    })) as MatchWithMaps | null;
    if (!match) throw new UnauthorizedException("Invalid GSI token");

    if (gsiLiveStore.isBlocked(match.id)) {
      await this.prisma.match.update({
        where: { id: match.id },
        data: { gsiLastAt: new Date() },
      });
      return { ok: true, blocked: true };
    }

    const rawMap = body.map?.name || match.activeMapName || "Unknown";
    const mapName = this.normalizeMap(rawMap);
    const ctScore = body.map?.team_ct?.score ?? 0;
    const tScore = body.map?.team_t?.score ?? 0;
    const roundNum = body.map?.round ?? match.currentRound;
    const phaseEnd = Number(body.phase_countdowns?.phase_ends_in ?? match.roundTimeSec);
    const mapPhase = body.map?.phase ?? "";
    const roundPhase = body.round?.phase ?? "";

    const team1Side = this.resolveTeam1Side(match, body, roundNum);
    const { team1MapScore, team2MapScore } = this.scoresForTeams(team1Side, ctScore, tScore);

    const prevMap = this.lastMapName.get(match.id);
    if (prevMap && prevMap !== mapName && mapPhase !== "gameover") {
      await this.finalizeActiveMap(match, prevMap);
    }
    this.lastMapName.set(match.id, mapName);

    let active =
      match.maps.find((m) => !m.winnerId && this.mapEquals(m.mapName, mapName)) ??
      match.maps.find((m) => !m.winnerId) ??
      match.maps[0];

    if (active && !this.mapEquals(active.mapName, mapName) && !active.winnerId) {
      await this.prisma.matchMap.update({
        where: { id: active.id },
        data: { mapName },
      });
      active = { ...active, mapName };
    }

    const isGameOver = mapPhase === "gameover" || mapPhase === "intermission";

    await this.prisma.match.update({
      where: { id: match.id },
      data: {
        status: MatchStatus.LIVE,
        currentRound: roundNum,
        roundTimeSec: Number.isFinite(phaseEnd) ? Math.round(phaseEnd) : match.roundTimeSec,
        activeMapName: mapName,
        team1Side,
        gsiLastAt: new Date(),
      },
    });

    if (active) {
      await this.prisma.matchMap.update({
        where: { id: active.id },
        data: {
          team1Score: team1MapScore,
          team2Score: team2MapScore,
          mapName: active.mapName || mapName,
          team1Side,
        },
      });
    }

    const prevPhase = this.lastRoundPhase.get(match.id);
    if (roundPhase === "over" && prevPhase && prevPhase !== "over") {
      const winnerSide = body.round?.win_team === "T" ? "T" : "CT";
      const mapNumber = match.maps.findIndex((m) => m.id === active?.id) + 1 || 1;
      await this.prisma.matchRound.create({
        data: {
          matchId: match.id,
          mapNumber,
          roundNumber: roundNum,
          winnerSide,
          team1Score: team1MapScore,
          team2Score: team2MapScore,
          bombPlanted: !!body.round?.bomb && body.round.bomb !== "",
        },
      });
      await this.prisma.matchEvent.create({
        data: {
          matchId: match.id,
          type: "ROUND_END",
          mapName,
          round: roundNum,
          payload: JSON.stringify({ winnerSide, ctScore, tScore, team1Side }),
        },
      });
    }
    this.lastRoundPhase.set(match.id, roundPhase);

    if (isGameOver) {
      await this.finalizeActiveMap(
        { ...match, maps: match.maps },
        mapName,
        team1MapScore,
        team2MapScore,
      );
    }

    const allplayers = this.mergePlayers(match.id, body);
    const steamIds = Object.values(allplayers)
      .map((p) => p.steamid)
      .filter((s): s is string => !!s);

    const dbPlayers = steamIds.length
      ? await this.prisma.player.findMany({ where: { steamId: { in: steamIds } } })
      : [];
    const bySteam = new Map(dbPlayers.map((p) => [p.steamId!, p]));

    const livePlayers: LivePlayerSnapshot[] = [];
    const roundsPlayed = Math.max(1, ctScore + tScore || roundNum || 1);

    for (const p of Object.values(allplayers)) {
      if (!p.steamid) continue;
      const player = bySteam.get(p.steamid);
      const kills = p.match_stats?.kills ?? 0;
      const deaths = p.match_stats?.deaths ?? 0;
      const assists = p.match_stats?.assists ?? 0;
      const headshots = p.state?.round_killhs ?? 0;
      const damageFromState = p.state?.round_totaldmg;
      const adr =
        damageFromState != null && roundsPlayed > 0
          ? Math.max(0, (kills * 80 + assists * 20) / roundsPlayed) // live ADR estimate mid-round
          : Math.max(40, 55 + kills * 3.2 - deaths * 1.5);
      const rating = computeFromBasicStats({
        kills,
        deaths,
        assists,
        adr,
        roundsPlayed,
      });

      const weapon = this.activeWeapon(p.weapons);
      livePlayers.push({
        steamId: p.steamid,
        name: p.name ?? player?.nickname ?? "Unknown",
        team: p.team === "T" ? "T" : "CT",
        kills,
        deaths,
        assists,
        headshots,
        health: p.state?.health ?? 0,
        armor: p.state?.armor ?? 0,
        money: p.state?.money ?? 0,
        hasHelmet: !!p.state?.helmet,
        damage: Math.round(rating.adr * roundsPlayed),
        alive: (p.state?.health ?? 0) > 0,
        weapon,
        playerId: player?.id ?? null,
      });

      if (!player) continue;

      await this.prisma.playerMatchStat.upsert({
        where: {
          matchId_playerId_mapName: {
            matchId: match.id,
            playerId: player.id,
            mapName,
          },
        },
        create: {
          matchId: match.id,
          playerId: player.id,
          mapName,
          kills,
          deaths,
          assists,
          headshots,
          adr: rating.adr,
          rating: rating.rating30,
          rating21: rating.rating21,
          rating30: rating.rating30,
          kast: rating.kast,
          impact: rating.impact,
          damage: Math.round(rating.adr * roundsPlayed),
          roundsPlayed,
        },
        update: {
          kills,
          deaths,
          assists,
          headshots,
          adr: rating.adr,
          rating: rating.rating30,
          rating21: rating.rating21,
          rating30: rating.rating30,
          kast: rating.kast,
          impact: rating.impact,
          damage: Math.round(rating.adr * roundsPlayed),
          roundsPlayed,
        },
      });
    }

    gsiLiveStore.set(match.id, {
      matchId: match.id,
      slug: match.slug,
      updatedAt: new Date().toISOString(),
      mapName,
      round: roundNum,
      roundPhase,
      bombState: body.round?.bomb ?? null,
      scoreCt: ctScore,
      scoreT: tScore,
      team1Side,
      players: livePlayers,
    });

    for (const p of dbPlayers) {
      await this.players.recomputeCareer(p.id);
    }

    await this.broadcastFresh(match.id);
    return { ok: true, playersMapped: dbPlayers.length, livePlayers: livePlayers.length };
  }

  private async finalizeActiveMap(
    match: MatchWithMaps,
    mapName: string,
    team1Score?: number,
    team2Score?: number,
  ) {
    const maps = await this.prisma.matchMap.findMany({
      where: { matchId: match.id },
      orderBy: { order: "asc" },
    });
    const active =
      maps.find((m) => !m.winnerId && this.mapEquals(m.mapName, mapName)) ??
      maps.find((m) => !m.winnerId);
    if (!active) return;

    const t1 = team1Score ?? active.team1Score;
    const t2 = team2Score ?? active.team2Score;
    if (t1 === t2) return;

    const winnerId = t1 > t2 ? match.team1Id : match.team2Id;
    await this.prisma.matchMap.update({
      where: { id: active.id },
      data: { winnerId, team1Score: t1, team2Score: t2, mapName: active.mapName || mapName },
    });

    const seriesT1 = match.team1Score + (winnerId === match.team1Id ? 1 : 0);
    const seriesT2 = match.team2Score + (winnerId === match.team2Id ? 1 : 0);
    const need = this.mapsToWin(match.format);
    const finished = seriesT1 >= need || seriesT2 >= need;

    await this.prisma.match.update({
      where: { id: match.id },
      data: {
        team1Score: seriesT1,
        team2Score: seriesT2,
        status: finished ? MatchStatus.FINISHED : MatchStatus.LIVE,
        team1Side: null,
      },
    });

    match.team1Score = seriesT1;
    match.team2Score = seriesT2;
  }

  private mapsToWin(format: string): number {
    if (format === "BO1") return 1;
    if (format === "BO5") return 3;
    return 2;
  }

  private resolveTeam1Side(
    match: MatchWithMaps,
    body: GsiPayload,
    roundNum: number,
  ): "CT" | "T" {
    const ctName = body.map?.team_ct?.name ?? "";
    const tName = body.map?.team_t?.name ?? "";
    const ctMatch = this.teamNameScore(ctName, match.team1);
    const tMatch = this.teamNameScore(tName, match.team1);
    if (ctMatch > 0 || tMatch > 0) {
      return ctMatch >= tMatch ? "CT" : "T";
    }
    if (match.team1Side === "CT" || match.team1Side === "T") {
      // Halftime flip after round 12 in MR12
      if (roundNum >= 13 && match.currentRound < 13) {
        return match.team1Side === "CT" ? "T" : "CT";
      }
      return match.team1Side;
    }
    return "CT";
  }

  private teamNameScore(
    gsiName: string,
    team: { name: string; shortName: string },
  ): number {
    const a = this.normName(gsiName);
    if (!a) return 0;
    const names = [team.name, team.shortName].map((n) => this.normName(n));
    if (names.some((n) => n === a)) return 3;
    if (names.some((n) => n.includes(a) || a.includes(n))) return 2;
    return 0;
  }

  private normName(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9а-яёіў]/gi, "");
  }

  private scoresForTeams(team1Side: "CT" | "T", ct: number, t: number) {
    if (team1Side === "CT") return { team1MapScore: ct, team2MapScore: t };
    return { team1MapScore: t, team2MapScore: ct };
  }

  private mergePlayers(matchId: string, body: GsiPayload): Record<string, GsiPlayer> {
    const fromAll = body.allplayers ?? {};
    if (Object.keys(fromAll).length > 0) {
      this.clientRoster.delete(matchId);
      return fromAll;
    }
    // Client-mode: merge single player payloads by steamid
    let roster = this.clientRoster.get(matchId);
    if (!roster) {
      roster = new Map();
      this.clientRoster.set(matchId, roster);
    }
    const now = Date.now();
    if (body.player?.steamid) {
      roster.set(body.player.steamid, { player: body.player, at: now });
    }
    for (const [sid, entry] of roster) {
      if (now - entry.at > 120_000) roster.delete(sid);
    }
    const out: Record<string, GsiPlayer> = {};
    for (const [sid, entry] of roster) out[sid] = entry.player;
    return out;
  }

  private activeWeapon(weapons?: Record<string, GsiWeapon>): string | null {
    if (!weapons) return null;
    for (const w of Object.values(weapons)) {
      if (w.state === "active" && w.name) return w.name.replace(/^weapon_/, "");
    }
    return null;
  }

  private mapEquals(a: string, b: string) {
    return this.normalizeMap(a).toLowerCase() === this.normalizeMap(b).toLowerCase();
  }

  private async broadcastFresh(matchId: string) {
    const fresh = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        team1: true,
        team2: true,
        event: true,
        maps: { orderBy: { order: "asc" } },
        playerStats: { include: { player: true } },
        rounds: { orderBy: [{ mapNumber: "asc" }, { roundNumber: "asc" }] },
        vetos: { orderBy: { order: "asc" } },
      },
    });
    if (!fresh) return;
    const snap = gsiLiveStore.get(matchId);
    const payload = {
      ...sanitizeMatch(fresh),
      livePlayers: snap?.players ?? [],
      gsiOnline: !!fresh.gsiLastAt && Date.now() - new Date(fresh.gsiLastAt).getTime() < 45_000,
      bombState: snap?.bombState ?? null,
      roundPhase: snap?.roundPhase ?? null,
    };
    this.live.broadcastMatchUpdate(payload);
    this.live.broadcastStatsUpdate(payload);
  }

  private async findMatch(idOrSlug: string) {
    const match =
      (await this.prisma.match.findUnique({ where: { slug: idOrSlug } })) ||
      (await this.prisma.match.findUnique({ where: { id: idOrSlug } }));
    if (!match) throw new NotFoundException("Match not found");
    return match;
  }

  private normalizeMap(raw: string) {
    const name = raw.replace(/^de_/i, "");
    if (!name) return "Unknown";
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}
