"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageTransition } from "@/components/effects/page-transition";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/skeleton";
import { TeamLogo } from "@/components/teams/team-logo";
import { useI18n } from "@/i18n/provider";
import { formatRating } from "@/lib/formatters";
import { mediaUrl } from "@/lib/media";
import { apiClient, type PlayerDto, type SceneAwardDto } from "@/shared/api/client";

export function PlayerDetailView({ id }: { id: string }) {
  const { t } = useI18n();
  const [player, setPlayer] = useState<PlayerDto | null>(null);
  const [awards, setAwards] = useState<SceneAwardDto[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    apiClient
      .player(id)
      .then(async (p) => {
        setPlayer(p);
        try {
          const list = await apiClient.awards(undefined, undefined, undefined, p.id);
          setAwards(list);
        } catch {
          setAwards([]);
        }
      })
      .catch(() => setFailed(true));
  }, [id]);

  if (failed) notFound();
  if (!player) return <PageSkeleton rows={6} />;

  const team = player.team;
  const stats = [
    { label: "Rating 3.0", value: formatRating(player.rating30 ?? player.rating) },
    { label: "Rating 2.1", value: formatRating(player.rating21 ?? player.rating) },
    { label: "K/D", value: formatRating(player.kd) },
    { label: "ADR", value: player.adr.toFixed(1) },
    { label: "KAST", value: `${(player.kast ?? 0).toFixed(1)}%` },
    { label: "Maps", value: String(player.mapsPlayed) },
  ];

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-center gap-5">
        {mediaUrl(player.photoUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(player.photoUrl)}
            alt={player.nickname}
            className="h-24 w-24 border border-[var(--border)] object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center bg-[#222] font-display text-3xl font-bold text-[var(--hltv-green)]">
            {player.photo}
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold uppercase text-white md:text-4xl">
              {player.nickname}
            </h1>
            <Badge variant="cyan">{player.role}</Badge>
            <Badge>{player.country}</Badge>
            <FavoriteButton playerId={player.id} />
          </div>
          <p className="mt-1 text-zinc-500">{player.realName}</p>
          {player.steamId ? (
            <p className="mt-1 font-mono text-[11px] text-zinc-600">Steam {player.steamId}</p>
          ) : null}
          {team ? (
            <Link
              href={`/teams/${team.slug}`}
              className="mt-3 flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--hltv-green)]"
            >
              <TeamLogo
                team={{
                  id: team.slug,
                  name: team.name,
                  logo: team.logo,
                }}
                size="sm"
              />
              {team.name}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-[var(--border)] bg-[#1b1b1b] p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-zinc-600">{stat.label}</div>
            <div className="mt-1 font-mono text-xl text-[var(--hltv-green)]">{stat.value}</div>
          </div>
        ))}
      </div>

      {awards.length > 0 ? (
        <section className="hltv-panel">
          <div className="hltv-panel-header">
            <span>{t("awards.playerAwards")}</span>
            <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
              {awards.length}
            </span>
          </div>
          {awards.map((a) => (
            <div
              key={a.id}
              className="hltv-row !grid-cols-[auto_minmax(0,1fr)_auto] !gap-2 text-[13px]"
            >
              <span className="font-mono text-[10px] font-bold text-[var(--hltv-green)]">{a.kind}</span>
              <span className="min-w-0 truncate text-zinc-300">
                {a.event ? (
                  <Link href={`/events/${a.event.slug}`} className="hover:text-[var(--hltv-green)]">
                    {a.event.name}
                  </Link>
                ) : a.kind === "TOP20" ? (
                  `Top20 #${a.rank} · ${a.year}`
                ) : (
                  a.year ?? "—"
                )}
                {a.kind === "EVP" && a.rank ? (
                  <span className="ml-2 text-[10px] text-zinc-500">#{a.rank}</span>
                ) : null}
              </span>
              <span className="font-mono text-[11px] text-zinc-500">{a.year ?? ""}</span>
            </div>
          ))}
        </section>
      ) : null}

      {player.history && player.history.length > 0 ? (
        <section className="hltv-panel">
          <div className="hltv-panel-header">
            <span>Team history</span>
          </div>
          {player.history.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2 text-sm"
            >
              <span className="text-zinc-200">{h.team.name}</span>
              <span className="text-xs text-zinc-500">
                {new Date(h.joinedAt).toLocaleDateString()} –{" "}
                {h.leftAt ? new Date(h.leftAt).toLocaleDateString() : "present"}
              </span>
            </div>
          ))}
        </section>
      ) : null}

      {player.matchStats && player.matchStats.length > 0 ? (
        <section className="hltv-panel overflow-x-auto">
          <div className="hltv-panel-header">
            <span>Recent matches</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Match</th>
                <th className="px-3 py-2">Map</th>
                <th className="px-3 py-2">K-D-A</th>
                <th className="px-3 py-2">ADR</th>
                <th className="px-3 py-2">R3.0</th>
              </tr>
            </thead>
            <tbody>
              {player.matchStats.map((s) => (
                <tr key={`${s.match?.id}-${s.mapName}`} className="border-t border-[#2a2a2a]">
                  <td className="px-3 py-2">
                    {s.match ? (
                      <Link href={`/matches/${s.match.slug}`} className="hover:text-[var(--hltv-green)]">
                        {s.match.team1?.shortName} vs {s.match.team2?.shortName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">{s.mapName ?? "—"}</td>
                  <td className="px-3 py-2 font-mono">
                    {s.kills}-{s.deaths}-{s.assists}
                  </td>
                  <td className="px-3 py-2 font-mono">{s.adr.toFixed(1)}</td>
                  <td className="px-3 py-2 font-mono text-[var(--hltv-green)]">
                    {formatRating(s.rating30 ?? s.rating)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {player.mapStats && player.mapStats.length > 0 ? (
        <section className="hltv-panel overflow-x-auto">
          <div className="hltv-panel-header">
            <span>Maps</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Map</th>
                <th className="px-3 py-2">Maps</th>
                <th className="px-3 py-2">K/D</th>
                <th className="px-3 py-2">ADR</th>
                <th className="px-3 py-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {player.mapStats.map((m) => (
                <tr key={m.mapName} className="border-t border-[#2a2a2a]">
                  <td className="px-3 py-2 font-semibold">{m.mapName}</td>
                  <td className="px-3 py-2 font-mono">{m.maps}</td>
                  <td className="px-3 py-2 font-mono">{m.kd.toFixed(2)}</td>
                  <td className="px-3 py-2 font-mono">{m.adr.toFixed(1)}</td>
                  <td className="px-3 py-2 font-mono text-[var(--hltv-green)]">
                    {m.rating.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <p className="text-sm text-zinc-500">
        {player.nickname} — {t("players.profileBio")}
      </p>
    </PageTransition>
  );
}
