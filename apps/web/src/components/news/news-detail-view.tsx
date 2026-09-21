"use client";

import { useEffect, useState } from "react";

import { AdSlot } from "@/components/ads/ad-slot";
import { CommentsSection } from "@/components/shared/comments-section";
import { PageTransition } from "@/components/effects/page-transition";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/skeleton";
import type { TranslationKey } from "@/i18n/get-dictionary";
import { useI18n } from "@/i18n/provider";
import { formatRelative } from "@/lib/formatters";
import { mediaUrl } from "@/lib/media";
import { apiClient, type NewsDto } from "@/shared/api/client";

export function NewsDetailView({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const [article, setArticle] = useState<NewsDto | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiClient
      .newsArticle(slug, locale)
      .then((a) => {
        if (!cancelled) setArticle(a);
      })
      .catch((e) => {
        if (!cancelled) setError((e as { message?: string }).message ?? "Not found");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, locale]);

  if (error) {
    return <div className="p-10 text-center text-rose-400">{error}</div>;
  }
  if (!article) return <PageSkeleton rows={5} />;

  const categoryKey = article.category?.toLowerCase?.() ?? "news";
  const categoryLabelKey = `news.categories.${categoryKey}` as TranslationKey;
  const tags = Array.isArray(article.tags)
    ? article.tags
    : typeof article.tags === "string"
      ? (() => {
          try {
            return JSON.parse(article.tags as unknown as string) as string[];
          } catch {
            return [];
          }
        })()
      : [];

  return (
    <PageTransition className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Badge variant="cyan">{t(categoryLabelKey)}</Badge>
            <span className="text-sm text-zinc-500">{article.author?.displayName}</span>
            <span className="text-sm text-zinc-600">
              {article.publishedAt ? formatRelative(article.publishedAt, locale) : ""}
            </span>
          </div>
          <h1 className="font-display text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold uppercase leading-[1.1] text-white">
            {article.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-400">{article.excerpt}</p>
          {mediaUrl(article.coverImage) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(article.coverImage)}
              alt=""
              className="my-7 h-56 w-full border border-[var(--border)] object-cover"
            />
          ) : (
            <div className="my-7 h-44 border border-[var(--border)] bg-gradient-to-br from-[#222] via-[#151515] to-[#0f0f0f]" />
          )}
          {article.galleryImages && article.galleryImages.length > 0 ? (
            <div className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {article.galleryImages.map((url) => {
                const src = mediaUrl(url);
                if (!src) return null;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={src}
                    alt=""
                    className="h-32 w-full border border-[var(--border)] object-cover"
                  />
                );
              })}
            </div>
          ) : null}
          <div className="space-y-4 text-base leading-relaxed text-zinc-300">
            {article.content.split("\n\n").map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>

          <div className="mt-10 border-t border-[var(--border)] pt-8">
            <CommentsSection newsId={article.id} initial={article.comments} />
          </div>
        </article>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <AdSlot slot="NEWS_SIDEBAR" />
        </aside>
      </div>
    </PageTransition>
  );
}
