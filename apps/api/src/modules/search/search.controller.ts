import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/auth.decorators";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Controller("search")
export class SearchController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  async search(@Query("q") q = "") {
    const query = q.trim();
    if (!query) return { teams: [], players: [], news: [], events: [], matches: [] };
    const [teams, players, news, events, matches] = await Promise.all([
      this.prisma.team.findMany({
        where: { OR: [{ name: { contains: query } }, { shortName: { contains: query } }] },
        take: 10,
      }),
      this.prisma.player.findMany({
        where: { OR: [{ nickname: { contains: query } }, { realName: { contains: query } }] },
        take: 10,
        include: { team: true },
      }),
      this.prisma.newsTranslation.findMany({
        where: { OR: [{ title: { contains: query } }, { excerpt: { contains: query } }] },
        take: 10,
        include: { article: true },
      }),
      this.prisma.event.findMany({
        where: { name: { contains: query } },
        take: 10,
      }),
      this.prisma.match.findMany({
        where: { slug: { contains: query } },
        take: 10,
        include: { team1: true, team2: true },
      }),
    ]);
    return { teams, players, news, events, matches };
  }
}
