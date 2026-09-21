import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  createGalleryAlbumSchema,
  updateGalleryAlbumSchema,
  type CreateGalleryAlbumInput,
  type UpdateGalleryAlbumInput,
} from "@byhltv/shared";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

const albumInclude = {
  images: { orderBy: { order: "asc" as const } },
  event: true,
  team: true,
  _count: { select: { images: true } },
} as const;

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.galleryAlbum.findMany({
      orderBy: { createdAt: "desc" },
      include: albumInclude,
    });
  }

  async bySlug(slug: string) {
    const album = await this.prisma.galleryAlbum.findUnique({
      where: { slug },
      include: albumInclude,
    });
    if (!album) throw new NotFoundException();
    return album;
  }

  async create(raw: unknown) {
    const parsed = createGalleryAlbumSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.persistCreate(parsed.data);
  }

  private async persistCreate(data: CreateGalleryAlbumInput) {
    const slug = data.slug?.trim() || slugify(data.title) || `album-${Date.now()}`;
    if (!slug) throw new BadRequestException("Invalid slug");

    const existing = await this.prisma.galleryAlbum.findUnique({ where: { slug } });
    if (existing) throw new ConflictException("Album slug already exists");

    if (data.eventId) {
      const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
      if (!event) throw new NotFoundException("Event not found");
    }
    if (data.teamId) {
      const team = await this.prisma.team.findUnique({ where: { id: data.teamId } });
      if (!team) throw new NotFoundException("Team not found");
    }

    const images = data.images ?? [];
    return this.prisma.galleryAlbum.create({
      data: {
        title: data.title,
        slug,
        coverUrl: data.coverUrl ?? images[0]?.url ?? null,
        eventId: data.eventId ?? null,
        teamId: data.teamId ?? null,
        images: {
          create: images.map((img, i) => ({
            url: img.url,
            caption: img.caption ?? null,
            order: i + 1,
          })),
        },
      },
      include: albumInclude,
    });
  }

  async update(id: string, raw: unknown) {
    const parsed = updateGalleryAlbumSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const existing = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();

    const data: UpdateGalleryAlbumInput = parsed.data;

    if (data.slug && data.slug !== existing.slug) {
      const clash = await this.prisma.galleryAlbum.findUnique({ where: { slug: data.slug } });
      if (clash) throw new ConflictException("Album slug already exists");
    }
    if (data.eventId) {
      const event = await this.prisma.event.findUnique({ where: { id: data.eventId } });
      if (!event) throw new NotFoundException("Event not found");
    }
    if (data.teamId) {
      const team = await this.prisma.team.findUnique({ where: { id: data.teamId } });
      if (!team) throw new NotFoundException("Team not found");
    }

    return this.prisma.$transaction(async (tx) => {
      if (data.images) {
        await tx.galleryImage.deleteMany({ where: { albumId: id } });
        if (data.images.length > 0) {
          await tx.galleryImage.createMany({
            data: data.images.map((img, i) => ({
              albumId: id,
              url: img.url,
              caption: img.caption ?? null,
              order: i + 1,
            })),
          });
        }
      }

      const coverFromImages =
        data.images && data.images.length > 0 ? data.images[0].url : undefined;

      return tx.galleryAlbum.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.coverUrl !== undefined
            ? { coverUrl: data.coverUrl }
            : coverFromImages
              ? { coverUrl: coverFromImages }
              : {}),
          ...(data.eventId !== undefined ? { eventId: data.eventId } : {}),
          ...(data.teamId !== undefined ? { teamId: data.teamId } : {}),
        },
        include: albumInclude,
      });
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.galleryAlbum.delete({ where: { id } });
    return { ok: true };
  }
}
