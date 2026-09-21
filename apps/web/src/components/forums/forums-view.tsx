"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { apiClient, type ForumCategoryDto } from "@/shared/api/client";

export function ForumsView() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<ForumCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .forumsCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
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
        <h1 className="font-display text-3xl font-bold uppercase text-white">{t("forums.title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("forums.subtitle")}</p>
      </div>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("forums.categories")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {categories.length}
          </span>
        </div>

        <div className="hidden grid-cols-[minmax(0,1fr)_88px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 sm:grid">
          <span>{t("forums.category")}</span>
          <span className="text-right">{t("forums.threads")}</span>
        </div>

        <div>
          {categories.map((cat) => {
            const threads = cat._count?.threads ?? 0;
            return (
              <Link
                key={cat.id}
                href={`/forums/${cat.slug}`}
                className="hltv-row group !grid-cols-[minmax(0,1fr)_auto] !gap-3 sm:!grid-cols-[minmax(0,1fr)_88px]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                    {cat.name}
                  </span>
                  {cat.description ? (
                    <span className="mt-0.5 block truncate text-[12px] text-zinc-500">
                      {cat.description}
                    </span>
                  ) : null}
                  <span className="mt-1 block font-mono text-[10px] text-zinc-600 sm:hidden">
                    {threads} {t("forums.threads").toLowerCase()}
                  </span>
                </span>
                <span className="hidden text-right font-mono text-[13px] font-bold text-zinc-200 sm:block">
                  {threads}
                </span>
              </Link>
            );
          })}

          {categories.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-zinc-600">{t("forums.emptyCategories")}</p>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}
