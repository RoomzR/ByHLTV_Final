import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  createPlayerSchema,
  playerHistorySchema,
  updatePlayerSchema,
  type CreatePlayerInput,
  type UpdatePlayerInput,
} from "@byhltv/shared";
import { aggregateCareer, computeFromBasicStats } from "@byhltv/rating-engine";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  list(status?: string) {
    const allowed = new Set(["ACTIVE", "INACTIVE", "RETIRED"]);
    const filter = status && allowed.has(status) ? status : "ACTIVE";
    return this.prisma.player.findMany({
      where: { status: filter as "ACTIVE" | "INACTIVE" | "RETIRED" },
      orderBy: { rating: "desc" },
      include: { team: true },
    });
  }

  recentTransfers() {
    return this.prisma.playerTeamHistory.findMany({
      orderBy: [{ leftAt: "desc" }, { joinedAt: "desc" }],
      take: 40,
      include: {
        player: { include: { team: true } },
        team: true,
      },
    });
  }

  listAll() {
    return this.prisma.player.findMany({
      orderBy: [{ status: "asc" }, { rating: "desc" }],
      include: { team: true },
    });
  }

  async bySlug(slug: string) {
    const player = await this.prisma.player.findUnique({
      where: { slug },
      include: {
        team: true,
        history: { include: { team: true }, orderBy: { joinedAt: "desc" } },
        matchStats: {
          include: {
            match: {
              include: {
                team1: true,
                team2: true,
                event: true,
              },
            },
          },
          take: 30,
          orderBy: { match: { scheduledAt: "desc" } },
        },
      },
    });
    if (!player) throw new NotFoundException();

    const mapAgg = new Map<
      string,
      { maps: number; kills: number; deaths: number; adr: number; rating: number }
    >();
    for (const s of player.matchStats) {
      const key = s.mapName || "Unknown";
      const cur = mapAgg.get(key) ?? { maps: 0, kills: 0, deaths: 0, adr: 0, rating: 0 };
      cur.maps += 1;
      cur.kills += s.kills;
      cur.deaths += s.deaths;
      cur.adr += s.adr;
      cur.rating += s.rating30 || s.rating21 || s.rating;
      mapAgg.set(key, cur);
    }
    const mapStats = [...mapAgg.entries()].map(([mapName, v]) => ({
      mapName,
      maps: v.maps,
      kd: v.deaths === 0 ? v.kills : v.kills / v.deaths,
      adr: v.adr / v.maps,
      rating: v.rating / v.maps,
    }));

    let socials: Record<string, string> = {};
    try {
      socials = JSON.parse(player.socials || "{}");
    } catch {
      /* ignore */
    }

    return { ...player, socials, mapStats };
  }

  async create(raw: unknown) {
    const parsed = createPlayerSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.persistCreate(parsed.data);
  }

  private async persistCreate(data: CreatePlayerInput) {
    const base = data.nickname.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let slug = base;
    let i = 0;
    while (await this.prisma.player.findUnique({ where: { slug } })) {
      i += 1;
      slug = `${base}-${i}`;
    }
    return this.prisma.player.create({
      data: {
        nickname: data.nickname,
        realName: data.realName,
        country: data.country,
        teamId: data.teamId ?? null,
        role: data.role,
        photo: data.photo ?? data.nickname[0]?.toUpperCase() ?? "P",
        photoUrl: data.photoUrl || null,
        steamId: data.steamId || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        status: data.status ?? "ACTIVE",
        socials: JSON.stringify(data.socials ?? {}),
        slug,
      },
      include: { team: true },
    });
  }

  async update(id: string, raw: unknown) {
    const parsed = updatePlayerSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const data: UpdatePlayerInput = parsed.data;
    const existing = await this.prisma.player.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();

    return this.prisma.player.update({
      where: { id },
      data: {
        nickname: data.nickname,
        realName: data.realName,
        country: data.country,
        teamId: data.teamId === undefined ? undefined : data.teamId,
        role: data.role,
        photo: data.photo,
        photoUrl: data.photoUrl === undefined ? undefined : data.photoUrl || null,
        steamId: data.steamId === undefined ? undefined : data.steamId || null,
        birthDate:
          data.birthDate === undefined
            ? undefined
            : data.birthDate
              ? new Date(data.birthDate)
              : null,
        status: data.status,
        socials: data.socials ? JSON.stringify(data.socials) : undefined,
      },
      include: { team: true },
    });
  }

  async softDelete(id: string) {
    const existing = await this.prisma.player.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    return this.prisma.player.update({
      where: { id },
      data: { status: "INACTIVE", teamId: null },
    });
  }

  async addHistory(playerId: string, raw: unknown) {
    const parsed = playerHistorySchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException();
    return this.prisma.playerTeamHistory.create({
      data: {
        playerId,
        teamId: parsed.data.teamId,
        joinedAt: parsed.data.joinedAt ? new Date(parsed.data.joinedAt) : new Date(),
        leftAt: parsed.data.leftAt ? new Date(parsed.data.leftAt) : null,
      },
      include: { team: true },
    });
  }

  async recomputeCareer(playerId: string) {
    const stats = await this.prisma.playerMatchStat.findMany({ where: { playerId } });
    const lines = stats.map((s) => {
      const rounds = s.roundsPlayed || 24;
      const computed =
        s.rating21 > 0
          ? {
              rating21: s.rating21,
              rating30: s.rating30 || s.rating21,
              kast: s.kast || 70,
              impact: s.impact || 1,
              adr: s.adr,
            }
          : computeFromBasicStats({
              kills: s.kills,
              deaths: s.deaths,
              assists: s.assists,
              adr: s.adr,
              roundsPlayed: rounds,
            });
      return {
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
        adr: computed.adr,
        rating21: computed.rating21,
        rating30: computed.rating30,
        kast: computed.kast,
        impact: computed.impact,
        roundsPlayed: rounds,
      };
    });
    const career = aggregateCareer(lines);
    return this.prisma.player.update({
      where: { id: playerId },
      data: {
        rating: career.rating,
        rating21: career.rating21,
        rating30: career.rating30,
        kd: career.kd,
        adr: career.adr,
        kast: career.kast,
        impact: career.impact,
        mapsPlayed: career.mapsPlayed,
      },
    });
  }
}
