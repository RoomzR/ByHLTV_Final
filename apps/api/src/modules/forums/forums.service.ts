import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class ForumsService {
  constructor(private prisma: PrismaService) {}

  categories() {
    return this.prisma.forumCategory.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { threads: true } } },
    });
  }

  async category(slug: string) {
    const category = await this.prisma.forumCategory.findUnique({
      where: { slug },
      include: {
        threads: {
          orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
          include: {
            author: { select: { username: true, displayName: true } },
            _count: { select: { posts: true } },
          },
        },
      },
    });
    if (!category) throw new NotFoundException();
    return category;
  }

  async thread(id: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
      include: {
        category: true,
        author: { select: { username: true, displayName: true } },
        posts: {
          where: { hidden: false },
          orderBy: { createdAt: "asc" },
          include: { author: { select: { username: true, displayName: true, role: true } } },
        },
      },
    });
    if (!thread) throw new NotFoundException();
    return thread;
  }

  async createThread(userId: string, body: { categorySlug: string; title: string; body: string }) {
    const category = await this.prisma.forumCategory.findUnique({ where: { slug: body.categorySlug } });
    if (!category) throw new NotFoundException("Category not found");
    return this.prisma.forumThread.create({
      data: {
        categoryId: category.id,
        authorId: userId,
        title: body.title,
        posts: { create: [{ authorId: userId, body: body.body }] },
      },
      include: { posts: true },
    });
  }

  async reply(threadId: string, userId: string, body: string) {
    const thread = await this.prisma.forumThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new NotFoundException();
    if (thread.locked) throw new ForbiddenException("Thread is locked");
    return this.prisma.forumPost.create({
      data: { threadId, authorId: userId, body },
    });
  }

  async hidePost(id: string, actorId: string) {
    const [updated] = await this.prisma.$transaction([
      this.prisma.forumPost.update({ where: { id }, data: { hidden: true } }),
      this.prisma.auditLog.create({
        data: { userId: actorId, action: "FORUM_POST_HIDE", entity: "ForumPost", entityId: id },
      }),
    ]);
    return updated;
  }

  async deletePost(id: string, actorId: string) {
    await this.prisma.$transaction([
      this.prisma.forumPost.delete({ where: { id } }),
      this.prisma.auditLog.create({
        data: { userId: actorId, action: "FORUM_POST_DELETE", entity: "ForumPost", entityId: id },
      }),
    ]);
    return { ok: true };
  }

  async setLocked(id: string, locked: boolean, actorId: string) {
    const [updated] = await this.prisma.$transaction([
      this.prisma.forumThread.update({ where: { id }, data: { locked } }),
      this.prisma.auditLog.create({
        data: {
          userId: actorId,
          action: locked ? "FORUM_THREAD_LOCK" : "FORUM_THREAD_UNLOCK",
          entity: "ForumThread",
          entityId: id,
        },
      }),
    ]);
    return updated;
  }

  async setPinned(id: string, pinned: boolean, actorId: string) {
    const [updated] = await this.prisma.$transaction([
      this.prisma.forumThread.update({ where: { id }, data: { pinned } }),
      this.prisma.auditLog.create({
        data: {
          userId: actorId,
          action: pinned ? "FORUM_THREAD_PIN" : "FORUM_THREAD_UNPIN",
          entity: "ForumThread",
          entityId: id,
        },
      }),
    ]);
    return updated;
  }

  async deleteThread(id: string, actorId: string) {
    await this.prisma.$transaction([
      this.prisma.forumThread.delete({ where: { id } }),
      this.prisma.auditLog.create({
        data: { userId: actorId, action: "FORUM_THREAD_DELETE", entity: "ForumThread", entityId: id },
      }),
    ]);
    return { ok: true };
  }
}
