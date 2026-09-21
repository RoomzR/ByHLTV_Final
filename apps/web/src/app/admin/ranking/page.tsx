"use client";

import { useEffect, useState } from "react";

import { CmsBackLink } from "@/components/admin/cms-back-link";
import { PageTransition } from "@/components/effects/page-transition";
import { CountryFlag } from "@/components/shared/country-flag";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { TeamLogo } from "@/components/teams/team-logo";
import { RequireCapability } from "@/features/auth/require-capability";
import { useI18n } from "@/i18n/provider";
import { formatRating } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { apiClient, type PlayerDto, type TeamDto } from "@/shared/api/client";

type Tab = "teams" | "players";

export default function AdminRankingPage() {
  return (
    <RequireCapability capability="ranking.manage">
      <RankingInner />
    </RequireCapability>
  );
}

function RankingInner() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("teams");
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [players, setPlayers] = useState<PlayerDto[]>([]);
  const [teamDrafts, setTeamDrafts] = useState<Record<string, { ranking: string; points: string }>>(
    {},
  );
  const [playerDrafts, setPlayerDrafts] = useState<
    Record<string, { ranking: string; rankingPoints: string }>
  >({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [teamRows, playerRows] = await Promise.all([
        apiClient.rankingsTeams(),
        apiClient.rankingsPlayers(),
      ]);
      setTeams(teamRows);
      setPlayers(playerRows);
      setTeamDrafts(
        Object.fromEntries(
          teamRows.map((team) => [
            team.id,
            { ranking: String(team.ranking), points: String(team.points) },
          ]),
        ),
      );
      setPlayerDrafts(
        Object.fromEntries(
          playerRows.map((player) => [
            player.id,
            {
              ranking: String(player.ranking ?? 999),
              rankingPoints: String(player.rankingPoints ?? 0),
            },
          ]),
        ),
      );
    } catch (e) {
      setError((e as { message?: string }).message ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveTeam(id: string) {
    const draft = teamDrafts[id];
    if (!draft) return;
    setSaving(id);
    setMessage("");
    setError("");
    try {
      await apiClient.updateTeamRanking(id, {
        ranking: Number(draft.ranking),
        points: Number(draft.points),
      });
      await load();
      setMessage(t("admin.rankingSaved"));
    } catch (e) {
      setError((e as { message?: string }).message ?? t("common.error"));
    } finally {
      setSaving(null);
    }
  }

  async function savePlayer(id: string) {
    const draft = playerDrafts[id];
    if (!draft) return;
    setSaving(id);
    setMessage("");
    setError("");
    try {
      await apiClient.updatePlayerRanking(id, {
        ranking: Number(draft.ranking),
        rankingPoints: Number(draft.rankingPoints),
      });
      await load();
      setMessage(t("admin.rankingSaved"));
    } catch (e) {
      setError((e as { message?: string }).message ?? t("common.error"));
    } finally {
      setSaving(null);
    }
  }

  async function snapshot(kind: "teams" | "players") {
    setMessage("");
    setError("");
    try {
      if (kind === "teams") await apiClient.snapshotTeamRankings();
      else await apiClient.snapshotPlayerRankings();
      setMessage(t("admin.rankingSnapshotOk"));
    } catch (e) {
      setError((e as { message?: string }).message ?? t("common.error"));
    }
  }

  async function syncFromRating() {
    setMessage("");
    setError("");
    try {
      await apiClient.syncPlayerRankingsFromRating();
      await load();
      setMessage(t("admin.rankingSyncOk"));
    } catch (e) {
      setError((e as { message?: string }).message ?? t("common.error"));
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{t("admin.rankingTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.rankingHint")}</p>
        </div>
        <CmsBackLink />
      </div>

      {error ? <p className="text-rose-400">{error}</p> : null}
      {message ? <p className="text-[var(--hltv-green)]">{message}</p> : null}

      <div className="flex flex-wrap gap-1.5 border-b border-[var(--border)] pb-3">
        {(
          [
            ["teams", "admin.rankingTabTeams"],
            ["players", "admin.rankingTabPlayers"],
          ] as const
        ).map(([id, key]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider",
              tab === id
                ? "border-[var(--hltv-green)] bg-[var(--hltv-green)]/10 text-[var(--hltv-green)]"
                : "border-[var(--border)] text-zinc-500 hover:text-zinc-300",
            )}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {tab === "teams" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => snapshot("teams")}>
              {t("admin.snapshotTeams")}
            </Button>
          </div>

          <section className="hltv-panel">
            <div className="hltv-panel-header">
              <span>{t("admin.rankingTabTeams")}</span>
              <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
                {teams.length}
              </span>
            </div>
            <div className="hidden grid-cols-[minmax(0,1.5fr)_80px_100px_88px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 sm:grid">
              <span>{t("stats.team")}</span>
              <span className="text-right">{t("rankingPage.rank")}</span>
              <span className="text-right">{t("rankingPage.points")}</span>
              <span />
            </div>
            {teams.map((team) => {
              const draft = teamDrafts[team.id] ?? {
                ranking: String(team.ranking),
                points: String(team.points),
              };
              return (
                <div
                  key={team.id}
                  className="hltv-row !grid-cols-1 gap-2 sm:!grid-cols-[minmax(0,1.5fr)_80px_100px_88px] sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <TeamLogo team={team} size="sm" className="h-6 w-6" />
                    <span className="truncate text-[13px] font-semibold text-zinc-100">
                      {team.name}
                    </span>
                  </div>
                  <input
                    className="border border-[var(--border)] bg-[#121212] px-2 py-1.5 text-right font-mono text-sm"
                    value={draft.ranking}
                    onChange={(e) =>
                      setTeamDrafts((d) => ({
                        ...d,
                        [team.id]: { ...draft, ranking: e.target.value },
                      }))
                    }
                  />
                  <input
                    className="border border-[var(--border)] bg-[#121212] px-2 py-1.5 text-right font-mono text-sm"
                    value={draft.points}
                    onChange={(e) =>
                      setTeamDrafts((d) => ({
                        ...d,
                        [team.id]: { ...draft, points: e.target.value },
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving === team.id}
                    onClick={() => saveTeam(team.id)}
                  >
                    {t("common.save")}
                  </Button>
                </div>
              );
            })}
          </section>
        </>
      ) : (
        <>
          <p className="text-[12px] leading-relaxed text-zinc-500">{t("admin.rankingPlayersHint")}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => syncFromRating()}>
              {t("admin.syncFromRating")}
            </Button>
            <Button type="button" variant="outline" onClick={() => snapshot("players")}>
              {t("admin.snapshotPlayers")}
            </Button>
          </div>

          <section className="hltv-panel">
            <div className="hltv-panel-header">
              <span>{t("admin.rankingTabPlayers")}</span>
              <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
                {players.length}
              </span>
            </div>
            <div className="hidden grid-cols-[minmax(0,1.4fr)_72px_88px_64px_88px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 lg:grid">
              <span>{t("stats.player")}</span>
              <span className="text-right">{t("rankingPage.rank")}</span>
              <span className="text-right">{t("rankingPage.points")}</span>
              <span className="text-right">Rating</span>
              <span />
            </div>
            {players.map((player) => {
              const draft = playerDrafts[player.id] ?? {
                ranking: String(player.ranking ?? 999),
                rankingPoints: String(player.rankingPoints ?? 0),
              };
              return (
                <div
                  key={player.id}
                  className="hltv-row !grid-cols-1 gap-2 lg:!grid-cols-[minmax(0,1.4fr)_72px_88px_64px_88px] lg:items-center"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <CountryFlag code={player.country} className="text-[12px]" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-zinc-100">
                        {player.nickname}
                      </span>
                      <span className="block truncate text-[10px] text-zinc-600">
                        {player.team?.name ?? t("players.freeAgent")}
                      </span>
                    </span>
                  </div>
                  <input
                    className="border border-[var(--border)] bg-[#121212] px-2 py-1.5 text-right font-mono text-sm"
                    value={draft.ranking}
                    onChange={(e) =>
                      setPlayerDrafts((d) => ({
                        ...d,
                        [player.id]: { ...draft, ranking: e.target.value },
                      }))
                    }
                  />
                  <input
                    className="border border-[var(--border)] bg-[#121212] px-2 py-1.5 text-right font-mono text-sm"
                    value={draft.rankingPoints}
                    onChange={(e) =>
                      setPlayerDrafts((d) => ({
                        ...d,
                        [player.id]: { ...draft, rankingPoints: e.target.value },
                      }))
                    }
                  />
                  <span className="hidden text-right font-mono text-[12px] text-zinc-400 lg:block">
                    {formatRating(player.rating)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving === player.id}
                    onClick={() => savePlayer(player.id)}
                  >
                    {t("common.save")}
                  </Button>
                </div>
              );
            })}
            {players.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-600">{t("players.empty")}</p>
            ) : null}
          </section>
        </>
      )}
    </PageTransition>
  );
}
