"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { CountryFlag } from "@/components/shared/country-flag";
import { TeamLogo } from "@/components/teams/team-logo";
import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import type { MatchDto, PlayerDto, TeamDto } from "@/shared/api/client";
import { apiClient } from "@/shared/api/client";
import { cn } from "@/lib/utils";

function TopPlayer({ match }: { match: MatchDto }) {
  const { t } = useI18n();
  const top = useMemo(() => {
    const stats = match.playerStats ?? [];
    if (!stats.length) return null;
    const byPlayer = new Map<
      string,
      { player: PlayerDto; rating: number; adr: number; kast: number; kills: number; deaths: number; maps: number }
    >();
    for (const s of stats) {
      const cur = byPlayer.get(s.player.id);
      if (!cur) {
        byPlayer.set(s.player.id, {
          player: s.player,
          rating: s.rating,
          adr: s.adr,
          kast: s.kast ?? 0,
          kills: s.kills,
          deaths: s.deaths,
          maps: 1,
        });
      } else {
        cur.rating += s.rating;
        cur.adr += s.adr;
        cur.kast += s.kast ?? 0;
        cur.kills += s.kills;
        cur.deaths += s.deaths;
        cur.maps += 1;
      }
    }
    return [...byPlayer.values()]
      .map((r) => ({
        ...r,
        rating: r.rating / r.maps,
        adr: r.adr / r.maps,
        kast: r.kast / r.maps,
        kpr: r.kills / Math.max(1, r.maps * 20),
        dpr: r.deaths / Math.max(1, r.maps * 20),
      }))
      .sort((a, b) => b.rating - a.rating)[0];
  }, [match.playerStats]);

  if (!top) return null;
  const photo = mediaUrl(top.player.photoUrl ?? null);
  const bars = [
    { label: "KPR", value: top.kpr, max: 1.2, fmt: top.kpr.toFixed(2) },
    { label: "DPR", value: top.dpr, max: 1.0, fmt: top.dpr.toFixed(2), invert: true },
    { label: "KAST", value: top.kast, max: 100, fmt: `${top.kast.toFixed(1)}%` },
    { label: "ADR", value: top.adr, max: 120, fmt: top.adr.toFixed(1) },
    { label: "Rating 2.0", value: top.rating, max: 2, fmt: top.rating.toFixed(2), accent: true },
  ];

  return (
    <section className="border border-[var(--border)] bg-[#1b1f23]">
      <div className="border-b border-[var(--border)] bg-[#16191c] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
        {t("matches.topPlayer")}{" "}
        <CountryFlag code={top.player.country} />{" "}
        <span className="normal-case tracking-normal text-zinc-200">
          {top.player.realName
            ? `${top.player.realName.split(" ")[0]} '${top.player.nickname}' ${top.player.realName.split(" ").slice(1).join(" ")}`
            : top.player.nickname}{" "}
          ({top.maps} {top.maps === 1 ? "map" : "maps"})
        </span>
      </div>
      <div className="grid gap-4 p-3 sm:grid-cols-[140px_1fr]">
        <div className="flex h-36 items-end justify-center bg-[#252a30]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover object-top" />
          ) : (
            <div className="mb-2 text-4xl font-bold text-zinc-600">{top.player.nickname.slice(0, 2)}</div>
          )}
        </div>
        <div className="space-y-2">
          {bars.map((b) => {
            const pct = Math.min(100, (b.value / b.max) * 100);
            return (
              <div key={b.label} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 text-[11px]">
                <span className="text-zinc-500">{b.label}</span>
                <div className="h-2.5 bg-[#111418]">
                  <div
                    className={cn("h-full", b.accent ? "bg-[#7dcf4a]" : "bg-[#3d9e8f]")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-right font-mono text-zinc-300">{b.fmt}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RecentForm({
  team,
  matches,
  selfId,
}: {
  team: TeamDto;
  matches: MatchDto[];
  selfId: string;
}) {
  const rows = matches
    .filter((m) => m.status === "FINISHED" && (m.team1.id === selfId || m.team2.id === selfId))
    .slice(0, 5);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-zinc-300">
        <TeamLogo team={team} size="sm" />
        {team.name}
      </div>
      <ul className="space-y-1">
        {rows.map((m) => {
          const isT1 = m.team1.id === selfId;
          const opp = isT1 ? m.team2 : m.team1;
          const own = isT1 ? m.team1Score : m.team2Score;
          const theirs = isT1 ? m.team2Score : m.team1Score;
          const won = own > theirs;
          return (
            <li key={m.id}>
              <Link
                href={`/matches/${m.slug}`}
                className="flex items-center gap-2 border border-[var(--border)] bg-[#16191c] px-2 py-1.5 text-[11px] hover:border-zinc-500"
              >
                <CountryFlag code={opp.country} />
                <span className="min-w-0 flex-1 truncate text-zinc-300">{opp.name}</span>
                <span className="text-zinc-600">{m.format}</span>
                <span
                  className={cn(
                    "min-w-[2.5rem] px-1.5 py-0.5 text-center font-mono font-bold",
                    won ? "bg-[#2a4a28] text-[#7dcf4a]" : "bg-[#4a2828] text-[#e35d5d]",
                  )}
                >
                  {own}-{theirs}
                </span>
              </Link>
            </li>
          );
        })}
        {rows.length === 0 ? (
          <li className="px-2 py-3 text-[11px] text-zinc-600">—</li>
        ) : null}
      </ul>
    </div>
  );
}

function HeadToHead({
  match,
  history,
}: {
  match: MatchDto;
  history: MatchDto[];
}) {
  const { t } = useI18n();
  const h2h = history.filter(
    (m) =>
      m.status === "FINISHED" &&
      m.id !== match.id &&
      ((m.team1.id === match.team1.id && m.team2.id === match.team2.id) ||
        (m.team1.id === match.team2.id && m.team2.id === match.team1.id)),
  );
  const t1Wins = h2h.filter((m) => {
    const t1IsLeft = m.team1.id === match.team1.id;
    return t1IsLeft ? m.team1Score > m.team2Score : m.team2Score > m.team1Score;
  }).length;
  const t2Wins = h2h.length - t1Wins;

  return (
    <section className="border border-[var(--border)] bg-[#1b1f23]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[#16191c] px-3 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
          {t("matches.headToHead")}
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-[#7dcf4a]">
            <TeamLogo team={match.team1} size="sm" className="h-4 w-4" />
            {t1Wins} {t("matches.wins")}
          </span>
          <span className="text-zinc-600">0 OT</span>
          <span className="flex items-center gap-1 text-[#e35d5d]">
            {t2Wins} {t("matches.wins")}
            <TeamLogo team={match.team2} size="sm" className="h-4 w-4" />
          </span>
        </div>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {h2h.slice(0, 6).map((m) => {
          const d = new Date(m.scheduledAt);
          const date = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getFullYear()).slice(2)}`;
          const mapLabel =
            m.maps.length === 1 ? m.maps[0].mapName : m.format === "BO1" ? m.maps[0]?.mapName : "Best of 3";
          return (
            <li key={m.id}>
              <Link
                href={`/matches/${m.slug}`}
                className="grid grid-cols-[3.5rem_1fr_1fr_minmax(0,1.4fr)_4rem_4.5rem] items-center gap-1 px-2 py-1.5 text-[11px] hover:bg-[#22262b]"
              >
                <span className="text-zinc-500">{date}</span>
                <span className="flex items-center gap-1 truncate text-zinc-300">
                  <CountryFlag code={m.team1.country} />
                  {m.team1.name}
                </span>
                <span className="flex items-center gap-1 truncate text-zinc-300">
                  <CountryFlag code={m.team2.country} />
                  {m.team2.name}
                </span>
                <span className="truncate text-zinc-500">{m.event.name}</span>
                <span className="text-zinc-500">{mapLabel}</span>
                <span className="text-right font-mono">
                  <span className={m.team1Score > m.team2Score ? "text-[#7dcf4a]" : "text-[#e35d5d]"}>
                    {m.team1Score}
                  </span>
                  {" - "}
                  <span className={m.team2Score > m.team1Score ? "text-[#7dcf4a]" : "text-[#e35d5d]"}>
                    {m.team2Score}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
        {h2h.length === 0 ? (
          <li className="px-3 py-4 text-center text-[11px] text-zinc-600">{t("matches.noH2h")}</li>
        ) : null}
      </ul>
    </section>
  );
}

function RankingDelta({ match }: { match: MatchDto }) {
  const { t } = useI18n();
  if (match.status !== "FINISHED") return null;
  const t1Won = match.team1Score > match.team2Score;
  const delta = Math.max(5, Math.round((match.team1.points + match.team2.points) / 200));
  const t1Delta = t1Won ? delta : -delta;
  const t2Delta = t1Won ? -Math.round(delta * 0.7) : Math.round(delta * 0.9);

  const Card = ({
    team,
    d,
  }: {
    team: TeamDto;
    d: number;
  }) => (
    <div className="flex flex-1 items-center justify-between gap-2 border border-[var(--border)] bg-[#16191c] px-3 py-2">
      <div className="flex items-center gap-2">
        <TeamLogo team={team} size="sm" />
        <div>
          <div className="text-[12px] font-semibold text-zinc-200">{team.name}</div>
          <div className="text-[10px] text-zinc-500">
            {team.points}pt #{team.ranking}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "px-2 py-1 text-center text-[11px] font-bold",
          d >= 0 ? "bg-[#2a4a28] text-[#7dcf4a]" : "bg-[#4a2828] text-[#e35d5d]",
        )}
      >
        <div>
          {d >= 0 ? "+" : ""}
          {d}pt
        </div>
        <div className="text-[10px] font-normal opacity-80">
          #{Math.max(1, team.ranking + (d >= 0 ? -1 : 1))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="border border-[var(--border)] bg-[#1b1f23]">
      <div className="border-b border-[var(--border)] bg-[#16191c] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
        {t("matches.rankingResult")}
      </div>
      <div className="flex flex-col gap-2 p-3 sm:flex-row">
        <Card team={match.team1} d={t1Delta} />
        <Card team={match.team2} d={t2Delta} />
      </div>
    </section>
  );
}

export function MatchContextPanels({ match }: { match: MatchDto }) {
  const { t } = useI18n();
  const [history, setHistory] = useState<MatchDto[]>([]);

  useEffect(() => {
    apiClient
      .matches("FINISHED")
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  return (
    <div className="space-y-4">
      <TopPlayer match={match} />

      <section className="border border-[var(--border)] bg-[#1b1f23]">
        <div className="border-b border-[var(--border)] bg-[#16191c] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
          {t("matches.recentForm")}
        </div>
        <div className="grid gap-4 p-3 sm:grid-cols-2">
          <RecentForm team={match.team1} matches={history} selfId={match.team1.id} />
          <RecentForm team={match.team2} matches={history} selfId={match.team2.id} />
        </div>
      </section>

      <HeadToHead match={match} history={history} />
      <RankingDelta match={match} />
    </div>
  );
}
