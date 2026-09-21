"use client";

import { useEffect, useState } from "react";

import { AdSlot } from "@/components/ads/ad-slot";
import { PageTransition, Stagger, StaggerItem } from "@/components/effects/page-transition";
import { NewsCard } from "@/components/news/news-card";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { apiClient, type NewsDto } from "@/shared/api/client";

export function NewsView() {
  const { t, locale } = useI18n();
  const [articles, setArticles] = useState<NewsDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .news(locale)
      .then((items) => {
        if (!cancelled) setArticles(items);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (loading) return <PageSkeleton rows={6} />;

  const sorted = [...articles].sort(
    (a, b) =>
      new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime(),
  );
  const [featured, ...rest] = sorted;

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
          {t("news.title")}
        </h1>
        <p className="mt-2 text-zinc-500">{t("news.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          {featured ? (
            <div className="mb-8">
              <NewsCard article={featured} featured />
            </div>
          ) : null}

          <Stagger className="grid gap-4 md:grid-cols-2">
            {rest.map((article, idx) => (
              <StaggerItem key={article.id}>
                <NewsCard article={article} />
                {idx === 2 ? (
                  <div className="mt-4 md:col-span-2">
                    <AdSlot slot="NEWS_INFEED" />
                  </div>
                ) : null}
              </StaggerItem>
            ))}
          </Stagger>
        </div>
        <aside className="min-w-0 space-y-3">
          <AdSlot slot="NEWS_SIDEBAR" />
        </aside>
      </div>
    </PageTransition>
  );
}
