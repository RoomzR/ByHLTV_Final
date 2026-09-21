"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { TeamLogo } from "@/components/teams/team-logo";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { formatMatchTime } from "@/lib/formatters";
import { apiClient, type BettingOddDto } from "@/shared/api/client";

export function BettingOddsView() {
  const { t, locale } = useI18n();
  const [odds, setOdds] = useState<BettingOddDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .bettingOdds()
      .then((list) => {
        if (!cancelled) setOdds(list);
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
    <PageTransition className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-white">
          {t("bettingPage.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{t("bettingPage.subtitle")}</p>
      </div>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("bettingPage.odds")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {odds.length}
          </span>
        </div>

        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_72px_56px_56px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 lg:grid">
          <span>{t("bettingPage.match")}</span>
          <span>{t("bettingPage.event")}</span>
          <span>{t("bettingPage.bookmaker")}</span>
          <span className="text-right">1</span>
          <span className="text-right">2</span>
        </div>

        <div>
          {odds.map((odd) => (
            <Link
              key={odd.id}
              href={`/matches/${odd.match.slug}`}
              className="hltv-row group !grid-cols-[minmax(0,1fr)_auto_auto] !gap-2 lg:!grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_72px_56px_56px]"
            >
              <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-2">
                  <TeamLogo team={odd.match.team1} size="sm" className="h-5 w-5" />
                  <span className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                    {odd.match.team1.shortName}
                  </span>
                  <span className="text-zinc-600">vs</span>
                  <span className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                    {odd.match.team2.shortName}
                  </span>
                  <TeamLogo team={odd.match.team2} size="sm" className="h-5 w-5" />
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-zinc-600 lg:hidden">
                  {odd.match.event.name} · {odd.bookmaker}
                </span>
              </span>
              <span className="hidden min-w-0 truncate text-[12px] text-zinc-400 lg:block">
                {odd.match.event.name}
                <span className="mt-0.5 block font-mono text-[10px] text-zinc-600">
                  {formatMatchTime(odd.match.scheduledAt, locale)}
                </span>
              </span>
              <span className="hidden truncate text-[11px] uppercase text-zinc-500 lg:block">
                {odd.bookmaker}
              </span>
              <span className="text-right font-mono text-[13px] font-bold text-[var(--hltv-green)]">
                {odd.team1Odd.toFixed(2)}
              </span>
              <span className="text-right font-mono text-[13px] font-bold text-[var(--hltv-green)]">
                {odd.team2Odd.toFixed(2)}
              </span>
            </Link>
          ))}

          {odds.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-zinc-600">{t("bettingPage.emptyOdds")}</p>
          ) : null}
        </div>
      </section>

      <p className="text-[11px] text-zinc-600">{t("bettingPage.disclaimer")}</p>
    </PageTransition>
  );
}
