import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventStatus, EventTier } from "@prisma/client";
import { can } from "@byhltv/shared";
import { z } from "zod";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

export const createEventSchema = z.object({
  slug: z.string().min(2).max(120),
  name: z.string().min(2).max(160),
  location: z.string().min(2).max(120),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  prizePool: z.number().int().min(0).optional(),
  tier: z.enum(["S", "A", "B", "C"]).optional(),
  logo: z.string().max(512).optional(),
  coverImage: z.string().max(512).nullable().optional(),
  teamsCount: z.number().int().min(0).optional(),
  status: z.enum(["UPCOMING", "ONGOING", "FINISHED"]).optional(),
  formatNote: z.string().max(500).optional(),
  mapPool: z.array(z.string().min(1).max(32)).max(12).optional(),
});

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  list(status?: string) {
    return this.prisma.event.findMany({
      where: status ? { status: status as EventStatus } : undefined,
      orderBy: { startDate: "desc" },
      include: { _count: { select: { matches: true, teams: true } } },
    });
  }

  async bySlug(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        teams: { include: { team: true }, orderBy: { seed: "asc" } },
        matches: {
          include: { team1: true, team2: true, maps: true, event: true },
          orderBy: { scheduledAt: "asc" },
        },
        fantasyLeague: true,
      },
    });
    if (!event) throw new NotFoundException();
    return event;
  }

  async brackets(slug: string) {
    const event = await this.prisma.event.findUnique({ where: { slug } });
    if (!event) throw new NotFoundException();
    return this.prisma.bracketNode.findMany({
      where: { eventId: event.id },
      include: {
        match: { include: { team1: true, team2: true, maps: true } },
      },
      orderBy: [{ round: "asc" }, { position: "asc" }],
    });
  }

  async create(raw: unknown) {
    const parsed = createEventSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const d = parsed.data;
    return this.prisma.event.create({
      data: {
        slug: d.slug,
        name: d.name,
        location: d.location,
        startDate: new Date(d.startDate),
        endDate: new Date(d.endDate),
        prizePool: d.prizePool ?? 0,
        tier: (d.tier as EventTier) ?? EventTier.B,
        logo: d.logo ?? d.name[0],
        coverImage: d.coverImage ?? null,
        teamsCount: d.teamsCount ?? 0,
        status: (d.status as EventStatus) ?? EventStatus.UPCOMING,
        formatNote: d.formatNote,
        mapPool: d.mapPool
          ? JSON.stringify(d.mapPool)
          : JSON.stringify([
              "Nuke",
              "Mirage",
              "Ancient",
              "Anubis",
              "Dust2",
              "Inferno",
              "Cache",
            ]),
      },
    });
  }

  async update(id: string, raw: unknown, actor: { id: string; role: string }) {
    const parsed = createEventSchema.partial().safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { organizers: true },
    });
    if (!event) throw new NotFoundException();

    const globalManage = can(actor.role, "event.manage");
    const ownManage =
      can(actor.role, "event.manage_own") &&
      event.organizers.some((o) => o.userId === actor.id);
    if (!globalManage && !ownManage) {
      throw new ForbiddenException("Cannot manage this event");
    }

    const d = parsed.data;
    return this.prisma.event.update({
      where: { id },
      data: {
        slug: d.slug,
        name: d.name,
        location: d.location,
        startDate: d.startDate ? new Date(d.startDate) : undefined,
        endDate: d.endDate ? new Date(d.endDate) : undefined,
        prizePool: d.prizePool,
        tier: d.tier as EventTier | undefined,
        logo: d.logo,
        coverImage: d.coverImage === undefined ? undefined : d.coverImage,
        teamsCount: d.teamsCount,
        status: d.status as EventStatus | undefined,
        formatNote: d.formatNote,
        mapPool: d.mapPool ? JSON.stringify(d.mapPool) : undefined,
      },
    });
  }

  listAll(actor: { id: string; role: string }) {
    const ownOnly =
      !can(actor.role, "event.manage") && can(actor.role, "event.manage_own");
    return this.prisma.event.findMany({
      where: ownOnly
        ? { organizers: { some: { userId: actor.id } } }
        : undefined,
      orderBy: { startDate: "desc" },
      include: {
        organizers: {
          include: { user: { select: { id: true, username: true, displayName: true } } },
        },
        _count: { select: { matches: true, teams: true } },
      },
    });
  }
}
