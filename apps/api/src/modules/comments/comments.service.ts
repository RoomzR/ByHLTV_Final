import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CommentTarget } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

const createCommentSchema = z.object({
  target: z.enum(["NEWS", "MATCH"]),
  newsId: z.string().uuid().optional(),
  matchId: z.string().uuid().optional(),
  body: z.string().min(1).max(4000),
});

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, raw: unknown) {
    const parsed = createCommentSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const d = parsed.data;
    if (d.target === "NEWS" && !d.newsId) {
      throw new BadRequestException("newsId required");
    }
    if (d.target === "MATCH" && !d.matchId) {
      throw new BadRequestException("matchId required");
    }
    if (d.newsId) {
      const news = await this.prisma.newsArticle.findUnique({ where: { id: d.newsId } });
      if (!news) throw new NotFoundException("News not found");
    }
    if (d.matchId) {
      const match = await this.prisma.match.findUnique({ where: { id: d.matchId } });
      if (!match) throw new NotFoundException("Match not found");
    }
    return this.prisma.comment.create({
      data: {
        userId,
        target: d.target as CommentTarget,
        newsId: d.newsId,
        matchId: d.matchId,
        body: d.body,
      },
      include: { user: { select: { username: true, displayName: true } } },
    });
  }

  listForNews(newsId: string) {
    return this.prisma.comment.findMany({
      where: { newsId, hidden: false },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true, displayName: true } } },
      take: 100,
    });
  }

  listForMatch(matchId: string) {
    return this.prisma.comment.findMany({
      where: { matchId, hidden: false },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true, displayName: true } } },
      take: 100,
    });
  }

  async hide(id: string, actorId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException();
    const [updated] = await this.prisma.$transaction([
      this.prisma.comment.update({ where: { id }, data: { hidden: true } }),
      this.prisma.auditLog.create({
        data: {
          userId: actorId,
          action: "COMMENT_HIDE",
          entity: "Comment",
          entityId: id,
        },
      }),
    ]);
    return updated;
  }

  async remove(id: string, actorId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException();
    await this.prisma.$transaction([
      this.prisma.comment.delete({ where: { id } }),
      this.prisma.auditLog.create({
        data: {
          userId: actorId,
          action: "COMMENT_DELETE",
          entity: "Comment",
          entityId: id,
        },
      }),
    ]);
    return { ok: true };
  }
}
