"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { apiClient, type GalleryAlbumDto } from "@/shared/api/client";

export function GalleryAlbumView({ slug }: { slug: string }) {
  const { t } = useI18n();
  const [album, setAlbum] = useState<GalleryAlbumDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .galleryAlbum(slug)
      .then((data) => {
        if (!cancelled) setAlbum(data);
      })
      .catch(() => {
        if (!cancelled) setAlbum(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (active == null) return;
    function onKey(e: KeyboardEvent) {
      if (!album?.images?.length) return;
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((i) => (i == null ? 0 : (i + 1) % album.images!.length));
      if (e.key === "ArrowLeft") {
        setActive((i) =>
          i == null ? 0 : (i - 1 + album.images!.length) % album.images!.length,
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, album]);

  if (loading) return <PageSkeleton rows={6} />;
  if (!album) {
    return (
      <PageTransition className="mx-auto max-w-[1100px] px-3 py-10 sm:px-4">
        <p className="text-sm text-zinc-500">{t("galleryPage.notFound")}</p>
        <Link href="/gallery" className="mt-3 inline-block text-sm text-[var(--hltv-green)]">
          ← {t("galleryPage.back")}
        </Link>
      </PageTransition>
    );
  }

  const images = album.images ?? [];
  const activeImg = active != null ? images[active] : null;

  return (
    <PageTransition className="mx-auto max-w-[1100px] space-y-4 px-3 py-6 sm:px-4 lg:px-5">
      <div>
        <Link
          href="/gallery"
          className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 hover:text-[var(--hltv-green)]"
        >
          ← {t("galleryPage.back")}
        </Link>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase text-white">{album.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {album.event ? (
            <Link href={`/events/${album.event.slug}`} className="hover:text-[var(--hltv-green)]">
              {album.event.name}
            </Link>
          ) : album.team ? (
            <Link href={`/teams/${album.team.slug}`} className="hover:text-[var(--hltv-green)]">
              {album.team.name}
            </Link>
          ) : (
            t("galleryPage.album")
          )}
          {" · "}
          <span className="font-mono">
            {images.length} {t("galleryPage.photos")}
          </span>
        </p>
      </div>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("galleryPage.photos")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {images.length}
          </span>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-px bg-[var(--border)] sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, i) => {
              const src = mediaUrl(img.url);
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className="group relative aspect-square overflow-hidden bg-[#111] text-left"
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={img.caption ?? ""}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center p-2 text-center text-[11px] text-zinc-600">
                      {img.caption ?? img.url}
                    </span>
                  )}
                  {img.caption ? (
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-2 py-1 text-[10px] text-zinc-300 opacity-0 transition group-hover:opacity-100">
                      {img.caption}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="px-3 py-10 text-center text-sm text-zinc-600">{t("galleryPage.emptyAlbum")}</p>
        )}
      </section>

      {activeImg ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal
        >
          <button
            type="button"
            className="absolute right-4 top-4 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white"
            onClick={() => setActive(null)}
          >
            {t("galleryPage.close")} Esc
          </button>
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 border border-[var(--border)] bg-black/50 px-3 py-4 text-zinc-300 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i == null ? 0 : (i - 1 + images.length) % images.length));
            }}
          >
            ‹
          </button>
          <div className="max-h-[85vh] max-w-[min(1100px,95vw)]" onClick={(e) => e.stopPropagation()}>
            {mediaUrl(activeImg.url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(activeImg.url)}
                alt={activeImg.caption ?? ""}
                className="max-h-[80vh] max-w-full object-contain"
              />
            ) : null}
            <div className={cn("mt-2 flex items-center justify-between gap-3 text-[12px] text-zinc-400")}>
              <span className="truncate">{activeImg.caption ?? album.title}</span>
              <span className="shrink-0 font-mono">
                {(active ?? 0) + 1} / {images.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 border border-[var(--border)] bg-black/50 px-3 py-4 text-zinc-300 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i == null ? 0 : (i + 1) % images.length));
            }}
          >
            ›
          </button>
        </div>
      ) : null}
    </PageTransition>
  );
}
