"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { CountryFlag } from "@/components/shared/country-flag";
import { TeamLogo } from "@/components/teams/team-logo";
import { useAuth } from "@/features/auth/auth-provider";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { formatRating } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { apiClient, type FantasyEventDto } from "@/shared/api/client";

type Tab = "draft" | "board";

type LeaderRow = {
  id: string;
  name: string;
  points: number;
  user?: { username: string; displayName: string };
};

function formatRole(role: string) {
  if (role === "AWPER") return "AWPer";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function FantasyEventView({ slug }: { slug: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState<FantasyEventDto | null>(null);
  const [board, setBoard] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("draft");
  const [picks, setPicks] = useState<string[]>([]);
  const [name, setName] = useState("My BY Squad");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiClient.fantasyEvent(slug),
      apiClient.fantasyLeaderboard(slug).catch(() => [] as LeaderRow[]),
    ])
      .then(([event, lb]) => {
        if (cancelled) return;
        setData(event);
        setBoard(lb);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const budget = data?.league.budget ?? 100;
  const spent = useMemo(() => {
    if (!data) return 0;
    return picks.reduce((sum, id) => {
      const p = data.players.find((x) => x.id === id);
      return sum + (p?.cost ?? 0);
    }, 0);
  }, [data, picks]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const list = [...data.players].sort((a, b) => b.rating - a.rating);
    if (!q) return list;
    return list.filter(
      (p) =>
        p.nickname.toLowerCase().includes(q) ||
        p.realName.toLowerCase().includes(q) ||
        (p.team?.name ?? "").toLowerCase().includes(q),
    );
  }, [data, query]);

  function toggle(id: string) {
    setMessage(null);
    setError(null);
    setPicks((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }

  async function submit() {
    if (!user) {
      setError(t("fantasyPage.loginRequired"));
      return;
    }
    if (picks.length !== 5) {
      setError(t("fantasyPage.needFive"));
      return;
    }
    if (spent > budget) {
      setError(t("fantasyPage.overBudget"));
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await apiClient.fantasyDraft(slug, { name: name.trim() || "My BY Squad", playerIds: picks });
      setMessage(t("fantasyPage.saved"));
      const lb = await apiClient.fantasyLeaderboard(slug).catch(() => [] as LeaderRow[]);
      setBoard(lb);
    } catch (e) {
      setError((e as { message?: string }).message ?? t("fantasyPage.error"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSkeleton rows={8} />;
  if (!data) {
    return (
      <PageTransition className="mx-auto max-w-[1100px] px-3 py-10 sm:px-4">
        <p className="text-sm text-zinc-500">{t("fantasyPage.notFound")}</p>
        <Link href="/fantasy" className="mt-3 inline-block text-sm text-[var(--hltv-green)]">
          ← {t("fantasyPage.back")}
        </Link>
      </PageTransition>
    );
  }

  const over = spent > budget;

  return (
    <PageTransition className="mx-auto max-w-[1100px] space-y-4 px-3 py-6 sm:px-4 lg:px-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/fantasy"
            className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 hover:text-[var(--hltv-green)]"
          >
            ← {t("fantasyPage.back")}
          </Link>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase text-white">
            {data.league.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            <Link
              href={`/events/${data.league.event.slug}`}
              className="hover:text-[var(--hltv-green)]"
            >
              {data.league.event.name}
            </Link>
          </p>
        </div>

        <div className="text-right">
          <div
            className={cn(
              "font-mono text-xl font-bold",
              over ? "text-[#e35d5d]" : "text-[var(--hltv-green)]",
            )}
          >
            {spent} / {budget}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">
            {picks.length}/5 {t("fantasyPage.picks")}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["draft", "fantasyPage.draft"],
            ["board", "fantasyPage.leaderboard"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              tab === key
                ? "border-[var(--hltv-green)] bg-[var(--hltv-green)]/10 text-[var(--hltv-green)]"
                : "border-[var(--border)] text-zinc-500 hover:text-zinc-300",
            )}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {tab === "draft" ? (
        <>
          <div className="flex flex-col gap-3 border border-[var(--border)] bg-[#161616] p-3 sm:flex-row sm:items-center">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("fantasyPage.squadName")}
              className="w-full border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[var(--hltv-green)] sm:max-w-xs"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("fantasyPage.search")}
              className="w-full border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[var(--hltv-green)] sm:max-w-xs"
            />
            <button
              type="button"
              onClick={() => void submit()}
              disabled={saving || picks.length !== 5 || over}
              className="bg-[var(--hltv-green)] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-black disabled:opacity-40"
            >
              {saving ? t("common.loading") : t("fantasyPage.saveDraft")}
            </button>
          </div>
          {message ? <p className="text-sm text-[var(--hltv-green)]">{message}</p> : null}
          {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}
          {!user ? (
            <p className="text-sm text-zinc-500">
              <Link href="/login" className="text-[var(--hltv-green)] hover:underline">
                {t("nav.login")}
              </Link>{" "}
              {t("fantasyPage.loginHint")}
            </p>
          ) : null}

          <section className="hltv-panel">
            <div className="hltv-panel-header">
              <span>{t("fantasyPage.players")}</span>
              <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
                {filtered.length}
              </span>
            </div>
            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_64px_56px_56px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 lg:grid">
              <span>{t("stats.player")}</span>
              <span>{t("stats.team")}</span>
              <span>{t("players.role")}</span>
              <span className="text-right">Rating</span>
              <span className="text-right">{t("fantasyPage.cost")}</span>
            </div>
            <div>
              {filtered.map((player) => {
                const selected = picks.includes(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => toggle(player.id)}
                    className={cn(
                      "hltv-row group w-full !grid-cols-[minmax(0,1fr)_auto] !gap-2 text-left lg:!grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_64px_56px_56px]",
                      selected && "bg-[rgba(139,180,26,0.08)] shadow-[inset_3px_0_0_0_var(--hltv-green)]",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <CountryFlag code={player.country} className="text-[12px]" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-zinc-100">
                          {player.nickname}
                        </span>
                        <span className="block truncate text-[10px] text-zinc-600 lg:hidden">
                          {player.team?.shortName ?? "—"} · {formatRole(player.role)} · {player.cost}
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
                        <span className="text-[12px] text-zinc-600">—</span>
                      )}
                    </span>
                    <span className="hidden text-[11px] uppercase text-zinc-500 lg:block">
                      {formatRole(player.role)}
                    </span>
                    <span className="hidden text-right font-mono text-[12px] text-zinc-400 lg:block">
                      {formatRating(player.rating)}
                    </span>
                    <span
                      className={cn(
                        "text-right font-mono text-[13px] font-bold",
                        selected ? "text-[var(--hltv-green)]" : "text-zinc-200",
                      )}
                    >
                      {player.cost}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="hltv-panel">
          <div className="hltv-panel-header">
            <span>{t("fantasyPage.leaderboard")}</span>
            <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
              {board.length}
            </span>
          </div>
          <div className="hidden grid-cols-[48px_minmax(0,1.4fr)_minmax(0,1fr)_72px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 sm:grid">
            <span>#</span>
            <span>{t("fantasyPage.squad")}</span>
            <span>{t("fantasyPage.manager")}</span>
            <span className="text-right">{t("fantasyPage.points")}</span>
          </div>
          <div>
            {board.map((row, i) => (
              <div
                key={row.id}
                className="hltv-row !grid-cols-[48px_minmax(0,1fr)_auto] !gap-2 sm:!grid-cols-[48px_minmax(0,1.4fr)_minmax(0,1fr)_72px]"
              >
                <span className="font-mono text-sm font-bold text-zinc-500">#{i + 1}</span>
                <span className="min-w-0 truncate text-[13px] font-semibold text-zinc-100">
                  {row.name}
                </span>
                <span className="hidden truncate text-[12px] text-zinc-400 sm:block">
                  {row.user?.displayName ?? "—"}
                </span>
                <span className="text-right font-mono text-[13px] font-bold text-[var(--hltv-green)]">
                  {row.points}
                </span>
              </div>
            ))}
            {board.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-zinc-600">
                {t("fantasyPage.emptyBoard")}
              </p>
            ) : null}
          </div>
        </section>
      )}
    </PageTransition>
  );
}
