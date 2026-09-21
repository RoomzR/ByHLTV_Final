import { BadRequestException, Controller, Get, Patch, Body, Param, UseGuards } from "@nestjs/common";
import { UserRole, banFullSchema } from "@byhltv/shared";
import { Roles } from "../../common/decorators/auth.decorators";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UsersService } from "../users/users.service";

@Controller("admin")
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
  ) {}

  @Get("overview")
  async overview() {
    const [users, matches, news, threads, flags] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.match.count(),
      this.prisma.newsArticle.count(),
      this.prisma.forumThread.count(),
      this.prisma.featureFlag.findMany(),
    ]);
    return { users, matches, news, threads, flags };
  }

  @Get("users")
  usersList() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        isBanned: true,
        bannedUntil: true,
        createdAt: true,
      },
    });
  }

  @Patch("users/:id/ban")
  ban(
    @Param("id") id: string,
    @Body() body: unknown,
    @CurrentUser() actor: { id: string; role: string },
  ) {
    const parsed = banFullSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.users.banFull(id, actor, parsed.data.banned);
  }

  @Get("flags")
  flags() {
    return this.prisma.featureFlag.findMany();
  }

  @Patch("flags/:key")
  setFlag(@Param("key") key: string, @Body() body: { enabled: boolean }) {
    return this.prisma.featureFlag.update({
      where: { key },
      data: { enabled: body.enabled },
    });
  }

  @Get("audit")
  audit() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { username: true } } },
    });
  }

  @Roles(UserRole.SUPERADMIN)
  @Get("system")
  system() {
    return {
      env: process.env.NODE_ENV,
      redis: Boolean(process.env.REDIS_URL),
      version: "1.0.0",
    };
  }
}
