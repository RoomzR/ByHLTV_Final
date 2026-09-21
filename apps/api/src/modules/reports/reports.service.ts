import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ReportStatus, ReportTargetType } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

const createReportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "THREAD", "USER", "NEWS"]),
  targetId: z.string().min(1),
  reason: z.string().min(5).max(1000),
});

const reviewReportSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
  note: z.string().max(1000).optional(),
});

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  create(reporterId: string, raw: unknown) {
    const parsed = createReportSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.prisma.report.create({
      data: {
        reporterId,
        targetType: parsed.data.targetType as ReportTargetType,
        targetId: parsed.data.targetId,
        reason: parsed.data.reason,
      },
    });
  }

  list(status?: string) {
    return this.prisma.report.findMany({
      where: status ? { status: status as ReportStatus } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, username: true, displayName: true } },
        resolver: { select: { id: true, username: true, displayName: true } },
      },
      take: 100,
    });
  }

  async review(id: string, resolverId: string, raw: unknown) {
    const parsed = reviewReportSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException();

    const [updated] = await this.prisma.$transaction([
      this.prisma.report.update({
        where: { id },
        data: {
          status: parsed.data.status as ReportStatus,
          note: parsed.data.note,
          resolverId,
        },
        include: {
          reporter: { select: { id: true, username: true } },
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: resolverId,
          action: `REPORT_${parsed.data.status}`,
          entity: "Report",
          entityId: id,
          meta: { note: parsed.data.note },
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: report.reporterId,
          title: "Report reviewed",
          body: `Your report was ${parsed.data.status.toLowerCase()}.`,
          href: "/mod",
        },
      }),
    ]);
    return updated;
  }
}
