import { Controller, Get, Param } from "@nestjs/common";
import { Public } from "../../common/decorators/auth.decorators";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Controller("betting")
export class BettingController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get("odds")
  async odds() {
    const rows = await this.prisma.bettingOdd.findMany({
      include: {
        match: { include: { team1: true, team2: true, event: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => {
      if (!row.match) return row;
      const { gsiToken: _secret, ...match } = row.match as typeof row.match & {
        gsiToken?: string | null;
      };
      return { ...row, match };
    });
  }

  @Public()
  @Get("guides")
  guides() {
    return this.prisma.bettingGuide.findMany({ orderBy: { publishedAt: "desc" } });
  }

  @Public()
  @Get("guides/:slug")
  guide(@Param("slug") slug: string) {
    return this.prisma.bettingGuide.findUnique({ where: { slug } });
  }
}
