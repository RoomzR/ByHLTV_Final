import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createNewsSchema } from "@byhltv/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async list(locale: string, category?: string) {
    const allowed = new Set(["NEWS", "INTERVIEW", "ANALYSIS", "TRANSFER"]);
    const items = await this.prisma.newsArticle.findMany({
      where: {
        published: true,
        ...(category && allowed.has(category)
          ? { category: category as "NEWS" | "INTERVIEW" | "ANALYSIS" | "TRANSFER" }
          : {}),
      },
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        translations: true,
      },
    });
    return items.map((item) => this.mapArticle(item, locale));
  }

  async bySlug(slug: string, locale: string) {
    const item = await this.prisma.newsArticle.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        translations: true,
        comments: {
          where: { hidden: false },
          include: { user: { select: { username: true, displayName: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
    if (!item || !item.published) throw new NotFoundException();
    return this.mapArticle(item, locale);
  }

  async create(raw: unknown, authorId: string) {
    const parsed = createNewsSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const created = await this.prisma.newsArticle.create({
      data: {
        slug: parsed.data.slug,
        category: parsed.data.category,
        featured: parsed.data.featured ?? false,
        coverImage: parsed.data.coverImage,
        galleryImages: JSON.stringify(parsed.data.galleryImages ?? []),
        tags: JSON.stringify(parsed.data.tags),
        authorId,
        published: true,
        publishedAt: new Date(),
        translations: {
          create: parsed.data.translations,
        },
      },
      include: { translations: true, author: true },
    });
    return created;
  }

  private mapArticle(
    item: {
      id: string;
      slug: string;
      category: string;
      coverImage: string | null;
      galleryImages?: string;
      featured: boolean;
      publishedAt: Date | null;
      tags: string;
      author: { id: string; displayName: string; username: string };
      translations: Array<{ locale: string; title: string; excerpt: string; content: string }>;
      comments?: unknown;
    },
    locale: string,
  ) {
    const wanted = (locale || "be").toLowerCase().slice(0, 2);
    const byLocale = new Map(item.translations.map((t) => [t.locale.toLowerCase(), t]));
    const tr =
      byLocale.get(wanted) ??
      byLocale.get("be") ??
      byLocale.get("ru") ??
      byLocale.get("en") ??
      item.translations[0];
    let tags: string[] = [];
    let galleryImages: string[] = [];
    try {
      tags = JSON.parse(item.tags);
    } catch {
      tags = [];
    }
    try {
      galleryImages = JSON.parse(item.galleryImages ?? "[]");
    } catch {
      galleryImages = [];
    }
    return {
      id: item.id,
      slug: item.slug,
      category: item.category,
      coverImage: item.coverImage,
      galleryImages,
      featured: item.featured,
      publishedAt: item.publishedAt,
      tags: tags,
      author: item.author,
      title: tr?.title ?? "",
      excerpt: tr?.excerpt ?? "",
      content: tr?.content ?? "",
      locale: tr?.locale ?? wanted,
      availableLocales: item.translations.map((t) => t.locale),
      comments: item.comments,
    };
  }

  async update(id: string, raw: unknown) {
    const parsed = createNewsSchema.partial().safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const data = parsed.data;
    const existing = await this.prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();

    if (data.translations?.length) {
      await this.prisma.newsTranslation.deleteMany({ where: { articleId: id } });
    }

    return this.prisma.newsArticle.update({
      where: { id },
      data: {
        slug: data.slug,
        category: data.category,
        featured: data.featured,
        coverImage: data.coverImage,
        galleryImages:
          data.galleryImages !== undefined
            ? JSON.stringify(data.galleryImages)
            : undefined,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        translations: data.translations
          ? { create: data.translations }
          : undefined,
      },
      include: { translations: true, author: true },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.newsArticle.delete({ where: { id } });
    return { ok: true };
  }

  async listAll() {
    return this.prisma.newsArticle.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        translations: true,
      },
    });
  }
}
