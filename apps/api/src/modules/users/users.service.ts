import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  UserRole,
  canAssignRole,
  canBanTarget,
  updateProfileSchema,
} from "@byhltv/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

const PUBLIC_ROLES = new Set<string>([UserRole.USER, UserRole.TOURNAMENT_ADMIN]);

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(id: string, raw: unknown) {
    const parsed = updateProfileSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
      },
    });
  }

  async byUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException();
    return {
      ...user,
      // Don't advertise staff ranks on public profiles
      role: PUBLIC_ROLES.has(user.role) ? user.role : UserRole.USER,
    };
  }

  async setRole(
    id: string,
    role: UserRole,
    actor: { id: string; role: string },
  ) {
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException("Invalid role");
    }
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException();
    if (!canAssignRole(actor, target, role)) {
      throw new ForbiddenException("Cannot assign this role");
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, role: true },
    });
    await this.prisma.session.deleteMany({ where: { userId: id } });
    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: "USER_ROLE_UPDATE",
        entity: "User",
        entityId: id,
        meta: { role, previous: target.role },
      },
    });
    return updated;
  }

  async banLimited(
    id: string,
    actor: { id: string; role: string },
    body: { until: string; reason?: string },
  ) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException();
    if (!canBanTarget(actor.role, target.role, "limited")) {
      throw new ForbiddenException("Cannot ban this user");
    }
    const until = new Date(body.until);
    if (Number.isNaN(until.getTime()) || until <= new Date()) {
      throw new BadRequestException("until must be a future datetime");
    }
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { bannedUntil: until, isBanned: false },
        select: { id: true, username: true, role: true, bannedUntil: true },
      }),
      this.prisma.session.deleteMany({ where: { userId: id } }),
      this.prisma.auditLog.create({
        data: {
          userId: actor.id,
          action: "USER_BAN_LIMITED",
          entity: "User",
          entityId: id,
          meta: { until: until.toISOString(), reason: body.reason },
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: id,
          title: "Temporary ban",
          body: body.reason || `You are restricted until ${until.toISOString()}`,
          href: "/",
        },
      }),
    ]);
    return updated;
  }

  async banFull(
    id: string,
    actor: { id: string; role: string },
    banned: boolean,
  ) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException();
    if (!canBanTarget(actor.role, target.role, "full")) {
      throw new ForbiddenException(banned ? "Cannot ban this user" : "Cannot unban this user");
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isBanned: banned,
        bannedUntil: banned ? null : undefined,
      },
      select: { id: true, username: true, role: true, isBanned: true },
    });
    if (banned) {
      await this.prisma.session.deleteMany({ where: { userId: id } });
    }
    await this.prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: banned ? "USER_BAN" : "USER_UNBAN",
        entity: "User",
        entityId: id,
      },
    });
    return updated;
  }
}
