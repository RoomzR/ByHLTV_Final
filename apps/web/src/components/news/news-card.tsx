"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { TranslationKey } from "@/i18n/get-dictionary";
import { useI18n } from "@/i18n/provider";
import { formatRelative } from "@/lib/formatters";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { NewsDto } from "@/shared/api/client";

interface NewsCardProps {
  article: NewsDto;
  featured?: boolean;
  dense?: boolean;
}

export function NewsCard({ article, featured = false, dense = false }: NewsCardProps) {
  const { t, locale } = useI18n();
  const categoryKey = article.category?.toLowerCase?.() ?? "news";
  const categoryLabelKey = `news.categories.${categoryKey}` as TranslationKey;

  if (dense) {
    return (
      <Link href={`/news/${article.slug}`} className="block">
        <article className="hltv-row group !grid-cols-1 gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={categoryKey === "transfer" ? "gold" : "cyan"}>
                {t(categoryLabelKey)}
              </Badge>
              <span className="text-[10px] text-zinc-600">
                {article.publishedAt ? formatRelative(article.publishedAt, locale) : ""}
              </span>
            </div>
            <h3 className="font-display mt-1.5 text-[clamp(1rem,1.6vw,1.2rem)] font-bold uppercase leading-snug text-zinc-100 transition-colors group-hover:text-[var(--hltv-green)]">
              {article.title}
            </h3>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/news/${article.slug}`} className="group block h-full">
      <article
        className={cn(
          "hltv-panel h-full overflow-hidden transition-colors hover:bg-[#222]",
          featured && "border-l-2 border-l-[var(--hltv-green)]",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-[#0f0f0f]",
            featured ? "h-40 md:h-48" : "h-28",
          )}
        >
          {mediaUrl(article.coverImage) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(article.coverImage)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-95"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(139,180,26,0.2),transparent_55%)]" />
          )}
          <div className="absolute bottom-3 left-3">
            <Badge variant={categoryKey === "transfer" ? "gold" : "cyan"}>
              {t(categoryLabelKey)}
            </Badge>
          </div>
        </div>
        <div className="space-y-2 p-4">
          <h3
            className={cn(
              "font-display font-bold uppercase leading-snug text-zinc-50 transition-colors group-hover:text-[var(--hltv-green)]",
              featured ? "text-[clamp(1.2rem,2vw,1.6rem)]" : "text-[clamp(1rem,1.6vw,1.2rem)]",
            )}
          >
            {article.title}
          </h3>
          <p className="line-clamp-2 text-xs text-zinc-500">{article.excerpt}</p>
          <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-600">
            <span className="truncate">{article.author?.displayName}</span>
            <span className="shrink-0">
              {article.publishedAt ? formatRelative(article.publishedAt, locale) : ""}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
