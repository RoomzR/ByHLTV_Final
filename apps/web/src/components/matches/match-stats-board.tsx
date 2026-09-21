"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { CountryFlag } from "@/components/shared/country-flag";
import { TeamLogo } from "@/components/teams/team-logo";
import { useI18n } from "@/i18n/provider";
import type { MatchDto, PlayerDto, TeamDto } from "@/shared/api/client";
import { cn } from "@/lib/utils";

type Tab = "overall" | string;
type SideFilter = "both" | "t" | "ct";

type StatRow = {
  player: PlayerDto;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  rating: number;
  kast: number;
  headshots: number;
  swing: number;
};

function ratingColor(r: number) {
  if (r >= 1.1) return "text-[#7dcf4a]";
  if (r >= 0.95) return "text-zinc-200";
  return "text-[#e35d5d]";
}

function swingColor(s: number) {
  if (s > 0) return "text-[#7dcf4a]";
  if (s < 0) return "text-[#e35d5d]";
  return "text-zinc-500";
}

function resolveTeam(player: PlayerDto, match: MatchDto): "t1" | "t2" {
  if (player.teamId === match.team1.id) return "t1";
  if (player.teamId === match.team2.id) return "t2";
  if ((match.team1.players ?? []).some((p) => p.id === player.id)) return "t1";
  if ((match.team2.players ?? []).some((p) => p.id === player.id)) return "t2";
  return "t1";
}

function TeamStatsTable({ team, rows }: { team: TeamDto; rows: StatRow[] }) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto border border-[var(--border)] bg-[#1b1f23]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[#16191c] px-3 py-2">
        <TeamLogo team={team} size="sm" />
        <span className="text-[12px] font-semibold uppercase tracking-wide text-zinc-200">
          {team.name}
        </span>
      </div>
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-medium">{t("matches.player")}</th>
            <th className="px-2 py-2 text-right font-medium">K-D</th>
            <th className="px-2 py-2 text-right font-medium">Swing</th>
            <th className="px-2 py-2 text-right font-medium">ADR</th>
            <th className="px-2 py-2 text-right font-medium">KAST</th>
            <th className="px-3 py-2 text-right font-medium">Rating 2.0</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => (
            <tr
              key={s.player.id}
              className={cn(
                "border-t border-[#2a2e33]",
                i % 2 === 0 ? "bg-[#1b1f23]" : "bg-[#191d21]",
              )}
            >
              <td className="px-3 py-2">
                <Link
                  href={`/players/${s.player.slug}`}
                  className="inline-flex items-center gap-1.5 text-zinc-200 hover:text-white"
                >
                  <CountryFlag code={s.player.country} className="text-[11px]" />
                  <span className="font-semibold">{s.player.nickname}</span>
                  {s.player.realName ? (
                    <span className="hidden text-zinc-500 sm:inline">
                      {s.player.realName}
                    </span>
                  ) : null}
                </Link>
              </td>
              <td className="px-2 py-2 text-right font-mono tabular-nums text-zinc-300">
                {s.kills}-{s.deaths}
              </td>
              <td className={cn("px-2 py-2 text-right font-mono tabular-nums", swingColor(s.swing))}>
                {s.swing > 0 ? "+" : ""}
                {s.swing.toFixed(1)}%
              </td>
              <td className="px-2 py-2 text-right font-mono tabular-nums text-zinc-300">
                {s.adr.toFixed(1)}
              </td>
              <td className="px-2 py-2 text-right font-mono tabular-nums text-zinc-300">
                {s.kast.toFixed(1)}%
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right font-mono text-[13px] font-bold tabular-nums",
                  ratingColor(s.rating),
                )}
              >
                {s.rating.toFixed(2)}
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-4 text-center text-zinc-600">
                {t("matches.noStats")}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function aggregateRows(stats: NonNullable<MatchDto["playerStats"]>, tab: Tab): StatRow[] {
  if (tab === "overall") {
    const byPlayer = new Map<string, StatRow & { maps: number }>();
    for (const s of stats) {
      const cur = byPlayer.get(s.player.id);
      if (!cur) {
        byPlayer.set(s.player.id, {
          player: s.player,
          kills: s.kills,
          deaths: s.deaths,
          assists: s.assists,
          adr: s.adr,
          rating: s.rating,
          kast: s.kast ?? 0,
          headshots: s.headshots ?? 0,
          swing: 0,
          maps: 1,
        });
      } else {
        cur.kills += s.kills;
        cur.deaths += s.deaths;
        cur.assists += s.assists;
        cur.adr += s.adr;
        cur.rating += s.rating;
        cur.kast += s.kast ?? 0;
        cur.headshots += s.headshots ?? 0;
        cur.maps += 1;
      }
    }
    return [...byPlayer.values()]
      .map((r) => ({
        player: r.player,
        kills: r.kills,
        deaths: r.deaths,
        assists: r.assists,
        adr: r.adr / r.maps,
        rating: r.rating / r.maps,
        kast: r.kast / r.maps,
        headshots: r.headshots,
        swing: (r.kills - r.deaths) * 0.35,
      }))
      .sort((a, b) => b.rating - a.rating);
  }
  return stats
    .filter((s) => s.mapName === tab)
    .map((s) => ({
      player: s.player,
      kills: s.kills,
      deaths: s.deaths,
      assists: s.assists,
      adr: s.adr,
      rating: s.rating,
      kast: s.kast ?? 0,
      headshots: s.headshots ?? 0,
      swing: (s.kills - s.deaths) * 0.45,
    }))
    .sort((a, b) => b.rating - a.rating);
}

export function MatchStatsBoard({ match }: { match: MatchDto }) {
  const { t } = useI18n();
  const mapNames = useMemo(() => {
    const fromMaps = match.maps.map((m) => m.mapName);
    const fromStats = (match.playerStats ?? [])
      .map((s) => s.mapName)
      .filter((n): n is string => !!n);
    return [...new Set([...fromMaps, ...fromStats])];
  }, [match.maps, match.playerStats]);

  const [tab, setTab] = useState<Tab>("overall");
  const [side, setSide] = useState<SideFilter>("both");

  const rows = useMemo(
    () => aggregateRows(match.playerStats ?? [], tab),
    [match.playerStats, tab],
  );

  const team1Rows = rows.filter((r) => resolveTeam(r.player, match) === "t1");
  const team2Rows = rows.filter((r) => resolveTeam(r.player, match) === "t2");

  const filterBtn = (active: boolean) =>
    cn(
      "px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
      active ? "bg-[#2d3540] text-white" : "text-zinc-500 hover:text-zinc-300",
    );

  return (
    <section className="space-y-3">
      <div className="hltv-panel">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--hltv-green)]">
            {t("matches.matchStats")}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-2 text-[10px] uppercase text-zinc-600">{t("matches.sideFilter")}</span>
            {(
              [
                ["both", t("matches.sideBoth")],
                ["t", "Terrorist"],
                ["ct", "Counter-Terrorist"],
              ] as const
            ).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setSide(k)} className={filterBtn(side === k)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-1 text-[12px]">
        <button
          type="button"
          onClick={() => setTab("overall")}
          className={cn(
            "font-semibold",
            tab === "overall"
              ? "text-white underline decoration-[var(--hltv-green)]"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {t("matches.allMaps")}
        </button>
        {mapNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={cn(
              "font-semibold",
              tab === name
                ? "text-white underline decoration-[var(--hltv-green)]"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <TeamStatsTable team={match.team1} rows={team1Rows} />
        <TeamStatsTable team={match.team2} rows={team2Rows} />
      </div>
      {side !== "both" ? (
        <p className="text-[10px] text-zinc-600">{t("matches.sideFilterHint")}</p>
      ) : null}
    </section>
  );
}
