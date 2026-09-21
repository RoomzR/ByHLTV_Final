import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  forwardRef,
} from "@nestjs/common";
import {
  ApplicationStatus,
  UserRole,
  type TournamentApplicationInput,
} from "@byhltv/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { OpsGateway } from "../live/ops.gateway";

@Injectable()
export class TournamentApplicationsService {
  constructor(
    private prisma: PrismaService,
    @Optional()
    @Inject(forwardRef(() => OpsGateway))
    private ops?: OpsGateway,
  ) {}

  apply(userId: string, role: string, input: TournamentApplicationInput) {
    if (role === UserRole.TOURNAMENT_ADMIN || role === UserRole.ADMIN || role === UserRole.SUPERADMIN) {
      throw new BadRequestException("Already privileged");
    }
    return this.prisma.tournamentAdminApplication
      .findFirst({
        where: { userId, status: ApplicationStatus.PENDING },
      })
      .then(async (pending) => {
        if (pending) {
          throw new BadRequestException("You already have a pending application");
        }
        return this.prisma.tournamentAdminApplication.create({
          data: {
            userId,
            message: input.message,
            orgName: input.orgName,
            experience: input.experience,
          },
        });
      });
  }

  myApplications(userId: string) {
    return this.prisma.tournamentAdminApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { fromUser: { select: { id: true, username: true, displayName: true, role: true } } },
        },
      },
    });
  }

  list(status?: ApplicationStatus) {
    return this.prisma.tournamentAdminApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, username: true, displayName: true, role: true } },
        reviewer: { select: { id: true, username: true, displayName: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { fromUser: { select: { id: true, username: true, displayName: true, role: true } } },
        },
      },
    });
  }

  async approve(id: string, reviewerId: string, reviewNote?: string) {
    const app = await this.prisma.tournamentAdminApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException();
    if (app.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException("Application already reviewed");
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.tournamentAdminApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.APPROVED,
          reviewedBy: reviewerId,
          reviewNote,
        },
      }),
      this.prisma.user.update({
        where: { id: app.userId },
        data: { role: UserRole.TOURNAMENT_ADMIN },
      }),
      this.prisma.session.deleteMany({ where: { userId: app.userId } }),
      this.prisma.auditLog.create({
        data: {
          userId: reviewerId,
          action: "TOURNAMENT_ADMIN_APPROVED",
          entity: "TournamentAdminApplication",
          entityId: id,
          meta: { applicantId: app.userId, reviewNote },
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: app.userId,
          title: "Tournament Admin approved",
          body: "Your tournament admin application was approved. Open /ops to start.",
          href: "/ops",
        },
      }),
    ]);

    this.ops?.broadcastMessage(`application:${id}`, {
      type: "status",
      status: ApplicationStatus.APPROVED,
    });
    return updated;
  }

  async reject(id: string, reviewerId: string, reviewNote?: string) {
    const app = await this.prisma.tournamentAdminApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException();
    if (app.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException("Application already reviewed");
    }

    const updated = await this.prisma.tournamentAdminApplication.update({
      where: { id },
      data: {
        status: ApplicationStatus.REJECTED,
        reviewedBy: reviewerId,
        reviewNote,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: reviewerId,
        action: "TOURNAMENT_ADMIN_REJECTED",
        entity: "TournamentAdminApplication",
        entityId: id,
        meta: { applicantId: app.userId, reviewNote },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: app.userId,
        title: "Tournament Admin rejected",
        body: reviewNote || "Your tournament admin application was rejected.",
        href: "/apply/tournament-admin",
      },
    });

    this.ops?.broadcastMessage(`application:${id}`, {
      type: "status",
      status: ApplicationStatus.REJECTED,
    });
    return updated;
  }

  async addMessage(id: string, fromUserId: string, fromRole: string, body: string) {
    const app = await this.prisma.tournamentAdminApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException();
    const isApplicant = app.userId === fromUserId;
    const isStaff = fromRole === UserRole.ADMIN || fromRole === UserRole.SUPERADMIN;
    if (!isApplicant && !isStaff) throw new ForbiddenException();

    const message = await this.prisma.staffMessage.create({
      data: { applicationId: id, fromUserId, body },
      include: { fromUser: { select: { id: true, username: true, displayName: true, role: true } } },
    });
    this.ops?.broadcastMessage(`application:${id}`, message);
    return message;
  }
}
