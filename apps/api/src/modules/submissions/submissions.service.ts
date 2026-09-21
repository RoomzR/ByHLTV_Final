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
  SubmissionStatus,
  UserRole,
  hasStaffMinRole,
  isTournamentAdmin,
  type EventSubmissionInput,
} from "@byhltv/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { OpsGateway } from "../live/ops.gateway";

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    @Optional()
    @Inject(forwardRef(() => OpsGateway))
    private ops?: OpsGateway,
  ) {}

  private async assertCanAccessEvent(userId: string, role: string, eventId?: string | null) {
    if (hasStaffMinRole(role, UserRole.EDITOR)) return;
    if (!isTournamentAdmin(role)) throw new ForbiddenException();
    if (!eventId) return;
    const org = await this.prisma.eventOrganizer.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!org) throw new ForbiddenException("Not an organizer of this event");
  }

  async create(userId: string, role: string, input: EventSubmissionInput) {
    await this.assertCanAccessEvent(userId, role, input.eventId);
    return this.prisma.eventSubmission.create({
      data: {
        authorId: userId,
        eventId: input.eventId ?? null,
        title: input.title,
        type: input.type,
        payload: JSON.stringify(input.payload ?? {}),
        notes: input.notes,
        status: SubmissionStatus.DRAFT,
      },
    });
  }

  async update(id: string, userId: string, role: string, input: Partial<EventSubmissionInput>) {
    const sub = await this.prisma.eventSubmission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException();
    if (sub.authorId !== userId && !hasStaffMinRole(role, UserRole.EDITOR)) {
      throw new ForbiddenException();
    }
    if (
      sub.status !== SubmissionStatus.DRAFT &&
      sub.status !== SubmissionStatus.NEEDS_CHANGES &&
      !hasStaffMinRole(role, UserRole.EDITOR)
    ) {
      throw new BadRequestException("Cannot edit in current status");
    }
    if (input.eventId !== undefined && input.eventId !== sub.eventId) {
      await this.assertCanAccessEvent(userId, role, input.eventId);
    }
    return this.prisma.eventSubmission.update({
      where: { id },
      data: {
        title: input.title ?? undefined,
        type: input.type ?? undefined,
        eventId: input.eventId === undefined ? undefined : input.eventId,
        payload: input.payload ? JSON.stringify(input.payload) : undefined,
        notes: input.notes,
      },
    });
  }

  async submit(id: string, userId: string, role: string) {
    const sub = await this.prisma.eventSubmission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException();
    if (sub.authorId !== userId && !hasStaffMinRole(role, UserRole.ADMIN)) {
      throw new ForbiddenException();
    }
    const updated = await this.prisma.eventSubmission.update({
      where: { id },
      data: { status: SubmissionStatus.SUBMITTED },
    });
    this.ops?.broadcastSubmissionStatus(id, { id, status: updated.status });
    return updated;
  }

  mine(userId: string) {
    return this.prisma.eventSubmission.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        event: { select: { id: true, name: true, slug: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { fromUser: { select: { id: true, username: true, displayName: true, role: true } } },
        },
      },
    });
  }

  queue(status?: SubmissionStatus) {
    return this.prisma.eventSubmission.findMany({
      where: status
        ? { status }
        : { status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.NEEDS_CHANGES, SubmissionStatus.APPROVED] } },
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { id: true, username: true, displayName: true, role: true } },
        event: { select: { id: true, name: true, slug: true } },
        reviewer: { select: { id: true, username: true, displayName: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { fromUser: { select: { id: true, username: true, displayName: true, role: true } } },
        },
      },
    });
  }

  async byId(id: string, viewer: { id: string; role: string }) {
    const sub = await this.prisma.eventSubmission.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, displayName: true, role: true } },
        event: true,
        messages: {
          orderBy: { createdAt: "asc" },
          include: { fromUser: { select: { id: true, username: true, displayName: true, role: true } } },
        },
      },
    });
    if (!sub) throw new NotFoundException();
    const isAuthor = sub.authorId === viewer.id;
    const isStaff = hasStaffMinRole(viewer.role, UserRole.EDITOR);
    let isOrganizer = false;
    if (!isAuthor && !isStaff && sub.eventId && isTournamentAdmin(viewer.role)) {
      const org = await this.prisma.eventOrganizer.findUnique({
        where: { eventId_userId: { eventId: sub.eventId, userId: viewer.id } },
      });
      isOrganizer = Boolean(org);
    }
    if (!isAuthor && !isStaff && !isOrganizer) {
      throw new ForbiddenException();
    }
    return { ...sub, payload: JSON.parse(sub.payload || "{}") };
  }

  async requestChanges(id: string, reviewerId: string, notes?: string) {
    return this.setStatus(id, reviewerId, SubmissionStatus.NEEDS_CHANGES, notes);
  }

  async approve(id: string, reviewerId: string, notes?: string) {
    return this.setStatus(id, reviewerId, SubmissionStatus.APPROVED, notes);
  }

  async reject(id: string, reviewerId: string, notes?: string) {
    return this.setStatus(id, reviewerId, SubmissionStatus.REJECTED, notes);
  }

  async publish(id: string, reviewerId: string, notes?: string) {
    const sub = await this.setStatus(id, reviewerId, SubmissionStatus.PUBLISHED, notes);
    await this.prisma.auditLog.create({
      data: {
        userId: reviewerId,
        action: "SUBMISSION_PUBLISHED",
        entity: "EventSubmission",
        entityId: id,
        meta: { type: sub.type, title: sub.title },
      },
    });
    await this.prisma.notification.create({
      data: {
        userId: sub.authorId,
        title: "Submission published",
        body: `"${sub.title}" was published on the site.`,
        href: `/ops/submissions/${id}`,
      },
    });
    return sub;
  }

  private async setStatus(
    id: string,
    reviewerId: string,
    status: SubmissionStatus,
    notes?: string,
  ) {
    const sub = await this.prisma.eventSubmission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException();
    const updated = await this.prisma.eventSubmission.update({
      where: { id },
      data: {
        status,
        reviewerId,
        notes: notes ?? sub.notes,
      },
    });
    if (status !== SubmissionStatus.PUBLISHED) {
      await this.prisma.auditLog.create({
        data: {
          userId: reviewerId,
          action: `SUBMISSION_${status}`,
          entity: "EventSubmission",
          entityId: id,
          meta: { notes },
        },
      });
    }
    this.ops?.broadcastSubmissionStatus(id, { id, status: updated.status, notes });
    return updated;
  }

  async addMessage(id: string, fromUserId: string, fromRole: string, body: string) {
    const sub = await this.prisma.eventSubmission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException();
    const isAuthor = sub.authorId === fromUserId;
    const isStaff = hasStaffMinRole(fromRole, UserRole.EDITOR);
    if (!isAuthor && !isStaff) throw new ForbiddenException();
    const message = await this.prisma.staffMessage.create({
      data: { submissionId: id, fromUserId, body },
      include: { fromUser: { select: { id: true, username: true, displayName: true, role: true } } },
    });
    this.ops?.broadcastMessage(`submission:${id}`, message);
    return message;
  }

  listMyEvents(userId: string) {
    return this.prisma.eventOrganizer.findMany({
      where: { userId },
      include: { event: true },
    });
  }

  async assignOrganizer(eventId: string, userId: string, role: "OWNER" | "OPERATOR" = "OWNER") {
    return this.prisma.eventOrganizer.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, role },
      update: { role },
    });
  }
}
