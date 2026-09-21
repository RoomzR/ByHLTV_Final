import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const [players, teams, matches, events] = await Promise.all([
      this.prisma.player.count(),
      this.prisma.team.count(),
      this.prisma.match.count(),
      this.prisma.event.count(),
    ]);
    return { players, teams, matches, events };
  }

  async leaderboards(metric: string) {
    const orderBy =
      metric === "kd"
        ? { kd: "desc" as const }
        : metric === "adr"
          ? { adr: "desc" as const }
          : { rating: "desc" as const };
    return this.prisma.player.findMany({
      orderBy,
      take: 50,
      include: { team: true },
    });
  }

  async compare(slugs: string[]) {
    return this.prisma.player.findMany({
      where: { slug: { in: slugs } },
      include: { team: true },
    });
  }

  async maps() {
    const maps = await this.prisma.matchMap.groupBy({
      by: ["mapName"],
      _count: { mapName: true },
      _avg: { team1Score: true, team2Score: true },
    });
    return maps;
  }
}
