import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class FantasyService {
  constructor(private prisma: PrismaService) {}

  leagues() {
    return this.prisma.fantasyLeague.findMany({
      include: { event: true, _count: { select: { teams: true } } },
    });
  }

  async byEvent(eventSlug: string) {
    const event = await this.prisma.event.findUnique({ where: { slug: eventSlug } });
    if (!event) throw new NotFoundException();
    const league = await this.prisma.fantasyLeague.findUnique({
      where: { eventId: event.id },
      include: { event: true },
    });
    if (!league) throw new NotFoundException("Fantasy league not found");
    const players = await this.prisma.player.findMany({
      orderBy: { rating: "desc" },
      include: { team: true },
    });
    return {
      league,
      players: players.map((p) => ({
        ...p,
        cost: Math.max(5, Math.round(p.rating * 20)),
      })),
    };
  }

  async leaderboard(eventSlug: string) {
    const event = await this.prisma.event.findUnique({ where: { slug: eventSlug } });
    if (!event) throw new NotFoundException();
    return this.prisma.fantasyTeam.findMany({
      where: { league: { eventId: event.id } },
      orderBy: { points: "desc" },
      include: {
        user: { select: { username: true, displayName: true } },
        picks: { include: { player: true } },
      },
    });
  }

  async draft(eventSlug: string, userId: string, body: { name: string; playerIds: string[] }) {
    if (body.playerIds.length !== 5) throw new BadRequestException("Pick exactly 5 players");
    const data = await this.byEvent(eventSlug);
    const costMap = new Map(data.players.map((p) => [p.id, p.cost]));
    const total = body.playerIds.reduce((sum, id) => sum + (costMap.get(id) ?? 999), 0);
    if (total > data.league.budget) throw new BadRequestException("Over budget");

    return this.prisma.fantasyTeam.upsert({
      where: { leagueId_userId: { leagueId: data.league.id, userId } },
      create: {
        leagueId: data.league.id,
        userId,
        name: body.name,
        picks: {
          create: body.playerIds.map((playerId) => ({
            playerId,
            cost: costMap.get(playerId) ?? 10,
          })),
        },
      },
      update: {
        name: body.name,
        picks: {
          deleteMany: {},
          create: body.playerIds.map((playerId) => ({
            playerId,
            cost: costMap.get(playerId) ?? 10,
          })),
        },
      },
      include: { picks: { include: { player: true } } },
    });
  }
}
