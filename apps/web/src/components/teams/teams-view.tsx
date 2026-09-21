"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { CountryFlag } from "@/components/shared/country-flag";
import { TeamLogo } from "@/components/teams/team-logo";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { apiClient, type TeamDto } from "@/shared/api/client";

function rankTone(rank: number) {
  if (rank === 1) return "text-amber-300";
  if (rank === 2) return "text-zinc-300";
  if (rank === 3) return "text-amber-600";
  if (rank <= 5) return "text-[var(--hltv-green)]";
  return "text-zinc-500";
}

export function TeamsView() {
  const { t } = useI18n();
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .teams()
      .then((list) => {
        if (cancelled) return;
        setTeams([...list].sort((a, b) => a.ranking - b.ranking));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const regions = useMemo(() => {
    const set = new Set(teams.map((team) => team.region).filter(Boolean));
    return Array.from(set).sort();
  }, [teams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teams.filter((team) => {
      if (region !== "all" && team.region !== region) return false;
      if (!q) return true;
      return (
        team.name.toLowerCase().includes(q) ||
        team.shortName.toLowerCase().includes(q) ||
        team.region.toLowerCase().includes(q)
      );
    });
  }, [teams, query, region]);

  if (loading) return <PageSkeleton rows={8} />;

  return (
    <PageTransition className="mx-auto max-w-[1100px] space-y-4 px-3 py-6 sm:px-4 lg:px-5">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-white">{t("teams.title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("teams.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("teams.search")}
          className="w-full border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[var(--hltv-green)] sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRegion("all")}
            className={cn(
              "border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              region === "all"
                ? "border-[var(--hltv-green)] bg-[var(--hltv-green)]/10 text-[var(--hltv-green)]"
                : "border-[var(--border)] text-zinc-500 hover:text-zinc-300",
            )}
          >
            {t("teams.allRegions")}
          </button>
          {regions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={cn(
                "border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                region === r
                  ? "border-[var(--hltv-green)] bg-[var(--hltv-green)]/10 text-[var(--hltv-green)]"
                  : "border-[var(--border)] text-zinc-500 hover:text-zinc-300",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("teams.title")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {filtered.length} / {teams.length}
          </span>
        </div>

        <div className="hidden grid-cols-[48px_minmax(0,1.6fr)_72px_88px_72px_80px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 sm:grid">
          <span>#</span>
          <span>{t("stats.team")}</span>
          <span className="text-right">{t("teams.tag")}</span>
          <span className="text-right">{t("teams.region")}</span>
          <span className="text-right">{t("teams.players")}</span>
          <span className="text-right">{t("teams.points")}</span>
        </div>

        <div>
          {filtered.map((team, i) => {
            const rank = team.ranking || i + 1;
            const playersCount = team._count?.players ?? team.players?.length ?? 0;
            return (
              <Link
                key={team.id}
                href={`/teams/${team.slug}`}
                className={cn(
                  "hltv-row group !grid-cols-[48px_minmax(0,1fr)_auto] !gap-2 sm:!grid-cols-[48px_minmax(0,1.6fr)_72px_88px_72px_80px]",
                  rank <= 3 && "bg-[#1a1e14]",
                )}
              >
                <span className={cn("font-mono text-sm font-bold", rankTone(rank))}>#{rank}</span>

                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[#111]">
                    <TeamLogo team={team} size="sm" className="h-7 w-7" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <CountryFlag code={team.country} className="text-[12px]" />
                      <span className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                        {team.name}
                      </span>
                    </span>
                    <span className="block truncate text-[10px] text-zinc-600 sm:hidden">
                      {team.shortName} · {team.region} · {team.points} pts
                    </span>
                  </span>
                </span>

                <span className="hidden truncate text-right font-mono text-[11px] uppercase text-zinc-500 sm:block">
                  {team.shortName}
                </span>
                <span className="hidden truncate text-right text-[11px] text-zinc-500 sm:block">
                  {team.region}
                </span>
                <span className="hidden text-right font-mono text-[12px] text-zinc-400 sm:block">
                  {playersCount}
                </span>
                <span className="text-right font-mono text-[13px] font-bold text-zinc-100">
                  {team.points}
                </span>
              </Link>
            );
          })}

          {filtered.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-zinc-600">
              {teams.length === 0 ? t("teams.empty") : t("teams.noResults")}
            </p>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}
