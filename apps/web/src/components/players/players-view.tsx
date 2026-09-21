"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { CountryFlag } from "@/components/shared/country-flag";
import { TeamLogo } from "@/components/teams/team-logo";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { formatRating } from "@/lib/formatters";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { apiClient, type PlayerDto } from "@/shared/api/client";

function formatRole(role: string) {
  if (role === "AWPER") return "AWPer";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function ratingClass(rating: number) {
  if (rating >= 1.15) return "text-[var(--hltv-green)]";
  if (rating >= 1.0) return "text-zinc-200";
  return "text-[#e35d5d]";
}

export function PlayersView({
  status = "ACTIVE",
  titleKey = "players.title",
  subtitleKey = "players.subtitle",
}: {
  status?: "ACTIVE" | "RETIRED";
  titleKey?: "players.title" | "players.retiredTitle";
  subtitleKey?: "players.subtitle" | "players.retiredSubtitle";
}) {
  const { t } = useI18n();
  const [players, setPlayers] = useState<PlayerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .players(status)
      .then((list) => {
        if (cancelled) return;
        setPlayers([...list].sort((a, b) => b.rating - a.rating));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const roles = useMemo(() => {
    const set = new Set(players.map((p) => p.role).filter(Boolean));
    return Array.from(set).sort();
  }, [players]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter((p) => {
      if (role !== "all" && p.role !== role) return false;
      if (!q) return true;
      return (
        p.nickname.toLowerCase().includes(q) ||
        p.realName.toLowerCase().includes(q) ||
        (p.team?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [players, query, role]);

  if (loading) return <PageSkeleton rows={8} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-white">{t(titleKey)}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t(subtitleKey)}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("players.search")}
          className="w-full border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[var(--hltv-green)] sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRole("all")}
            className={cn(
              "border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              role === "all"
                ? "border-[var(--hltv-green)] bg-[var(--hltv-green)]/10 text-[var(--hltv-green)]"
                : "border-[var(--border)] text-zinc-500 hover:text-zinc-300",
            )}
          >
            {t("players.allRoles")}
          </button>
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                role === r
                  ? "border-[var(--hltv-green)] bg-[var(--hltv-green)]/10 text-[var(--hltv-green)]"
                  : "border-[var(--border)] text-zinc-500 hover:text-zinc-300",
              )}
            >
              {formatRole(r)}
            </button>
          ))}
        </div>
      </div>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t(titleKey)}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {filtered.length} / {players.length}
          </span>
        </div>

        <div className="hidden grid-cols-[44px_minmax(0,1.6fr)_minmax(0,1fr)_72px_56px_56px_56px_64px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 lg:grid">
          <span>#</span>
          <span>{t("stats.player")}</span>
          <span>{t("stats.team")}</span>
          <span>{t("players.role")}</span>
          <span className="text-right">{t("players.maps")}</span>
          <span className="text-right">K/D</span>
          <span className="text-right">ADR</span>
          <span className="text-right">Rating</span>
        </div>

        <div>
          {filtered.map((player, i) => {
            const rank = players.findIndex((p) => p.id === player.id) + 1;
            const photo = mediaUrl(player.photoUrl ?? null);
            return (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="hltv-row group !grid-cols-[44px_minmax(0,1fr)_auto] !gap-2 lg:!grid-cols-[44px_minmax(0,1.6fr)_minmax(0,1fr)_72px_56px_56px_56px_64px]"
              >
                <span className="font-mono text-sm font-bold text-zinc-500">#{rank || i + 1}</span>

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
                        · {player.team?.name ?? t("players.freeAgent")} · {formatRating(player.rating)}
                      </span>
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
                    <span className="text-[12px] text-zinc-600">{t("players.freeAgent")}</span>
                  )}
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
                <span className={cn("text-right font-mono text-[13px] font-bold", ratingClass(player.rating))}>
                  {formatRating(player.rating)}
                </span>
              </Link>
            );
          })}

          {filtered.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-zinc-600">
              {players.length === 0 ? t("players.empty") : t("players.noResults")}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
