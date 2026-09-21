"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { formatRating } from "@/lib/formatters";
import { apiClient, type PlayerDto, type TeamDto } from "@/shared/api/client";

export function StatsView() {
  const { t } = useI18n();
  const [players, setPlayers] = useState<PlayerDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiClient.statsLeaderboards("rating"), apiClient.rankingsTeams()])
      .then(([p, teamsList]) => {
        setPlayers(p);
        setTeams(teamsList);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <PageTransition className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white md:text-4xl">{t("stats.title")}</h1>
        <p className="mt-2 text-zinc-500">{t("stats.subtitle")}</p>
      </div>

      <section className="hltv-panel overflow-x-auto">
        <div className="hltv-panel-header">
          <span>{t("stats.topPlayers")}</span>
        </div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">{t("stats.player")}</th>
              <th className="px-4 py-3">{t("stats.team")}</th>
              <th className="px-4 py-3">R3.0</th>
              <th className="px-4 py-3">R2.1</th>
              <th className="px-4 py-3">K/D</th>
              <th className="px-4 py-3">ADR</th>
              <th className="px-4 py-3">KAST</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player.id} className="border-t border-[#2a2a2a]">
                <td className="px-4 py-3 font-mono text-zinc-500">{index + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/players/${player.slug}`} className="font-medium hover:text-[var(--hltv-green)]">
                    {player.nickname}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-400">{player.team?.shortName ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-[var(--hltv-green)]">
                  {formatRating(player.rating30 ?? player.rating)}
                </td>
                <td className="px-4 py-3 font-mono">{formatRating(player.rating21 ?? player.rating)}</td>
                <td className="px-4 py-3 font-mono">{formatRating(player.kd)}</td>
                <td className="px-4 py-3 font-mono">{player.adr.toFixed(1)}</td>
                <td className="px-4 py-3 font-mono">{(player.kast ?? 0).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="hltv-panel overflow-x-auto">
        <div className="hltv-panel-header">
          <span>{t("stats.topTeams")}</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-t border-[#2a2a2a]">
                <td className="px-4 py-3 font-mono text-zinc-500">{team.ranking}</td>
                <td className="px-4 py-3">
                  <Link href={`/teams/${team.slug}`} className="hover:text-[var(--hltv-green)]">
                    {team.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PageTransition>
  );
}
