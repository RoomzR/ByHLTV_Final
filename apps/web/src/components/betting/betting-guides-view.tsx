"use client";

import { useEffect, useState } from "react";

import { PageTransition } from "@/components/effects/page-transition";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { apiClient, type BettingGuideDto } from "@/shared/api/client";

export function BettingGuidesView() {
  const { t, locale } = useI18n();
  const [guides, setGuides] = useState<BettingGuideDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .bettingGuides()
      .then((list) => {
        if (cancelled) return;
        const preferred = list.filter((g) => g.locale === locale);
        const rows = preferred.length > 0 ? preferred : list;
        setGuides(rows);
        if (rows[0]) setOpenId(rows[0].id);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <PageTransition className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-white">
          {t("bettingPage.guides")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{t("bettingPage.guidesSubtitle")}</p>
      </div>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("bettingPage.guides")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {guides.length}
          </span>
        </div>

        <div>
          {guides.map((guide) => {
            const open = openId === guide.id;
            return (
              <div key={guide.id} className="border-b border-[#262626] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : guide.id)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-[#1f1f1f]",
                    open && "bg-[#1a1e14]",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-zinc-100">{guide.title}</span>
                    <span className="mt-0.5 block text-[12px] text-zinc-500">{guide.excerpt}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-zinc-600">{open ? "−" : "+"}</span>
                </button>
                {open ? (
                  <div className="border-t border-[var(--border)] bg-[#141414] px-3 py-4">
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-300">
                      {guide.content}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}

          {guides.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-zinc-600">
              {t("bettingPage.emptyGuides")}
            </p>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}
