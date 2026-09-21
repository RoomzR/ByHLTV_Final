import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  createSceneAwardSchema,
  updateSceneAwardSchema,
  type CreateSceneAwardInput,
  type UpdateSceneAwardInput,
} from "@byhltv/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

const KINDS = new Set(["MVP", "EVP", "TOP20", "HALL_OF_FAME"]);

type AwardKind = "MVP" | "EVP" | "TOP20" | "HALL_OF_FAME";

const includeAward = {
  player: { include: { team: true } },
  event: true,
} as const;

@Injectable()
export class AwardsService {
  constructor(private prisma: PrismaService) {}

  list(kind?: string, year?: number, eventId?: string, playerId?: string) {
    if (kind && !KINDS.has(kind)) {
      throw new BadRequestException("Invalid award kind");
    }
    return this.prisma.sceneAward.findMany({
      where: {
        ...(kind ? { kind: kind as AwardKind } : {}),
        ...(year ? { year } : {}),
        ...(eventId ? { eventId } : {}),
        ...(playerId ? { playerId } : {}),
      },
      orderBy: [{ year: "desc" }, { rank: "asc" }, { createdAt: "desc" }],
      include: includeAward,
    });
  }

  async create(raw: unknown) {
    const parsed = createSceneAwardSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.persistCreate(parsed.data);
  }

  private async resolveYear(
    kind: AwardKind,
    eventId: string | null | undefined,
    year: number | null | undefined,
  ) {
    if (year != null) return year;
    if ((kind === "MVP" || kind === "EVP") && eventId) {
      const event = await this.prisma.event.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException("Event not found");
      return event.endDate.getFullYear();
    }
    return null;
  }

  private async assertBusinessRules(
    data: {
      kind: AwardKind;
      playerId: string;
      eventId?: string | null;
      year?: number | null;
      rank?: number | null;
    },
    excludeId?: string,
  ) {
    const player = await this.prisma.player.findUnique({ where: { id: data.playerId } });
    if (!player) throw new NotFoundException("Player not found");

    if (data.kind === "MVP" || data.kind === "EVP") {
      if (!data.eventId) throw new BadRequestException("eventId is required for MVP/EVP");
      const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
      if (!event) throw new NotFoundException("Event not found");
    }

    if (data.kind === "MVP" && data.eventId) {
      const existing = await this.prisma.sceneAward.findFirst({
        where: {
          kind: "MVP",
          eventId: data.eventId,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (existing) throw new BadRequestException("This event already has an MVP");
    }

    if ((data.kind === "MVP" || data.kind === "EVP") && data.eventId) {
      const dup = await this.prisma.sceneAward.findFirst({
        where: {
          kind: data.kind,
          eventId: data.eventId,
          playerId: data.playerId,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (dup) throw new BadRequestException("Player already has this award for the event");
    }

    if (data.kind === "TOP20") {
      if (data.year == null) throw new BadRequestException("year is required for TOP20");
      if (data.rank == null || data.rank < 1 || data.rank > 20) {
        throw new BadRequestException("rank 1-20 is required for TOP20");
      }
      const rankTaken = await this.prisma.sceneAward.findFirst({
        where: {
          kind: "TOP20",
          year: data.year,
          rank: data.rank,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (rankTaken) throw new BadRequestException(`Top20 #${data.rank} for ${data.year} is taken`);
      const playerTaken = await this.prisma.sceneAward.findFirst({
        where: {
          kind: "TOP20",
          year: data.year,
          playerId: data.playerId,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (playerTaken) {
        throw new BadRequestException("Player already in Top20 for this year");
      }
    }
  }

  private async persistCreate(data: CreateSceneAwardInput) {
    const eventId =
      data.kind === "TOP20" || data.kind === "HALL_OF_FAME" ? null : (data.eventId ?? null);
    const year = await this.resolveYear(data.kind, eventId, data.year);
    await this.assertBusinessRules({
      kind: data.kind,
      playerId: data.playerId,
      eventId,
      year,
      rank: data.rank ?? null,
    });

    return this.prisma.sceneAward.create({
      data: {
        kind: data.kind,
        playerId: data.playerId,
        eventId,
        year,
        rank: data.rank ?? null,
        note: data.note ?? null,
      },
      include: includeAward,
    });
  }

  async update(id: string, raw: unknown) {
    const parsed = updateSceneAwardSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const existing = await this.prisma.sceneAward.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();

    const data: UpdateSceneAwardInput = parsed.data;
    const kind = (data.kind ?? existing.kind) as AwardKind;
    const playerId = data.playerId ?? existing.playerId;
    let eventId =
      data.eventId === undefined ? existing.eventId : data.eventId;
    if (kind === "TOP20" || kind === "HALL_OF_FAME") eventId = null;

    const year =
      data.year !== undefined
        ? data.year
        : await this.resolveYear(kind, eventId, existing.year);
    const rank = data.rank === undefined ? existing.rank : data.rank;

    await this.assertBusinessRules(
      { kind, playerId, eventId, year, rank },
      id,
    );

    return this.prisma.sceneAward.update({
      where: { id },
      data: {
        kind,
        playerId,
        eventId,
        year,
        rank,
        note: data.note === undefined ? undefined : data.note,
      },
      include: includeAward,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.sceneAward.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.sceneAward.delete({ where: { id } });
    return { ok: true };
  }
}
