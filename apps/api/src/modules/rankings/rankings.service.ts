import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { updatePlayerRankingSchema, updateTeamRankingSchema } from "@byhltv/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  teams() {
    return this.prisma.team.findMany({ orderBy: { ranking: "asc" } });
  }

  players() {
    return this.prisma.player.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ ranking: "asc" }, { rating: "desc" }],
      include: { team: true },
    });
  }

  history(kind: string, id?: string) {
    return this.prisma.rankingSnapshot.findMany({
      where: {
        kind,
        ...(id && kind === "team" ? { teamId: id } : {}),
        ...(id && kind === "player" ? { playerId: id } : {}),
      },
      orderBy: { takenAt: "desc" },
      take: 100,
      include: { team: true, player: true },
    });
  }

  async updateTeam(id: string, raw: unknown) {
    const parsed = updateTeamRankingSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const existing = await this.prisma.team.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    return this.prisma.team.update({
      where: { id },
      data: {
        ranking: parsed.data.ranking,
        points: parsed.data.points,
      },
    });
  }

  async updatePlayer(id: string, raw: unknown) {
    const parsed = updatePlayerRankingSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const existing = await this.prisma.player.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    return this.prisma.player.update({
      where: { id },
      data: {
        ranking: parsed.data.ranking,
        rankingPoints: parsed.data.rankingPoints,
      },
      include: { team: true },
    });
  }

  async snapshotTeams() {
    const teams = await this.prisma.team.findMany({ orderBy: { ranking: "asc" } });
    const takenAt = new Date();
    await this.prisma.rankingSnapshot.createMany({
      data: teams.map((team) => ({
        kind: "team",
        teamId: team.id,
        rank: team.ranking,
        points: team.points,
        takenAt,
      })),
    });
    return { ok: true, count: teams.length, takenAt };
  }

  async snapshotPlayers() {
    const players = await this.prisma.player.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ ranking: "asc" }, { rating: "desc" }],
    });
    const takenAt = new Date();
    await this.prisma.rankingSnapshot.createMany({
      data: players.map((player, i) => ({
        kind: "player",
        playerId: player.id,
        rank: player.ranking < 999 ? player.ranking : i + 1,
        points: player.rankingPoints || player.rating,
        rating: player.rating,
        takenAt,
      })),
    });
    return { ok: true, count: players.length, takenAt };
  }

  /** Fill official ranks from current career rating (1 = best). */
  async syncPlayersFromRating() {
    const players = await this.prisma.player.findMany({
      where: { status: "ACTIVE" },
      orderBy: { rating: "desc" },
    });
    await this.prisma.$transaction(
      players.map((player, i) =>
        this.prisma.player.update({
          where: { id: player.id },
          data: {
            ranking: i + 1,
            rankingPoints: Math.round(player.rating * 1000),
          },
        }),
      ),
    );
    return { ok: true, count: players.length };
  }
}
