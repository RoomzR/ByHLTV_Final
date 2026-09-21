import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  createAdSchema,
  updateAdSchema,
  AD_SLOTS,
  type CreateAdInput,
  type UpdateAdInput,
  type AdPlacementSlot,
} from "@byhltv/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";

const includeAd = {
  placements: true,
  createdBy: { select: { id: true, username: true, displayName: true } },
  stats: true,
} as const;

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function parseDay(s: string) {
  const d = new Date(`${s}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function eachDay(from: string, to: string): string[] {
  const start = parseDay(from);
  const end = parseDay(to);
  if (!start || !end || start > end) return [];
  const out: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    out.push(dayKey(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function daysBetween(from: string, to: string) {
  const a = parseDay(from);
  const b = parseDay(to);
  if (!a || !b) return 1;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

function shiftDay(day: string, delta: number) {
  const d = parseDay(day) ?? new Date();
  d.setUTCDate(d.getUTCDate() + delta);
  return dayKey(d);
}

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 120) || `ad-${Date.now()}`
  );
}

@Injectable()
export class AdsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  list(status?: string, format?: string) {
    return this.prisma.ad.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(format ? { format: format as never } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        placements: true,
        createdBy: { select: { id: true, username: true, displayName: true } },
        stats: { orderBy: { date: "desc" }, take: 30 },
      },
    });
  }

  async byId(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: includeAd,
    });
    if (!ad) throw new NotFoundException();
    return ad;
  }

  async create(raw: unknown, userId?: string) {
    const parsed = createAdSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.persistCreate(parsed.data, userId);
  }

  private async persistCreate(data: CreateAdInput, userId?: string) {
    const slug = data.slug?.trim() || slugify(data.title);
    return this.prisma.ad.create({
      data: {
        title: data.title,
        slug,
        format: data.format,
        status: data.status,
        imageUrl: data.imageUrl ?? null,
        href: data.href,
        excerpt: data.excerpt ?? null,
        body: data.body ?? null,
        sponsorLabel: data.sponsorLabel ?? "Реклама",
        weight: data.weight ?? 1,
        startAt: data.startAt ? new Date(data.startAt) : null,
        endAt: data.endAt ? new Date(data.endAt) : null,
        createdById: userId ?? null,
        placements: {
          create: data.slots.map((slot) => ({ slot })),
        },
      },
      include: includeAd,
    });
  }

  async update(id: string, raw: unknown) {
    const parsed = updateAdSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const existing = await this.prisma.ad.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    const data: UpdateAdInput = parsed.data;

    return this.prisma.$transaction(async (tx) => {
      if (data.slots) {
        await tx.adPlacement.deleteMany({ where: { adId: id } });
        await tx.adPlacement.createMany({
          data: data.slots.map((slot) => ({ adId: id, slot })),
        });
      }
      return tx.ad.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.format !== undefined ? { format: data.format } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
          ...(data.href !== undefined ? { href: data.href } : {}),
          ...(data.excerpt !== undefined ? { excerpt: data.excerpt } : {}),
          ...(data.body !== undefined ? { body: data.body } : {}),
          ...(data.sponsorLabel !== undefined ? { sponsorLabel: data.sponsorLabel } : {}),
          ...(data.weight !== undefined ? { weight: data.weight } : {}),
          ...(data.startAt !== undefined
            ? { startAt: data.startAt ? new Date(data.startAt) : null }
            : {}),
          ...(data.endAt !== undefined
            ? { endAt: data.endAt ? new Date(data.endAt) : null }
            : {}),
        },
        include: includeAd,
      });
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.ad.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.ad.delete({ where: { id } });
    return { ok: true };
  }

  async serve(slot: string) {
    if (!AD_SLOTS.includes(slot as AdPlacementSlot)) {
      throw new BadRequestException("Invalid slot");
    }
    const now = new Date();
    const ads = await this.prisma.ad.findMany({
      where: {
        status: "ACTIVE",
        placements: { some: { slot: slot as AdPlacementSlot } },
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      orderBy: [{ weight: "desc" }, { updatedAt: "desc" }],
      take: 8,
      select: {
        id: true,
        title: true,
        slug: true,
        format: true,
        imageUrl: true,
        href: true,
        excerpt: true,
        body: true,
        sponsorLabel: true,
        weight: true,
      },
    });
    return ads;
  }

  private async throttle(key: string, ttlSeconds: number) {
    const hit = await this.redis.get(key);
    if (hit) return false;
    await this.redis.set(key, "1", ttlSeconds);
    return true;
  }

  async impression(id: string, clientKey: string) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });
    if (!ad || ad.status !== "ACTIVE") throw new NotFoundException();
    const ok = await this.throttle(`ad:imp:${id}:${clientKey}`, 60 * 30);
    if (!ok) return { ok: true, counted: false };
    await this.bumpStat(id, "impressions");
    return { ok: true, counted: true };
  }

  async click(id: string, clientKey: string) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });
    if (!ad || ad.status !== "ACTIVE") throw new NotFoundException();
    const ok = await this.throttle(`ad:clk:${id}:${clientKey}`, 60);
    if (ok) await this.bumpStat(id, "clicks");
    return { ok: true, counted: ok, href: ad.href };
  }

  private async bumpStat(adId: string, field: "impressions" | "clicks") {
    const date = dayKey();
    await this.prisma.adStatDaily.upsert({
      where: { adId_date: { adId, date } },
      create: {
        adId,
        date,
        impressions: field === "impressions" ? 1 : 0,
        clicks: field === "clicks" ? 1 : 0,
      },
      update: {
        [field]: { increment: 1 },
      },
    });
  }

  async stats(from?: string, to?: string, adId?: string) {
    const fromDay = from ?? dayKey(new Date(Date.now() - 13 * 86400000));
    const toDay = to ?? dayKey();
    const span = daysBetween(fromDay, toDay);
    const prevTo = shiftDay(fromDay, -1);
    const prevFrom = shiftDay(prevTo, -(span - 1));

    const [rows, prevRows, adsMeta] = await Promise.all([
      this.prisma.adStatDaily.findMany({
        where: {
          date: { gte: fromDay, lte: toDay },
          ...(adId ? { adId } : {}),
        },
        include: {
          ad: {
            select: {
              id: true,
              title: true,
              format: true,
              status: true,
              placements: { select: { slot: true } },
            },
          },
        },
        orderBy: { date: "asc" },
      }),
      this.prisma.adStatDaily.findMany({
        where: {
          date: { gte: prevFrom, lte: prevTo },
          ...(adId ? { adId } : {}),
        },
      }),
      this.prisma.ad.findMany({
        where: adId ? { id: adId } : undefined,
        select: {
          id: true,
          title: true,
          format: true,
          status: true,
          placements: { select: { slot: true } },
        },
      }),
    ]);

    const byDate = new Map<string, { impressions: number; clicks: number }>();
    for (const day of eachDay(fromDay, toDay)) {
      byDate.set(day, { impressions: 0, clicks: 0 });
    }

    const byAd = new Map<
      string,
      {
        adId: string;
        title: string;
        format: string;
        status: string;
        slots: string[];
        impressions: number;
        clicks: number;
      }
    >();

    for (const meta of adsMeta) {
      byAd.set(meta.id, {
        adId: meta.id,
        title: meta.title,
        format: meta.format,
        status: meta.status,
        slots: meta.placements.map((p) => p.slot),
        impressions: 0,
        clicks: 0,
      });
    }

    for (const row of rows) {
      const d = byDate.get(row.date) ?? { impressions: 0, clicks: 0 };
      d.impressions += row.impressions;
      d.clicks += row.clicks;
      byDate.set(row.date, d);

      const a =
        byAd.get(row.adId) ??
        {
          adId: row.adId,
          title: row.ad.title,
          format: row.ad.format,
          status: row.ad.status,
          slots: row.ad.placements.map((p) => p.slot),
          impressions: 0,
          clicks: 0,
        };
      a.impressions += row.impressions;
      a.clicks += row.clicks;
      byAd.set(row.adId, a);
    }

    const daily = [...byDate.entries()].map(([date, v]) => ({
      date,
      impressions: v.impressions,
      clicks: v.clicks,
      ctr: v.impressions ? v.clicks / v.impressions : 0,
    }));

    const ads = [...byAd.values()]
      .map((a) => ({
        ...a,
        ctr: a.impressions ? a.clicks / a.impressions : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);

    const byFormatMap = new Map<string, { impressions: number; clicks: number }>();
    const bySlotMap = new Map<string, { impressions: number; clicks: number }>();
    const byStatusMap = new Map<string, { impressions: number; clicks: number; count: number }>();

    for (const slot of AD_SLOTS) {
      bySlotMap.set(slot, { impressions: 0, clicks: 0 });
    }

    for (const a of ads) {
      const f = byFormatMap.get(a.format) ?? { impressions: 0, clicks: 0 };
      f.impressions += a.impressions;
      f.clicks += a.clicks;
      byFormatMap.set(a.format, f);

      const st = byStatusMap.get(a.status) ?? { impressions: 0, clicks: 0, count: 0 };
      st.impressions += a.impressions;
      st.clicks += a.clicks;
      st.count += 1;
      byStatusMap.set(a.status, st);

      const slots = a.slots.length ? a.slots : ["UNASSIGNED"];
      const share = 1 / slots.length;
      for (const slot of slots) {
        const s = bySlotMap.get(slot) ?? { impressions: 0, clicks: 0 };
        s.impressions += a.impressions * share;
        s.clicks += a.clicks * share;
        bySlotMap.set(slot, s);
      }
    }

    const withCtr = (v: { impressions: number; clicks: number }) => ({
      impressions: Math.round(v.impressions),
      clicks: Math.round(v.clicks),
      ctr: v.impressions ? v.clicks / v.impressions : 0,
    });

    const totals = daily.reduce(
      (acc, d) => {
        acc.impressions += d.impressions;
        acc.clicks += d.clicks;
        return acc;
      },
      { impressions: 0, clicks: 0 },
    );

    const prevTotals = prevRows.reduce(
      (acc, r) => {
        acc.impressions += r.impressions;
        acc.clicks += r.clicks;
        return acc;
      },
      { impressions: 0, clicks: 0 },
    );

    const delta = (cur: number, prev: number) => {
      if (!prev) return cur ? 1 : 0;
      return (cur - prev) / prev;
    };

    return {
      from: fromDay,
      to: toDay,
      previous: { from: prevFrom, to: prevTo },
      totals: {
        ...totals,
        ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
      },
      previousTotals: {
        ...prevTotals,
        ctr: prevTotals.impressions ? prevTotals.clicks / prevTotals.impressions : 0,
      },
      deltas: {
        impressions: delta(totals.impressions, prevTotals.impressions),
        clicks: delta(totals.clicks, prevTotals.clicks),
        ctr: delta(
          totals.impressions ? totals.clicks / totals.impressions : 0,
          prevTotals.impressions ? prevTotals.clicks / prevTotals.impressions : 0,
        ),
      },
      daily,
      ads,
      byFormat: [...byFormatMap.entries()]
        .map(([format, v]) => ({ format, ...withCtr(v) }))
        .sort((a, b) => b.impressions - a.impressions),
      bySlot: [...bySlotMap.entries()]
        .map(([slot, v]) => ({ slot, ...withCtr(v) }))
        .sort((a, b) => b.impressions - a.impressions),
      byStatus: [...byStatusMap.entries()]
        .map(([status, v]) => ({
          status,
          count: v.count,
          ...withCtr(v),
        }))
        .sort((a, b) => b.impressions - a.impressions),
    };
  }

  async overview() {
    const today = dayKey();
    const yesterday = shiftDay(today, -1);
    const weekFrom = shiftDay(today, -6);
    const [todayRows, yesterdayRows, weekRows, active, total, paused, draft] = await Promise.all([
      this.prisma.adStatDaily.findMany({ where: { date: today } }),
      this.prisma.adStatDaily.findMany({ where: { date: yesterday } }),
      this.prisma.adStatDaily.findMany({ where: { date: { gte: weekFrom, lte: today } } }),
      this.prisma.ad.count({ where: { status: "ACTIVE" } }),
      this.prisma.ad.count(),
      this.prisma.ad.count({ where: { status: "PAUSED" } }),
      this.prisma.ad.count({ where: { status: "DRAFT" } }),
    ]);

    const sum = (rows: { impressions: number; clicks: number }[]) => {
      const impressions = rows.reduce((s, r) => s + r.impressions, 0);
      const clicks = rows.reduce((s, r) => s + r.clicks, 0);
      return { impressions, clicks, ctr: impressions ? clicks / impressions : 0 };
    };

    return {
      today: sum(todayRows),
      yesterday: sum(yesterdayRows),
      week: sum(weekRows),
      active,
      paused,
      draft,
      total,
    };
  }
}
