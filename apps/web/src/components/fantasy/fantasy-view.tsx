"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { apiClient, type FantasyLeagueDto } from "@/shared/api/client";

export function FantasyView() {
  const { t } = useI18n();
  const [leagues, setLeagues] = useState<FantasyLeagueDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .fantasyLeagues()
      .then((list) => {
        if (!cancelled) setLeagues(list);
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
          {t("fantasyPage.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{t("fantasyPage.subtitle")}</p>
      </div>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("fantasyPage.leagues")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {leagues.length}
          </span>
        </div>

        <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_72px_72px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 sm:grid">
          <span>{t("fantasyPage.league")}</span>
          <span>{t("fantasyPage.event")}</span>
          <span className="text-right">{t("fantasyPage.budget")}</span>
          <span className="text-right">{t("fantasyPage.squads")}</span>
        </div>

        <div>
          {leagues.map((league) => {
            const squads = league._count?.teams ?? 0;
            return (
              <Link
                key={league.id}
                href={`/fantasy/${league.event.slug}`}
                className="hltv-row group !grid-cols-[minmax(0,1fr)_auto] !gap-2 sm:!grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_72px_72px]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                    {league.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-zinc-600 sm:hidden">
                    {league.event.name} · {league.budget} · {squads}
                  </span>
                </span>
                <span className="hidden truncate text-[12px] text-zinc-400 sm:block">
                  {league.event.name}
                </span>
                <span className="hidden text-right font-mono text-[13px] font-bold text-[var(--hltv-green)] sm:block">
                  {league.budget}
                </span>
                <span className="text-right font-mono text-[13px] text-zinc-300">{squads}</span>
              </Link>
            );
          })}

          {leagues.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-zinc-600">{t("fantasyPage.empty")}</p>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}
