"use client";

import Link from "next/link";

import { AdSlot } from "@/components/ads/ad-slot";
import { PageTransition } from "@/components/effects/page-transition";
import { TeamLogo } from "@/components/teams/team-logo";
import { useAuth } from "@/features/auth/auth-provider";
import { useLiveMatches } from "@/hooks/use-live-match";
import { useI18n } from "@/i18n/provider";
import { normalizeMapName } from "@/lib/maps";
import { cn } from "@/lib/utils";
import type { MatchDto } from "@/shared/api/client";

function LiveMatchRow({ match }: { match: MatchDto }) {
  const { t } = useI18n();
  const liveMap =
    match.maps.find((m) => !m.winnerId) ??
    match.maps.find((m) => m.mapName === match.activeMapName) ??
    match.maps.at(-1);
  const mapName = liveMap?.mapName ? normalizeMapName(liveMap.mapName) : null;

  return (
    <div className="hltv-row !grid-cols-1 !gap-2 !py-3 sm:!grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="bg-[var(--hltv-live)] px-1.5 py-0.5 font-bold uppercase tracking-wider text-white">
            LIVE
          </span>
          <span className="truncate text-zinc-500">{match.event?.name}</span>
          <span className="text-zinc-700">·</span>
          <span className="font-mono uppercase text-zinc-600">{match.format}</span>
          {mapName ? (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-400">{mapName}</span>
              {liveMap ? (
                <span className="font-mono text-[var(--hltv-live)]">
                  {liveMap.team1Score}:{liveMap.team2Score}
                </span>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex min-w-0 items-center justify-end gap-2">
            <span className="truncate text-right text-[13px] font-semibold text-zinc-100">
              {match.team1.name}
            </span>
            <TeamLogo team={match.team1} size="sm" />
          </div>

          <div className="min-w-[4.5rem] text-center font-mono text-xl font-black tabular-nums text-[var(--hltv-live)] sm:text-2xl">
            {match.team1Score}
            <span className="mx-1 text-zinc-600">:</span>
            {match.team2Score}
          </div>

          <div className="flex min-w-0 items-center justify-start gap-2">
            <TeamLogo team={match.team2} size="sm" />
            <span className="truncate text-left text-[13px] font-semibold text-zinc-100">
              {match.team2.name}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end sm:pl-3">
        <Link
          href={`/matches/${match.slug}`}
          className={cn(
            "inline-flex items-center border border-[var(--border)] bg-[#121212] px-3 py-2",
            "text-[10px] font-bold uppercase tracking-wider text-zinc-300",
            "hover:border-[var(--hltv-green)] hover:text-[var(--hltv-green)]",
          )}
        >
          {t("live.goToMatch")}
        </Link>
      </div>
    </div>
  );
}

export function LiveView() {
  const { t } = useI18n();
  const { can } = useAuth();
  const { matches, error } = useLiveMatches();
  const canOperate = can("match.live_operate");

  return (
    <PageTransition className="mx-auto max-w-5xl space-y-4 px-3 py-6 sm:px-4 lg:px-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase text-white">{t("live.title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("live.subtitle")}</p>
        </div>
        {canOperate ? (
          <Link
            href="/admin/matches"
            className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-[var(--hltv-green)]"
          >
            {t("admin.matchesTitle")}
          </Link>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <AdSlot slot="LIVE_SIDEBAR" />

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("live.now")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {matches.length}
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-zinc-500">
            <p>{t("live.empty")}</p>
            <Link
              href="/matches"
              className="mt-3 inline-block text-[11px] font-bold uppercase tracking-wide text-[var(--hltv-green)] hover:underline"
            >
              {t("nav.matches")} →
            </Link>
          </div>
        ) : (
          <div>
            {matches.map((match) => (
              <LiveMatchRow key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  );
}
