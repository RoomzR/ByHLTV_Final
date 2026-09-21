"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { CountryFlag } from "@/components/shared/country-flag";
import { TeamLogo } from "@/components/teams/team-logo";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { formatRating } from "@/lib/formatters";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { apiClient, type PlayerDto, type TeamDto } from "@/shared/api/client";

type Tab = "teams" | "players";

function rankTone(rank: number) {
  if (rank === 1) return "text-amber-300";
  if (rank === 2) return "text-zinc-300";
  if (rank === 3) return "text-amber-600";
  if (rank <= 5) return "text-[var(--hltv-green)]";
  return "text-zinc-500";
}

function TeamsTable({ teams }: { teams: TeamDto[] }) {
  const { t } = useI18n();
  return (
    <div className="hltv-panel">
      <div className="hltv-panel-header">
        <span>{t("rankingPage.teamsRanking")}</span>
        <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
          {teams.length} {t("nav.teams").toLowerCase()}
        </span>
      </div>
      <div className="hidden grid-cols-[48px_minmax(0,1.4fr)_80px_88px_72px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 sm:grid">
        <span>#</span>
        <span>{t("stats.team")}</span>
        <span className="text-right">{t("rankingPage.region")}</span>
        <span className="text-right">{t("rankingPage.points")}</span>
        <span className="text-right">{t("rankingPage.rank")}</span>
      </div>
      <div>
        {teams.map((team, i) => {
          const rank = team.ranking || i + 1;
          return (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              className={cn(
                "hltv-row group !grid-cols-[48px_minmax(0,1fr)_auto] !gap-2 sm:!grid-cols-[48px_minmax(0,1.4fr)_80px_88px_72px]",
                rank <= 3 && "bg-[#1a1e14]",
              )}
            >
              <span className={cn("font-mono text-sm font-bold", rankTone(rank))}>#{rank}</span>
              <span className="flex min-w-0 items-center gap-2.5">
                <TeamLogo team={team} size="sm" className="h-7 w-7" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <CountryFlag code={team.country} className="text-[12px]" />
                    <span className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                      {team.name}
                    </span>
                  </span>
                  <span className="block truncate text-[10px] text-zinc-600 sm:hidden">
                    {team.points} pts · {team.region}
                  </span>
                </span>
              </span>
              <span className="hidden truncate text-right text-[11px] text-zinc-500 sm:block">
                {team.region}
              </span>
              <span className="hidden text-right font-mono text-[13px] font-semibold text-zinc-200 sm:block">
                {team.points}
              </span>
              <span className="text-right font-mono text-[12px] text-zinc-500 sm:text-[13px]">
                <span className="sm:hidden">{team.points}</span>
                <span className="hidden sm:inline">#{rank}</span>
              </span>
            </Link>
          );
        })}
        {teams.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-zinc-600">{t("rankingPage.empty")}</p>
        ) : null}
      </div>
    </div>
  );
}

function PlayersTable({ players }: { players: PlayerDto[] }) {
  const { t } = useI18n();
  return (
    <div className="hltv-panel">
      <div className="hltv-panel-header">
        <span>{t("rankingPage.playersRanking")}</span>
        <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
          {players.length} {t("nav.players").toLowerCase()}
        </span>
      </div>
      <div className="hidden grid-cols-[48px_minmax(0,1.5fr)_minmax(0,1fr)_64px_64px_72px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 lg:grid">
        <span>#</span>
        <span>{t("stats.player")}</span>
        <span>{t("stats.team")}</span>
        <span className="text-right">K/D</span>
        <span className="text-right">ADR</span>
        <span className="text-right">Rating</span>
      </div>
      <div>
        {players.map((player, i) => {
          const rank = player.ranking && player.ranking < 999 ? player.ranking : i + 1;
          const photo = mediaUrl(player.photoUrl ?? null);
          return (
            <Link
              key={player.id}
              href={`/players/${player.slug}`}
              className={cn(
                "hltv-row group !grid-cols-[48px_minmax(0,1fr)_auto] !gap-2 lg:!grid-cols-[48px_minmax(0,1.5fr)_minmax(0,1fr)_64px_64px_72px]",
                rank <= 3 && "bg-[#1a1e14]",
              )}
            >
              <span className={cn("font-mono text-sm font-bold", rankTone(rank))}>#{rank}</span>
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[#111]">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover object-top" />
                  ) : (
                    <span className="font-display text-[10px] font-bold text-zinc-500">
                      {player.nickname.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <CountryFlag code={player.country} className="text-[12px]" />
                    <span className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                      {player.nickname}
                    </span>
                  </span>
                  <span className="block truncate text-[10px] text-zinc-600 lg:hidden">
                    {player.team?.name ?? t("rankingPage.freeAgent")} · {formatRating(player.rating)}
                  </span>
                </span>
              </span>
              <span className="hidden min-w-0 items-center gap-2 lg:flex">
                {player.team ? (
                  <>
                    <TeamLogo team={player.team} size="sm" className="h-5 w-5" />
                    <span className="truncate text-[12px] text-zinc-400">{player.team.name}</span>
                  </>
                ) : (
                  <span className="text-[12px] text-zinc-600">{t("rankingPage.freeAgent")}</span>
                )}
              </span>
              <span className="hidden text-right font-mono text-[12px] text-zinc-400 lg:block">
                {formatRating(player.kd)}
              </span>
              <span className="hidden text-right font-mono text-[12px] text-zinc-400 lg:block">
                {player.adr.toFixed(1)}
              </span>
              <span
                className={cn(
                  "text-right font-mono text-[13px] font-bold",
                  player.rating >= 1.15
                    ? "text-[var(--hltv-green)]"
                    : player.rating >= 1.0
                      ? "text-zinc-200"
                      : "text-[#e35d5d]",
                )}
              >
                {formatRating(player.rating)}
              </span>
            </Link>
          );
        })}
        {players.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-zinc-600">{t("rankingPage.empty")}</p>
        ) : null}
      </div>
    </div>
  );
}

export function RankingView() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("teams");
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [players, setPlayers] = useState<PlayerDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiClient.rankingsTeams(), apiClient.rankingsPlayers()])
      .then(([tm, pl]) => {
        if (cancelled) return;
        setTeams(tm);
        setPlayers(pl);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageSkeleton rows={8} />;

  return (
    <PageTransition className="mx-auto max-w-[1100px] space-y-4 px-3 py-6 sm:px-4 lg:px-5">
      <header className="hltv-panel overflow-hidden">
        <div className="relative px-4 py-6 sm:px-6 sm:py-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(139,180,26,0.12),transparent_45%)]" />
          <div className="relative">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--hltv-green)]">
              ByHLTV
            </div>
            <h1 className="font-display text-3xl font-bold uppercase text-white sm:text-4xl">
              {t("rankingPage.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">{t("rankingPage.subtitle")}</p>
          </div>
        </div>
        <div className="flex border-t border-[var(--border)]">
          {(
            [
              ["teams", t("rankingPage.tabTeams")],
              ["players", t("rankingPage.tabPlayers")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider transition-colors",
                tab === key
                  ? "bg-[var(--hltv-green)] text-black"
                  : "bg-[#161616] text-zinc-400 hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === "teams" ? <TeamsTable teams={teams} /> : <PlayersTable players={players} />}
    </PageTransition>
  );
}
