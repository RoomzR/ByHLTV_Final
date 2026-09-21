import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { favoriteCreateSchema } from "@byhltv/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  @Get("unread-count")
  async unreadCount(@CurrentUser() user: { id: string }) {
    const count = await this.prisma.notification.count({
      where: { userId: user.id, read: false },
    });
    return { count };
  }

  @Patch("read-all")
  readAll(@CurrentUser() user: { id: string }) {
    return this.prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  }

  @Patch(":id/read")
  read(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });
  }

  @Post("favorites")
  async favorite(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = favoriteCreateSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { matchId, teamId, playerId } = parsed.data;
    const where = matchId
      ? { userId: user.id, matchId }
      : teamId
        ? { userId: user.id, teamId }
        : { userId: user.id, playerId: playerId! };
    const existing = await this.prisma.favorite.findFirst({ where });
    if (existing) return existing;
    return this.prisma.favorite.create({
      data: {
        userId: user.id,
        matchId: matchId ?? null,
        teamId: teamId ?? null,
        playerId: playerId ?? null,
      },
    });
  }

  @Get("favorites")
  favorites(@CurrentUser() user: { id: string }) {
    return this.prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        match: { include: { team1: true, team2: true, event: true } },
        team: true,
        player: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Delete("favorites/:id")
  removeFavorite(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.prisma.favorite.deleteMany({ where: { id, userId: user.id } });
  }
}
