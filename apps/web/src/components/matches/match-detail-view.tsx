"use client";

import Link from "next/link";

import { AdSlot } from "@/components/ads/ad-slot";
import { PageTransition } from "@/components/effects/page-transition";
import { LiveScoreboard } from "@/components/matches/live-scoreboard";
import { MatchContextPanels } from "@/components/matches/match-context-panels";
import { MatchLineups } from "@/components/matches/match-lineups";
import { MatchMapsPanel } from "@/components/matches/match-maps-panel";
import { MatchPageHeader } from "@/components/matches/match-page-header";
import { MatchRewatchPanel } from "@/components/matches/match-rewatch-panel";
import { MatchStatsBoard } from "@/components/matches/match-stats-board";
import { CommentsSection } from "@/components/shared/comments-section";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-provider";
import { useLiveMatch } from "@/hooks/use-live-match";
import { useI18n } from "@/i18n/provider";

export function MatchDetailView({ id }: { id: string }) {
  const { t } = useI18n();
  const { can } = useAuth();
  const { match, error, connected } = useLiveMatch(id);
  const canOperate = can("match.live_operate");

  if (error && !match) {
    return <div className="p-10 text-center text-rose-400">{error}</div>;
  }

  if (!match) {
    return <PageSkeleton rows={5} />;
  }

  const isLive = match.status === "LIVE";

  return (
    <PageTransition className="mx-auto max-w-[1100px] space-y-3 px-3 py-5 sm:px-4 lg:px-5">
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
        <Link href="/matches" className="hover:text-[var(--hltv-green)]">
          ← {t("nav.matches")}
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="truncate text-zinc-400">{match.event?.name}</span>
        <FavoriteButton matchId={match.id} />
        {canOperate && isLive ? (
          <span className="text-zinc-600">
            {connected ? t("live.feedConnected") : t("live.feedConnecting")}
          </span>
        ) : null}
        {canOperate ? (
          <Link
            href={`/ops/live/${match.slug}`}
            className="ml-auto font-semibold uppercase tracking-wide text-[var(--hltv-green)] hover:underline"
          >
            {t("ops.liveControl")}
          </Link>
        ) : null}
      </div>

      <MatchPageHeader match={match} />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.72fr)]">
        <MatchMapsPanel match={match} />
        <div className="space-y-3">
          <AdSlot slot="MATCH_SIDEBAR" />
          <MatchRewatchPanel match={match} />
          {isLive ? <LiveScoreboard match={match} embed /> : null}
        </div>
      </div>

      {!isLive && match.status !== "FINISHED" ? (
        <div className="hltv-panel p-8 text-center text-sm text-zinc-500">
          {t("matches.matchUpcoming")}
        </div>
      ) : null}

      <MatchStatsBoard match={match} />
      <MatchLineups match={match} />
      <MatchContextPanels match={match} />

      <section className="hltv-panel p-4">
        <CommentsSection matchId={match.id} />
      </section>
    </PageTransition>
  );
}
