"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageTransition } from "@/components/effects/page-transition";
import { MatchRow } from "@/components/matches/match-row";
import { CountryFlag } from "@/components/shared/country-flag";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { TeamLogo } from "@/components/teams/team-logo";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { formatRating } from "@/lib/formatters";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { apiClient, type MatchDto, type PlayerDto, type TeamDto } from "@/shared/api/client";

function formatRole(role: string) {
  if (role === "AWPER") return "AWPer";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function ratingClass(rating: number) {
  if (rating >= 1.15) return "text-[var(--hltv-green)]";
  if (rating >= 1.0) return "text-zinc-200";
  return "text-[#e35d5d]";
}

function rankTone(rank: number) {
  if (rank === 1) return "text-amber-300";
  if (rank === 2) return "text-zinc-300";
  if (rank === 3) return "text-amber-600";
  if (rank <= 5) return "text-[var(--hltv-green)]";
  return "text-zinc-500";
}

export function TeamDetailView({ id }: { id: string }) {
  const { t } = useI18n();
  const [team, setTeam] = useState<(TeamDto & { matches?: MatchDto[] }) | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    apiClient
      .team(id)
      .then(setTeam)
      .catch(() => setFailed(true));
  }, [id]);

  const roster = useMemo(() => {
    const players = team?.players ?? [];
    return [...players].sort((a, b) => b.rating - a.rating);
  }, [team]);

  const matches = team?.matches ?? [];

  if (failed) notFound();
  if (!team) return <PageSkeleton rows={8} />;

  const stats = [
    { label: t("teams.rank"), value: `#${team.ranking}` },
    { label: t("teams.points"), value: String(team.points) },
    { label: t("teams.players"), value: String(roster.length) },
    { label: t("teams.region"), value: team.region },
  ];

  return (
    <PageTransition className="mx-auto max-w-[1100px] space-y-5 px-3 py-6 sm:px-4 lg:px-5">
      <div className="overflow-hidden border border-[var(--border)] bg-[#161616]">
        <div className="relative flex flex-col gap-5 px-4 py-5 sm:flex-row sm:items-center sm:px-5">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              background:
                "radial-gradient(ellipse 70% 120% at 0% 50%, var(--hltv-green), transparent 55%)",
            }}
          />
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[#111] sm:h-24 sm:w-24">
            <TeamLogo team={team} size="lg" className="h-16 w-16 sm:h-20 sm:w-20" />
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-bold uppercase text-white md:text-4xl">
                {team.name}
              </h1>
              <span
                className={cn(
                  "font-mono text-sm font-bold",
                  rankTone(team.ranking),
                )}
              >
                #{team.ranking}
              </span>
              <FavoriteButton teamId={team.id} />
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <CountryFlag code={team.country} className="text-[14px]" />
              <span className="font-mono uppercase tracking-wide text-zinc-400">{team.shortName}</span>
              <span className="text-zinc-700">·</span>
              <span>{team.region}</span>
              <span className="text-zinc-700">·</span>
              <span className="font-mono text-[var(--hltv-green)]">{team.points} pts</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-[var(--border)] sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border-b border-[var(--border)] px-4 py-3 text-center last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                {stat.label}
              </div>
              <div className="mt-1 truncate font-mono text-lg font-semibold text-zinc-100">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("teams.roster")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {roster.length}
          </span>
        </div>

        {roster.length > 0 ? (
          <>
            <div className="hidden grid-cols-[minmax(0,1.5fr)_72px_56px_56px_56px_64px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 lg:grid">
              <span>{t("stats.player")}</span>
              <span>{t("players.role")}</span>
              <span className="text-right">{t("players.maps")}</span>
              <span className="text-right">K/D</span>
              <span className="text-right">ADR</span>
              <span className="text-right">Rating</span>
            </div>
            <div>
              {roster.map((player: PlayerDto) => {
                const photo = mediaUrl(player.photoUrl ?? null);
                return (
                  <Link
                    key={player.id}
                    href={`/players/${player.slug}`}
                    className="hltv-row group !grid-cols-[minmax(0,1fr)_auto] !gap-2 lg:!grid-cols-[minmax(0,1.5fr)_72px_56px_56px_56px_64px]"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[#111]">
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
                        <span className="block truncate text-[10px] text-zinc-600">
                          {player.realName}
                          <span className="lg:hidden">
                            {" "}
                            · {formatRole(player.role)} · {formatRating(player.rating)}
                          </span>
                        </span>
                      </span>
                    </span>

                    <span className="hidden text-[11px] uppercase tracking-wide text-zinc-500 lg:block">
                      {formatRole(player.role)}
                    </span>
                    <span className="hidden text-right font-mono text-[12px] text-zinc-400 lg:block">
                      {player.mapsPlayed}
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
                        ratingClass(player.rating),
                      )}
                    >
                      {formatRating(player.rating)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <p className="px-3 py-8 text-center text-sm text-zinc-600">{t("teams.rosterEmpty")}</p>
        )}
      </section>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("teams.recentMatches")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {matches.length}
          </span>
        </div>
        {matches.length > 0 ? (
          <div>
            {matches.map((match) => (
              <MatchRow key={match.id} match={match} compact />
            ))}
          </div>
        ) : (
          <p className="px-3 py-8 text-center text-sm text-zinc-600">{t("teams.matchesEmpty")}</p>
        )}
      </section>
    </PageTransition>
  );
}
