"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { apiClient, type AdPlacementSlot, type AdServeDto } from "@/shared/api/client";

const seenKey = (id: string) => `ad_imp_${id}`;

export function AdSlot({
  slot,
  className,
  variant = "auto",
}: {
  slot: AdPlacementSlot;
  className?: string;
  variant?: "auto" | "banner" | "teaser" | "article";
}) {
  const { t } = useI18n();
  const [ads, setAds] = useState<AdServeDto[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .adsServe(slot)
      .then((list) => {
        if (!cancelled) setAds(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slot]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || ads.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const ad of ads) {
            try {
              if (sessionStorage.getItem(seenKey(ad.id))) continue;
              sessionStorage.setItem(seenKey(ad.id), "1");
            } catch {
              /* ignore */
            }
            void apiClient.adsImpression(ad.id).catch(() => undefined);
          }
          observer.disconnect();
          break;
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ads]);

  async function onClick(ad: AdServeDto, e: MouseEvent) {
    e.preventDefault();
    try {
      const res = await apiClient.adsClick(ad.id);
      window.open(res.href || ad.href, "_blank", "noopener,noreferrer");
    } catch {
      window.open(ad.href, "_blank", "noopener,noreferrer");
    }
  }

  if (ads.length === 0) return null;

  return (
    <div ref={rootRef} className={cn("space-y-2", className)}>
      {ads.map((ad) => {
        const mode =
          variant === "auto"
            ? ad.format === "BANNER"
              ? "banner"
              : ad.format === "TEASER"
                ? "teaser"
                : "article"
            : variant;

        if (mode === "banner") {
          const src = mediaUrl(ad.imageUrl);
          return (
            <a
              key={ad.id}
              href={ad.href}
              onClick={(e) => void onClick(ad, e)}
              className="group relative block overflow-hidden border border-[var(--border)] bg-[#161616]"
            >
              <span className="absolute left-2 top-2 z-10 bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                {ad.sponsorLabel || t("ads.sponsored")}
              </span>
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={ad.title} className="max-h-40 w-full object-cover" />
              ) : (
                <div className="flex h-24 items-center justify-center px-3 text-center text-sm text-zinc-400">
                  {ad.title}
                </div>
              )}
            </a>
          );
        }

        if (mode === "teaser") {
          return (
            <a
              key={ad.id}
              href={ad.href}
              onClick={(e) => void onClick(ad, e)}
              className="block border border-[var(--border)] bg-[#161616] px-3 py-2.5 hover:border-[var(--hltv-green)]/40"
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                {ad.sponsorLabel || t("ads.sponsored")}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-zinc-100">{ad.title}</div>
              {ad.excerpt ? (
                <p className="mt-1 line-clamp-2 text-[12px] text-zinc-500">{ad.excerpt}</p>
              ) : null}
            </a>
          );
        }

        return (
          <article key={ad.id} className="hltv-panel border-l-2 border-l-amber-500/60">
            <div className="hltv-panel-header !text-amber-400/90">
              <span>{ad.sponsorLabel || t("ads.sponsored")}</span>
            </div>
            <a
              href={ad.href}
              onClick={(e) => void onClick(ad, e)}
              className="block px-3 py-3 hover:bg-[#1f1f1f]"
            >
              <h3 className="text-[14px] font-semibold text-zinc-100">{ad.title}</h3>
              {ad.excerpt ? (
                <p className="mt-1 line-clamp-3 text-[12px] text-zinc-500">{ad.excerpt}</p>
              ) : null}
            </a>
          </article>
        );
      })}
    </div>
  );
}
