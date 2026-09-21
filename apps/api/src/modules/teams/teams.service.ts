import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createTeamSchema } from "@byhltv/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.team.findMany({
      orderBy: { ranking: "asc" },
      include: { _count: { select: { players: true } } },
    });
  }

  async bySlug(slug: string) {
    const team = await this.prisma.team.findUnique({
      where: { slug },
      include: {
        players: { orderBy: { rating: "desc" } },
        history: { include: { player: true }, take: 20, orderBy: { joinedAt: "desc" } },
      },
    });
    if (!team) throw new NotFoundException();
    const matches = await this.prisma.match.findMany({
      where: { OR: [{ team1Id: team.id }, { team2Id: team.id }] },
      orderBy: { scheduledAt: "desc" },
      take: 20,
      include: { team1: true, team2: true, event: true, maps: true },
    });
    return { ...team, matches };
  }

  async create(raw: unknown) {
    const parsed = createTeamSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return this.prisma.team.create({
      data: {
        ...parsed.data,
        slug,
        logo: parsed.data.logo ?? parsed.data.shortName[0],
      },
    });
  }

  async update(id: string, raw: unknown) {
    const parsed = createTeamSchema.partial().safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const existing = await this.prisma.team.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    return this.prisma.team.update({
      where: { id },
      data: parsed.data,
    });
  }
}
