import { computeFromBasicStats } from "@byhltv/rating-engine";
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  forwardRef,
} from "@nestjs/common";
import {
  MatchStatus,
  isContentStaff,
  isTournamentAdmin,
  type CreateMatchInput,
  type MatchLiveUpdateInput,
  type MatchRoundInput,
  type MatchVetosInput,
  type UpdateMatchMetaInput,
} from "@byhltv/shared";
import { sanitizeMatch, isGsiOnline } from "../../common/utils/sanitize-match";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { gsiLiveStore } from "../gsi/gsi-live-store";
import { LiveGateway } from "../live/live.gateway";
import { PlayersService } from "../players/players.service";

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    @Optional()
    @Inject(forwardRef(() => LiveGateway))
    private live?: LiveGateway,
    @Optional()
    @Inject(forwardRef(() => PlayersService))
    private players?: PlayersService,
  ) {}

  async assertCanOperateMatch(actor: { id: string; role: string }, eventId: string) {
    if (isContentStaff(actor.role)) return;
    if (!isTournamentAdmin(actor.role)) throw new ForbiddenException();
    const org = await this.prisma.eventOrganizer.findUnique({
      where: { eventId_userId: { eventId, userId: actor.id } },
    });
    if (!org) throw new ForbiddenException("Not an organizer of this event");
  }

  /** Editors publish any match; TO may create only for events they organize. */
  async assertCanPublishMatch(actor: { id: string; role: string }, eventId: string) {
    if (isContentStaff(actor.role)) return;
    await this.assertCanOperateMatch(actor, eventId);
  }

  async create(input: CreateMatchInput, actor: { id: string; role: string }) {
    await this.assertCanPublishMatch(actor, input.eventId);

    if (input.team1Id === input.team2Id) {
      throw new BadRequestException("Teams must be different");
    }

    const [team1, team2, event] = await Promise.all([
      this.prisma.team.findUnique({ where: { id: input.team1Id } }),
      this.prisma.team.findUnique({ where: { id: input.team2Id } }),
      this.prisma.event.findUnique({ where: { id: input.eventId } }),
    ]);
    if (!team1 || !team2) throw new BadRequestException("Team not found");
    if (!event) throw new BadRequestException("Event not found");

    const scheduledAt = new Date(input.scheduledAt);
    const slug =
      input.slug?.trim() ||
      this.slugify(
        `${team1.shortName}-vs-${team2.shortName}-${scheduledAt.toISOString().slice(0, 10)}`,
      );

    const existing = await this.prisma.match.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException("Slug already exists");

    const mapCount = input.format === "BO1" ? 1 : input.format === "BO5" ? 5 : 3;
    const mapNames =
      input.maps && input.maps.length > 0
        ? input.maps.slice(0, mapCount)
        : Array.from({ length: mapCount }, (_, i) => `Map ${i + 1}`);

    const match = await this.prisma.match.create({
      data: {
        slug,
        team1Id: input.team1Id,
        team2Id: input.team2Id,
        eventId: input.eventId,
        format: input.format,
        scheduledAt,
        stars: input.stars ?? 0,
        streamUrl: input.streamUrl ?? null,
        status: (input.status as MatchStatus) ?? MatchStatus.UPCOMING,
        maps: {
          create: mapNames.map((mapName, i) => ({
            mapName,
            order: i + 1,
          })),
        },
      },
      include: {
        team1: true,
        team2: true,
        event: true,
        maps: { orderBy: { order: "asc" } },
        vetos: { orderBy: { order: "asc" } },
        playerStats: { include: { player: true } },
        rounds: true,
      },
    });

    await this.invalidateCache();
    return sanitizeMatch(match);
  }

  async updateMeta(slug: string, input: UpdateMatchMetaInput, actor: { id: string; role: string }) {
    const match = await this.prisma.match.findUnique({ where: { slug } });
    if (!match) throw new NotFoundException();
    await this.assertCanPublishMatch(actor, match.eventId);

    if (input.maps) {
      await this.prisma.matchMap.deleteMany({ where: { matchId: match.id } });
      await this.prisma.matchMap.createMany({
        data: input.maps.map((m, i) => ({
          matchId: match.id,
          mapName: m.mapName,
          team1Score: m.team1Score ?? 0,
          team2Score: m.team2Score ?? 0,
          winnerId: m.winnerId ?? null,
          order: i + 1,
        })),
      });
    }

    await this.prisma.match.update({
      where: { id: match.id },
      data: {
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        format: input.format,
        stars: input.stars,
        streamUrl: input.streamUrl === undefined ? undefined : input.streamUrl,
        status: input.status as MatchStatus | undefined,
      },
    });

    await this.invalidateCache();
    return this.bySlug(slug);
  }

  async setVetos(slug: string, input: MatchVetosInput, actor: { id: string; role: string }) {
    const match = await this.prisma.match.findUnique({ where: { slug } });
    if (!match) throw new NotFoundException();
    await this.assertCanPublishMatch(actor, match.eventId);

    for (const v of input.vetos) {
      if (v.teamId && v.teamId !== match.team1Id && v.teamId !== match.team2Id) {
        throw new BadRequestException("Veto team must be one of the match teams");
      }
      if ((v.action === "ban" || v.action === "pick") && !v.teamId) {
        throw new BadRequestException("ban/pick requires teamId");
      }
    }

    await this.prisma.mapVeto.deleteMany({ where: { matchId: match.id } });
    if (input.vetos.length) {
      await this.prisma.mapVeto.createMany({
        data: input.vetos.map((v) => ({
          matchId: match.id,
          action: v.action,
          mapName: v.mapName,
          teamId: v.teamId ?? null,
          order: v.order,
        })),
      });
    }

    // Sync picked / leftover maps into MatchMap slots (preserve scores where possible)
    const playMaps = input.vetos
      .filter((v) => v.action === "pick" || v.action === "leftover")
      .sort((a, b) => a.order - b.order);
    if (playMaps.length) {
      const existing = await this.prisma.matchMap.findMany({
        where: { matchId: match.id },
        orderBy: { order: "asc" },
      });
      await this.prisma.matchMap.deleteMany({ where: { matchId: match.id } });
      await this.prisma.matchMap.createMany({
        data: playMaps.map((m, i) => {
          const prev = existing.find((e) => e.mapName.toLowerCase() === m.mapName.toLowerCase());
          return {
            matchId: match.id,
            mapName: m.mapName,
            order: i + 1,
            team1Score: prev?.team1Score ?? 0,
            team2Score: prev?.team2Score ?? 0,
            winnerId: prev?.winnerId ?? null,
            team1Side: prev?.team1Side ?? null,
          };
        }),
      });
    }

    await this.invalidateCache();
    const fresh = await this.bySlug(slug);
    this.live?.broadcastMatchUpdate(fresh);
    return fresh;
  }

  private slugify(raw: string) {
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  }

  async list(status?: MatchStatus) {
    const cacheKey = `matches:${status ?? "all"}:v2`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const items = await this.prisma.match.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: "asc" }, { scheduledAt: "desc" }],
      include: {
        team1: true,
        team2: true,
        event: true,
        maps: { orderBy: { order: "asc" } },
        odds: true,
        vetos: { orderBy: { order: "asc" } },
        playerStats: { include: { player: true } },
        rounds: { orderBy: [{ mapNumber: "asc" }, { roundNumber: "asc" }] },
      },
    });
    const safe = items.map((m) => {
      const base = sanitizeMatch(m);
      const snap = gsiLiveStore.get(m.id);
      return {
        ...base,
        livePlayers: m.status === "LIVE" ? snap?.players ?? [] : [],
        gsiOnline: isGsiOnline(m.gsiLastAt),
        gsiLastAt: m.gsiLastAt,
      };
    });
    await this.redis.set(cacheKey, JSON.stringify(safe), 15);
    return safe;
  }

  async bySlug(slug: string) {
    const teamWithRoster = {
      include: { players: { orderBy: { rating: "desc" as const }, take: 5 } },
    };
    const match = await this.prisma.match.findUnique({
      where: { slug },
      include: {
        team1: teamWithRoster,
        team2: teamWithRoster,
        event: true,
        maps: { orderBy: { order: "asc" } },
        vetos: { orderBy: { order: "asc" } },
        playerStats: { include: { player: true } },
        rounds: { orderBy: [{ mapNumber: "asc" }, { roundNumber: "asc" }] },
        odds: true,
        bracket: true,
      },
    });
    if (!match) throw new NotFoundException();
    const snap = gsiLiveStore.get(match.id);
    return {
      ...sanitizeMatch(match),
      livePlayers: snap?.players ?? [],
      gsiOnline: isGsiOnline(match.gsiLastAt),
      gsiLastAt: match.gsiLastAt,
      bombState: snap?.bombState ?? null,
      roundPhase: snap?.roundPhase ?? null,
    };
  }

  async updateScore(slug: string, body: MatchLiveUpdateInput, actor?: { id: string; role: string }) {
    return this.updateLive(slug, body, actor);
  }

  async updateLive(slug: string, body: MatchLiveUpdateInput, actor?: { id: string; role: string }) {
    const match = await this.prisma.match.findUnique({ where: { slug } });
    if (!match) throw new NotFoundException();
    if (actor) await this.assertCanOperateMatch(actor, match.eventId);

    if (body.maps) {
      await this.prisma.matchMap.deleteMany({ where: { matchId: match.id } });
      await this.prisma.matchMap.createMany({
        data: body.maps.map((m, i) => ({
          matchId: match.id,
          mapName: m.mapName,
          team1Score: m.team1Score,
          team2Score: m.team2Score,
          winnerId: m.winnerId,
          team1Side: m.team1Side,
          order: i + 1,
        })),
      });
    }

    const updated = await this.prisma.match.update({
      where: { id: match.id },
      data: {
        team1Score: body.team1Score,
        team2Score: body.team2Score,
        status: body.status as MatchStatus | undefined,
        team1Side: body.team1Side === null ? null : body.team1Side,
        currentRound: body.currentRound,
        roundTimeSec: body.roundTimeSec,
        activeMapName: body.activeMapName === null ? null : body.activeMapName,
      },
      include: {
        team1: true,
        team2: true,
        maps: { orderBy: { order: "asc" } },
        event: true,
        playerStats: { include: { player: true } },
        rounds: { orderBy: [{ mapNumber: "asc" }, { roundNumber: "asc" }] },
        vetos: { orderBy: { order: "asc" } },
      },
    });

    await this.invalidateCache();
    const safe = sanitizeMatch(updated);
    this.live?.broadcastMatchUpdate(safe);
    return safe;
  }

  async upsertStats(
    slug: string,
    stats: Array<{
      playerId: string;
      mapName?: string;
      kills: number;
      deaths: number;
      assists: number;
      adr: number;
      rating?: number;
      roundsPlayed?: number;
    }>,
    actor?: { id: string; role: string },
  ) {
    const match = await this.prisma.match.findUnique({ where: { slug } });
    if (!match) throw new NotFoundException();
    if (actor) await this.assertCanOperateMatch(actor, match.eventId);

    await this.prisma.playerMatchStat.deleteMany({ where: { matchId: match.id } });
    const rows = stats.map((s) => {
      const rounds = s.roundsPlayed ?? Math.max(1, match.currentRound || 24);
      const computed = computeFromBasicStats({
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
        adr: s.adr,
        roundsPlayed: rounds,
      });
      return {
        matchId: match.id,
        playerId: s.playerId,
        mapName: s.mapName ?? match.activeMapName ?? "Unknown",
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
        adr: computed.adr,
        rating: s.rating ?? computed.rating30,
        rating21: computed.rating21,
        rating30: computed.rating30,
        kast: computed.kast,
        impact: computed.impact,
        damage: Math.round(computed.adr * rounds),
        roundsPlayed: rounds,
      };
    });
    await this.prisma.playerMatchStat.createMany({ data: rows });

    for (const s of stats) {
      await this.players?.recomputeCareer(s.playerId);
    }

    const updated = await this.bySlug(slug);
    this.live?.broadcastStatsUpdate(updated);
    return updated;
  }

  async addRound(slug: string, input: MatchRoundInput, actor?: { id: string; role: string }) {
    const match = await this.prisma.match.findUnique({ where: { slug } });
    if (!match) throw new NotFoundException();
    if (actor) await this.assertCanOperateMatch(actor, match.eventId);

    await this.prisma.matchRound.create({
      data: {
        matchId: match.id,
        mapNumber: input.mapNumber,
        roundNumber: input.roundNumber,
        winnerSide: input.winnerSide,
        team1Score: input.team1Score,
        team2Score: input.team2Score,
        bombPlanted: input.bombPlanted ?? false,
        isEco: input.isEco ?? false,
        note: input.note,
      },
    });

    const updated = await this.prisma.match.update({
      where: { id: match.id },
      data: {
        currentRound: input.roundNumber,
        team1Score: match.status === MatchStatus.LIVE ? match.team1Score : match.team1Score,
      },
      include: {
        team1: true,
        team2: true,
        maps: { orderBy: { order: "asc" } },
        event: true,
        rounds: { orderBy: [{ mapNumber: "asc" }, { roundNumber: "asc" }] },
        playerStats: { include: { player: true } },
        vetos: { orderBy: { order: "asc" } },
      },
    });

    // Also bump active map scores if provided via map scores in round
    const maps = updated.maps;
    const active = maps.find((m) => !m.winnerId) ?? maps.at(-1);
    if (active) {
      await this.prisma.matchMap.update({
        where: { id: active.id },
        data: { team1Score: input.team1Score, team2Score: input.team2Score },
      });
    }

    const fresh = await this.bySlug(slug);
    this.live?.broadcastRoundsUpdate(fresh);
    return fresh;
  }

  private async invalidateCache() {
    await this.redis.del("matches:all");
    await this.redis.del("matches:all:v2");
    await this.redis.del("matches:LIVE");
    await this.redis.del("matches:LIVE:v2");
    await this.redis.del("matches:UPCOMING");
    await this.redis.del("matches:UPCOMING:v2");
    await this.redis.del("matches:FINISHED");
    await this.redis.del("matches:FINISHED:v2");
  }
}
