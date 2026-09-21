import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { computeFromBasicStats } from "@byhltv/rating-engine";
import { MatchStatus } from "@byhltv/shared";
import { createHash, randomUUID } from "crypto";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { LiveGateway } from "../live/live.gateway";
import { MatchesService } from "../matches/matches.service";
import { PlayersService } from "../players/players.service";
import { DemoParserService } from "./demo-parser.service";

const DEMO_DIR = join(process.cwd(), "uploads", "demos");
const MAX_DEMO_BYTES = 500 * 1024 * 1024;

function ensureDemoDir() {
  if (!existsSync(DEMO_DIR)) mkdirSync(DEMO_DIR, { recursive: true });
}

@Injectable()
export class DemosService {
  private queue: string[] = [];
  private running = false;

  constructor(
    private prisma: PrismaService,
    private matches: MatchesService,
    private parser: DemoParserService,
    private players: PlayersService,
    private live: LiveGateway,
  ) {}

  async list(slug: string, actor: { id: string; role: string }) {
    const match = await this.findMatch(slug);
    await this.matches.assertCanOperateMatch(actor, match.eventId);
    return this.prisma.matchDemo.findMany({
      where: { matchId: match.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        mapName: true,
        originalName: true,
        sizeBytes: true,
        status: true,
        error: true,
        createdAt: true,
        processedAt: true,
        uploadedById: true,
      },
    });
  }

  async upload(
    slug: string,
    actor: { id: string; role: string },
    file: Express.Multer.File | undefined,
    mapName?: string,
  ) {
    if (!file) throw new BadRequestException("Demo file is required");
    if (!file.originalname.toLowerCase().endsWith(".dem")) {
      throw new BadRequestException("Only .dem files are allowed");
    }
    if (file.size > MAX_DEMO_BYTES) {
      throw new BadRequestException("Demo file too large (max 500MB)");
    }

    const match = await this.findMatch(slug);
    await this.matches.assertCanOperateMatch(actor, match.eventId);

    ensureDemoDir();
    const filename = `${randomUUID()}.dem`;
    const storagePath = join(DEMO_DIR, filename);
    writeFileSync(storagePath, file.buffer);

    const demo = await this.prisma.matchDemo.create({
      data: {
        matchId: match.id,
        mapName: mapName?.trim() || null,
        originalName: file.originalname,
        storagePath,
        sizeBytes: file.size,
        status: "PENDING",
        uploadedById: actor.id,
      },
    });

    this.enqueue(demo.id);
    return {
      id: demo.id,
      status: demo.status,
      originalName: demo.originalName,
      mapName: demo.mapName,
      sizeBytes: demo.sizeBytes,
    };
  }

  async reparse(slug: string, demoId: string, actor: { id: string; role: string }) {
    const match = await this.findMatch(slug);
    await this.matches.assertCanOperateMatch(actor, match.eventId);
    const demo = await this.prisma.matchDemo.findFirst({
      where: { id: demoId, matchId: match.id },
    });
    if (!demo) throw new NotFoundException("Demo not found");
    await this.prisma.matchDemo.update({
      where: { id: demo.id },
      data: { status: "PENDING", error: null },
    });
    this.enqueue(demo.id);
    return { ok: true, id: demo.id };
  }

  async remove(slug: string, demoId: string, actor: { id: string; role: string }) {
    const match = await this.findMatch(slug);
    await this.matches.assertCanOperateMatch(actor, match.eventId);
    const demo = await this.prisma.matchDemo.findFirst({
      where: { id: demoId, matchId: match.id },
    });
    if (!demo) throw new NotFoundException("Demo not found");
    try {
      unlinkSync(demo.storagePath);
    } catch {
      /* ignore */
    }
    await this.prisma.matchDemo.delete({ where: { id: demo.id } });
    return { ok: true };
  }

  private enqueue(demoId: string) {
    this.queue.push(demoId);
    void this.pump();
  }

  private async pump() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length) {
      const id = this.queue.shift()!;
      try {
        await this.processDemo(id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Parse failed";
        await this.prisma.matchDemo.update({
          where: { id },
          data: { status: "FAILED", error: message, processedAt: new Date() },
        });
      }
    }
    this.running = false;
  }

  private async processDemo(demoId: string) {
    const demo = await this.prisma.matchDemo.findUnique({ where: { id: demoId } });
    if (!demo) return;

    await this.prisma.matchDemo.update({
      where: { id: demoId },
      data: { status: "PROCESSING", error: null },
    });

    const match = await this.prisma.match.findUnique({
      where: { id: demo.matchId },
      include: { maps: { orderBy: { order: "asc" } }, team1: true, team2: true },
    });
    if (!match) throw new Error("Match missing");

    const parsed = await this.parser.parseFile(demo.storagePath);
    const mapName = this.normalizeMap(demo.mapName || parsed.mapName || "Unknown");

    // Upsert match map row
    let mapRow =
      match.maps.find((m) => this.mapEq(m.mapName, mapName)) ??
      match.maps.find((m) => !m.winnerId);
    if (mapRow) {
      const winnerId =
        parsed.team1Score > parsed.team2Score
          ? match.team1Id
          : parsed.team2Score > parsed.team1Score
            ? match.team2Id
            : null;
      await this.prisma.matchMap.update({
        where: { id: mapRow.id },
        data: {
          mapName,
          team1Score: parsed.team1Score,
          team2Score: parsed.team2Score,
          winnerId,
        },
      });
    } else {
      mapRow = await this.prisma.matchMap.create({
        data: {
          matchId: match.id,
          mapName,
          team1Score: parsed.team1Score,
          team2Score: parsed.team2Score,
          order: match.maps.length + 1,
          winnerId:
            parsed.team1Score > parsed.team2Score
              ? match.team1Id
              : parsed.team2Score > parsed.team1Score
                ? match.team2Id
                : null,
        },
      });
    }

    const mapNumber = mapRow.order || 1;

    // Replace rounds for this map
    await this.prisma.matchRound.deleteMany({
      where: { matchId: match.id, mapNumber },
    });
    if (parsed.rounds.length) {
      await this.prisma.matchRound.createMany({
        data: parsed.rounds.map((r) => ({
          matchId: match.id,
          mapNumber,
          roundNumber: r.roundNumber,
          winnerSide: r.winnerSide,
          team1Score: r.team1Score,
          team2Score: r.team2Score,
          bombPlanted: r.bombPlanted,
        })),
      });
    }

    const steamIds = parsed.players.map((p) => p.steamId).filter(Boolean);
    const existing = steamIds.length
      ? await this.prisma.player.findMany({ where: { steamId: { in: steamIds } } })
      : [];
    const bySteam = new Map(existing.map((p) => [p.steamId!, p]));

    for (const p of parsed.players) {
      let player = bySteam.get(p.steamId);
      if (!player) {
        player = await this.ensurePlayerStub(p.steamId, p.name);
        bySteam.set(p.steamId, player);
      }

      const roundsPlayed = Math.max(1, p.roundsPlayed || parsed.rounds.length || 1);
      const adr = p.damage / roundsPlayed;
      const kast = p.kastRounds > 0 ? (p.kastRounds / roundsPlayed) * 100 : undefined;
      const rating = computeFromBasicStats({
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        adr,
        roundsPlayed,
        kast,
      });

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
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          headshots: p.headshots,
          openingKills: p.openingKills,
          damage: p.damage,
          adr: rating.adr,
          rating: rating.rating30,
          rating21: rating.rating21,
          rating30: rating.rating30,
          kast: rating.kast,
          impact: rating.impact,
          roundsPlayed,
        },
        update: {
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          headshots: p.headshots,
          openingKills: p.openingKills,
          damage: p.damage,
          adr: rating.adr,
          rating: rating.rating30,
          rating21: rating.rating21,
          rating30: rating.rating30,
          kast: rating.kast,
          impact: rating.impact,
          roundsPlayed,
        },
      });

      await this.players.recomputeCareer(player.id);
    }

    // Series scores from completed maps
    const maps = await this.prisma.matchMap.findMany({ where: { matchId: match.id } });
    let seriesT1 = 0;
    let seriesT2 = 0;
    for (const m of maps) {
      if (!m.winnerId) continue;
      if (m.winnerId === match.team1Id) seriesT1++;
      if (m.winnerId === match.team2Id) seriesT2++;
    }
    await this.prisma.match.update({
      where: { id: match.id },
      data: {
        team1Score: seriesT1,
        team2Score: seriesT2,
        status: MatchStatus.FINISHED,
        activeMapName: mapName,
      },
    });

    await this.prisma.matchDemo.update({
      where: { id: demoId },
      data: {
        status: "READY",
        mapName,
        processedAt: new Date(),
        error: null,
      },
    });

    const fresh = await this.matches.bySlug(match.slug);
    this.live.broadcastMatchUpdate(fresh);
    this.live.broadcastStatsUpdate(fresh);
  }

  private async ensurePlayerStub(steamId: string, name: string) {
    const nick = (name || "Player").slice(0, 32);
    const hash = createHash("sha1").update(steamId).digest("hex").slice(0, 8);
    const slug = `steam-${hash}`;
    return this.prisma.player.upsert({
      where: { steamId },
      create: {
        slug,
        nickname: nick,
        realName: nick,
        steamId,
        photo: nick.slice(0, 1).toUpperCase(),
      },
      update: {},
    });
  }

  private async findMatch(slug: string) {
    const match =
      (await this.prisma.match.findUnique({ where: { slug } })) ||
      (await this.prisma.match.findUnique({ where: { id: slug } }));
    if (!match) throw new NotFoundException("Match not found");
    return match;
  }

  private normalizeMap(raw: string) {
    const name = raw.replace(/^de_/i, "");
    if (!name) return "Unknown";
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private mapEq(a: string, b: string) {
    return this.normalizeMap(a).toLowerCase() === this.normalizeMap(b).toLowerCase();
  }
}
