"use client";

import { Badge } from "@/components/ui/badge";
import { TeamLogo } from "@/components/teams/team-logo";
import type { LivePlayerDto, MatchDto } from "@/shared/api/client";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

interface LiveScoreboardProps {
  match: MatchDto;
  /** Compact embed under rewatch column on match page */
  embed?: boolean;
}

function HpBar({ health, alive }: { health: number; alive: boolean }) {
  const hp = alive ? Math.max(0, Math.min(100, health)) : 0;
  return (
    <div className="h-1.5 w-12 overflow-hidden bg-[#2a2a2a] sm:w-14">
      <div
        className={`h-full ${hp > 40 ? "bg-[var(--hltv-green)]" : hp > 15 ? "bg-amber-500" : "bg-rose-500"}`}
        style={{ width: `${hp}%` }}
      />
    </div>
  );
}

function LiveRosterTable({
  team,
  side,
  players,
  showLive,
}: {
  team: MatchDto["team1"];
  side: string;
  players: LivePlayerDto[];
  showLive: boolean;
}) {
  const sorted = [...players].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
  return (
    <div className="overflow-x-auto border border-[var(--border)] bg-[#1b1f23]">
      <div className="flex items-center justify-between bg-[#16191c] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        <span className="flex items-center gap-2 text-zinc-300">
          <TeamLogo team={team} size="sm" className="h-4 w-4" />
          {team.name} · {side}
        </span>
        <span>
          {sorted.filter((p) => p.alive).length}/{sorted.length}
        </span>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="text-[10px] uppercase text-zinc-600">
          <tr>
            {showLive ? <th className="px-2 py-1.5">HP</th> : null}
            <th className="px-2 py-1.5">Player</th>
            <th className="px-2 py-1.5 text-right">K</th>
            <th className="px-2 py-1.5 text-right">D</th>
            <th className="px-2 py-1.5 text-right">A</th>
            {showLive ? (
              <>
                <th className="px-2 py-1.5 text-right">$</th>
                <th className="px-2 py-1.5">Wpn</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr
              key={p.steamId}
              className={cn("border-t border-[#2a2e33]", p.alive ? "" : "opacity-45")}
            >
              {showLive ? (
                <td className="px-2 py-1.5">
                  <HpBar health={p.health} alive={p.alive} />
                </td>
              ) : null}
              <td className="px-2 py-1.5 font-semibold text-zinc-200">{p.name}</td>
              <td className="px-2 py-1.5 text-right font-mono">{p.kills}</td>
              <td className="px-2 py-1.5 text-right font-mono">{p.deaths}</td>
              <td className="px-2 py-1.5 text-right font-mono">{p.assists}</td>
              {showLive ? (
                <>
                  <td className="px-2 py-1.5 text-right font-mono text-zinc-400">{p.money}</td>
                  <td className="px-2 py-1.5 font-mono text-[10px] uppercase text-zinc-500">
                    {p.weapon ?? "—"}
                  </td>
                </>
              ) : null}
            </tr>
          ))}
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={showLive ? 7 : 4} className="px-3 py-3 text-zinc-600">
                —
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export function LiveScoreboard({ match, embed }: LiveScoreboardProps) {
  const { t } = useI18n();
  const current =
    match.maps.find((m) => !m.winnerId) ??
    match.maps.find((m) => m.mapName === match.activeMapName) ??
    match.maps.at(-1);

  const team1Side = (match.team1Side === "T" ? "T" : "CT") as "CT" | "T";
  const team2Side = team1Side === "CT" ? "T" : "CT";
  const isLive = match.status === "LIVE";
  const showLive = isLive && !!match.gsiOnline && (match.livePlayers?.length ?? 0) > 0;
  const live = match.livePlayers ?? [];
  const team1Players = live.filter((p) => p.team === team1Side);
  const team2Players = live.filter((p) => p.team === team2Side);

  const mapScore1 = current?.team1Score ?? 0;
  const mapScore2 = current?.team2Score ?? 0;

  if (embed) {
    return (
      <section className="space-y-2">
        <div className="border border-[var(--border)] bg-[#1b1f23] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
          {t("live.now")} · {current?.mapName ?? match.activeMapName ?? "MAP"}{" "}
          <span className="font-mono normal-case tracking-normal text-[var(--hltv-live)]">
            {mapScore1}:{mapScore2}
          </span>
          {match.roundTimeSec != null ? (
            <span className="ml-2 font-mono normal-case text-zinc-500">{match.roundTimeSec}s</span>
          ) : null}
          {match.bombState ? (
            <span className="ml-2 normal-case text-amber-400">{match.bombState}</span>
          ) : null}
        </div>
        <div className="grid gap-2">
          <LiveRosterTable
            team={match.team1}
            side={team1Side}
            players={team1Players}
            showLive={showLive}
          />
          <LiveRosterTable
            team={match.team2}
            side={team2Side}
            players={team2Players}
            showLive={showLive}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden border border-[var(--border)] bg-[#1b1f23]">
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isLive ? (
              <Badge variant="live" className="glitch-live">
                {t("live.now")}
              </Badge>
            ) : (
              <Badge variant="cyan">{t("matches.result")}</Badge>
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {match.event?.name}
            </span>
            {isLive ? (
              <span
                className={`text-[10px] uppercase tracking-wide ${
                  match.gsiOnline ? "text-[var(--hltv-green)]" : "text-zinc-600"
                }`}
              >
                {match.gsiOnline ? t("live.gsiOnline") : t("live.gsiOffline")}
              </span>
            ) : null}
          </div>
          <span className="border border-[var(--border)] bg-[#111] px-2.5 py-1 font-mono text-[11px] text-[var(--hltv-live)]">
            {current?.mapName ?? match.activeMapName ?? "MAP"} · {match.format} · R
            {match.currentRound ?? 0}
            {match.roundTimeSec != null && isLive ? ` · ${match.roundTimeSec}s` : ""}
            {match.bombState ? ` · ${match.bombState}` : ""}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex min-w-0 items-center justify-end gap-2 text-right">
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-extrabold uppercase sm:text-2xl">
                {match.team1.name}
              </div>
              <div className="text-[11px] text-zinc-500">
                #{match.team1.ranking} · {team1Side}
              </div>
            </div>
            <TeamLogo team={match.team1} size="md" />
          </div>

          <div className="text-center">
            <div className="font-mono text-4xl font-black tracking-tighter sm:text-5xl">
              <span className="text-[var(--hltv-live)]">{mapScore1}</span>
              <span className="mx-1 text-zinc-700">:</span>
              <span className="text-[var(--hltv-green)]">{mapScore2}</span>
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {t("matches.series")}{" "}
              <span className="font-mono text-zinc-300">
                {match.team1Score}:{match.team2Score}
              </span>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-start gap-2 text-left">
            <TeamLogo team={match.team2} size="md" />
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-extrabold uppercase sm:text-2xl">
                {match.team2.name}
              </div>
              <div className="text-[11px] text-zinc-500">
                #{match.team2.ranking} · {team2Side}
              </div>
            </div>
          </div>
        </div>

        {match.maps.length > 1 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {match.maps.map((map) => (
              <div
                key={map.mapName}
                className="border border-[var(--border)] bg-[#111] px-3 py-1.5 text-center"
              >
                <div className="text-[9px] uppercase tracking-wider text-zinc-500">{map.mapName}</div>
                <div className="font-mono text-sm text-zinc-200">
                  {map.team1Score}:{map.team2Score}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {showLive || isLive ? (
          <div className="grid gap-3 md:grid-cols-2">
            <LiveRosterTable
              team={match.team1}
              side={team1Side}
              players={team1Players}
              showLive={showLive}
            />
            <LiveRosterTable
              team={match.team2}
              side={team2Side}
              players={team2Players}
              showLive={showLive}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
