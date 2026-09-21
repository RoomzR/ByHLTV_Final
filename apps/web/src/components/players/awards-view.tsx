"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { CountryFlag } from "@/components/shared/country-flag";
import { TeamLogo } from "@/components/teams/team-logo";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { apiClient, type SceneAwardDto } from "@/shared/api/client";

const KIND_TITLE = {
  MVP: "playersNav.mvps",
  EVP: "playersNav.evps",
  TOP20: "playersNav.top20",
  HALL_OF_FAME: "playersNav.hallOfFame",
} as const;

const KIND_SUB = {
  MVP: "awards.mvpSubtitle",
  EVP: "awards.evpSubtitle",
  TOP20: "awards.top20Subtitle",
  HALL_OF_FAME: "awards.hofSubtitle",
} as const;

function tierClass(tier?: string) {
  if (tier === "S") return "text-amber-300";
  if (tier === "A") return "text-zinc-200";
  if (tier === "B") return "text-amber-700";
  return "text-zinc-500";
}

export function AwardsView({ kind }: { kind: keyof typeof KIND_TITLE }) {
  const { t } = useI18n();
  const [items, setItems] = useState<SceneAwardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    apiClient
      .awards(kind)
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const item of items) {
      if (item.year) set.add(item.year);
    }
    return [...set].sort((a, b) => b - a);
  }, [items]);

  useEffect(() => {
    if (kind === "TOP20" && year === "all" && years[0]) {
      setYear(String(years[0]));
    }
  }, [kind, years, year]);

  const filtered = useMemo(() => {
    if (year === "all") return items;
    return items.filter((i) => i.year === Number(year));
  }, [items, year]);

  const top20Rows = useMemo(() => {
    if (kind !== "TOP20") return null;
    const y = year === "all" ? years[0] : Number(year);
    if (!y) return [];
    const byRank = new Map(
      items.filter((i) => i.year === y).map((i) => [i.rank ?? 0, i]),
    );
    return Array.from({ length: 20 }, (_, i) => ({
      rank: i + 1,
      award: byRank.get(i + 1) ?? null,
    }));
  }, [kind, items, year, years]);

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-white">{t(KIND_TITLE[kind])}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t(KIND_SUB[kind])}</p>
      </div>

      {years.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {kind !== "TOP20" ? (
            <button
              type="button"
              onClick={() => setYear("all")}
              className={cn(
                "border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                year === "all"
                  ? "border-[var(--hltv-green)] bg-[var(--hltv-green)]/10 text-[var(--hltv-green)]"
                  : "border-[var(--border)] text-zinc-500",
              )}
            >
              {t("players.allRoles")}
            </button>
          ) : null}
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(String(y))}
              className={cn(
                "border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                year === String(y)
                  ? "border-[var(--hltv-green)] bg-[var(--hltv-green)]/10 text-[var(--hltv-green)]"
                  : "border-[var(--border)] text-zinc-500",
              )}
            >
              {y}
            </button>
          ))}
        </div>
      ) : null}

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>
            {t(KIND_TITLE[kind])}
            {kind === "TOP20" && year !== "all" ? ` · ${year}` : null}
          </span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {kind === "TOP20" ? top20Rows?.filter((r) => r.award).length ?? 0 : filtered.length}
          </span>
        </div>

        {kind === "TOP20" ? (
          top20Rows && top20Rows.some((r) => r.award) ? (
            <div>
              {top20Rows.map((row) => {
                const player = row.award?.player;
                const photo = mediaUrl(player?.photoUrl ?? null);
                return (
                  <div
                    key={row.rank}
                    className={cn(
                      "hltv-row group !grid-cols-[48px_minmax(0,1fr)_auto] !gap-2",
                      row.rank <= 3 && row.award && "bg-[#1a1e14]",
                    )}
                  >
                    <span className="font-mono text-sm font-bold text-zinc-500">#{row.rank}</span>
                    {player ? (
                      <Link
                        href={`/players/${player.slug}`}
                        className="flex min-w-0 items-center gap-2.5"
                      >
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
                            {player.team?.name ?? t("players.freeAgent")}
                          </span>
                        </span>
                      </Link>
                    ) : (
                      <span className="text-[13px] text-zinc-600">{t("awards.slotEmpty")}</span>
                    )}
                    <span className="flex items-center gap-2">
                      {player?.team ? (
                        <TeamLogo team={player.team} size="sm" className="h-5 w-5" />
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-10 text-center text-sm text-zinc-600">{t("awards.top20Empty")}</p>
          )
        ) : filtered.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-zinc-600">{t("awards.empty")}</p>
        ) : (
          <div>
            {filtered.map((item) => {
              const player = item.player;
              const photo = mediaUrl(player?.photoUrl ?? null);
              return (
                <div
                  key={item.id}
                  className="hltv-row group !grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] !gap-2"
                >
                  <Link
                    href={player ? `/players/${player.slug}` : "#"}
                    className="flex min-w-0 items-center gap-2.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[#111]">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="" className="h-full w-full object-cover object-top" />
                      ) : (
                        <span className="font-display text-[10px] font-bold text-zinc-500">
                          {(player?.nickname ?? "?").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        {player ? <CountryFlag code={player.country} className="text-[12px]" /> : null}
                        {kind === "EVP" && item.rank ? (
                          <span className="font-mono text-[10px] text-zinc-500">#{item.rank}</span>
                        ) : null}
                        <span className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                          {player?.nickname ?? "—"}
                        </span>
                      </span>
                      <span className="block truncate text-[10px] text-zinc-600">
                        {player?.team?.name ?? t("players.freeAgent")}
                      </span>
                    </span>
                  </Link>

                  <span className="min-w-0">
                    {item.event ? (
                      <Link
                        href={`/events/${item.event.slug}`}
                        className="block truncate text-[12px] text-zinc-300 hover:text-[var(--hltv-green)]"
                      >
                        <span className={cn("mr-1.5 font-mono text-[10px]", tierClass(item.event.tier))}>
                          {item.event.tier}
                        </span>
                        {item.event.name}
                      </Link>
                    ) : (
                      <span className="text-[12px] text-zinc-600">—</span>
                    )}
                    {item.note ? (
                      <span className="mt-0.5 block truncate text-[10px] text-zinc-600">{item.note}</span>
                    ) : null}
                  </span>

                  <span className="font-mono text-[12px] text-zinc-500">{item.year ?? "—"}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
