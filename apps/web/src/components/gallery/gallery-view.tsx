"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import { apiClient, type GalleryAlbumDto } from "@/shared/api/client";

export function GalleryView() {
  const { t } = useI18n();
  const [albums, setAlbums] = useState<GalleryAlbumDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .gallery()
      .then((list) => {
        if (!cancelled) setAlbums(list);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <PageTransition className="mx-auto max-w-[1100px] space-y-4 px-3 py-6 sm:px-4 lg:px-5">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-white">
          {t("galleryPage.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{t("galleryPage.subtitle")}</p>
      </div>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("galleryPage.albums")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {albums.length}
          </span>
        </div>

        {albums.length > 0 ? (
          <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => {
              const cover = mediaUrl(album.coverUrl);
              const count = album._count?.images ?? album.images?.length ?? 0;
              return (
                <Link
                  key={album.id}
                  href={`/gallery/${album.slug}`}
                  className="group relative block overflow-hidden bg-[#161616] transition-colors hover:bg-[#1c1c1c]"
                >
                  <div className="relative aspect-[16/10] bg-[#111]">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-100"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-3xl font-bold text-zinc-700">
                        {album.title.slice(0, 1)}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-10">
                      <div className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                        {album.title}
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-zinc-500">
                        <span className="truncate">
                          {album.event?.name ?? album.team?.name ?? t("galleryPage.album")}
                        </span>
                        <span className="shrink-0 font-mono">
                          {count} {t("galleryPage.photos")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="px-3 py-10 text-center text-sm text-zinc-600">{t("galleryPage.empty")}</p>
        )}
      </section>
    </PageTransition>
  );
}
