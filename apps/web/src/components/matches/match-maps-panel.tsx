"use client";

import { TeamLogo } from "@/components/teams/team-logo";
import { useI18n } from "@/i18n/provider";
import { mapBannerColor } from "@/lib/map-colors";
import { mapFallbackSrc, mapImageSrc, normalizeMapName } from "@/lib/maps";
import type { MatchDto } from "@/shared/api/client";
import { cn } from "@/lib/utils";

function normalizeAction(action: string): "ban" | "pick" | "leftover" {
  const a = action.toLowerCase();
  if (a === "removed" || a === "remove" || a === "ban") return "ban";
  if (a === "picked" || a === "pick") return "pick";
  return "leftover";
}

function halfScores(
  match: MatchDto,
  mapIndex: number,
): { first: string; second: string } | null {
  const rounds = (match.rounds ?? []).filter((r) => r.mapNumber === mapIndex);
  if (rounds.length < 2) return null;
  const half = Math.ceil(rounds.length / 2);
  const mid = rounds[half - 1];
  const last = rounds[rounds.length - 1];
  if (!mid || !last) return null;
  const h1t1 = mid.team1Score;
  const h1t2 = mid.team2Score;
  const h2t1 = Math.max(0, last.team1Score - h1t1);
  const h2t2 = Math.max(0, last.team2Score - h1t2);
  return {
    first: `${h1t1}:${h1t2}`,
    second: `${h2t1}:${h2t2}`,
  };
}

export function MatchMapsPanel({ match }: { match: MatchDto }) {
  const { t } = useI18n();
  const vetos = [...(match.vetos ?? [])].sort((a, b) => a.order - b.order);
  const pickByMap = new Map<string, string>();
  for (const v of vetos) {
    if (normalizeAction(v.action) === "pick" && v.teamId) {
      pickByMap.set(normalizeMapName(v.mapName).toLowerCase(), v.teamId);
    }
  }

  const teamName = (id?: string | null) => {
    if (!id) return "";
    if (id === match.team1.id) return match.team1.name;
    if (id === match.team2.id) return match.team2.name;
    return "Team";
  };

  const formatLabel = match.format?.toUpperCase() ?? "BO3";
  const bracketLabel = match.bracket?.round ? `* ${match.bracket.round}` : null;

  return (
    <section className="hltv-panel overflow-hidden">
      <div className="hltv-panel-header">
        <span>{t("matches.maps")}</span>
        <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
          {match.format}
        </span>
      </div>

      <div className="border-b border-[var(--border)] px-3 py-2.5 text-[12px] text-zinc-400">
        <span className="font-semibold text-zinc-200">
          Best of {formatLabel.replace(/\D/g, "") || "3"}
        </span>
        <span className="text-zinc-600"> (Online)</span>
        {bracketLabel ? <div className="mt-0.5 italic text-zinc-500">{bracketLabel}</div> : null}
      </div>

      {vetos.length > 0 ? (
        <ol className="space-y-0.5 border-b border-[var(--border)] bg-[#161616] px-3 py-2.5 text-[12px] leading-relaxed text-zinc-400">
          {vetos.map((v) => {
            const action = normalizeAction(v.action);
            const map = normalizeMapName(v.mapName);
            const who = teamName(v.teamId);
            let line = "";
            if (action === "ban") line = `${who} removed ${map}`;
            else if (action === "pick") line = `${who} picked ${map}`;
            else line = `${map} was left over`;
            return (
              <li key={`${v.order}-${v.mapName}`} className="flex gap-1.5">
                <span className="w-4 shrink-0 tabular-nums text-zinc-600">{v.order}.</span>
                <span
                  className={cn(
                    action === "ban" && "text-zinc-500",
                    action === "pick" && "text-zinc-200",
                    action === "leftover" && "text-amber-200/90",
                  )}
                >
                  {line}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}

      <div className="space-y-2 p-2">
        {match.maps.map((map, i) => {
          const name = normalizeMapName(map.mapName);
          const played = map.team1Score > 0 || map.team2Score > 0 || !!map.winnerId;
          const notNeeded =
            match.status === "FINISHED" && !played && match.team1Score !== match.team2Score;
          const pickerId = pickByMap.get(name.toLowerCase());
          const halves = halfScores(match, i + 1);
          const t1Win =
            (map.winnerId ?? null) === match.team1.id || map.team1Score > map.team2Score;
          const t2Win =
            (map.winnerId ?? null) === match.team2.id || map.team2Score > map.team1Score;
          const photo = mapImageSrc(name);
          const fallback = mapFallbackSrc(name);

          return (
            <article
              key={`${map.mapName}-${i}`}
              className={cn(
                "relative min-h-[88px] overflow-hidden border border-[var(--border)]",
                notNeeded && "opacity-70",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt=""
                className="absolute inset-0 h-full w-full scale-105 object-cover object-center brightness-[0.55] contrast-[1.05] saturate-[0.75]"
                onError={(e) => {
                  const el = e.currentTarget;
                  if (el.src.endsWith(".svg")) {
                    el.style.opacity = "0";
                    return;
                  }
                  el.src = fallback;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/70" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.35)_100%)]" />

              <div
                className="relative px-3 py-1 text-center text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-sm"
                style={{ backgroundColor: mapBannerColor(name) }}
              >
                {name}
              </div>

              <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3.5 sm:px-4">
                <div className="flex items-center justify-end gap-2.5">
                  <div className="text-right">
                    {pickerId === match.team1.id ? (
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[var(--hltv-green)] drop-shadow">
                        {t("matches.pickBadge")}
                      </span>
                    ) : null}
                    <TeamLogo
                      team={match.team1}
                      size="sm"
                      className="ml-auto h-8 w-8 border border-white/10 bg-black/40"
                    />
                  </div>
                  <span
                    className={cn(
                      "min-w-[1.5rem] text-right font-mono text-3xl font-black tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
                      notNeeded || !played
                        ? "text-zinc-500"
                        : t1Win && played
                          ? "text-[#7dcf4a]"
                          : "text-[#e35d5d]",
                    )}
                  >
                    {notNeeded ? "" : map.team1Score}
                  </span>
                </div>

                <div className="min-w-[4.75rem] text-center">
                  {played && !notNeeded ? (
                    <>
                      <span className="inline-block border border-white/15 bg-black/50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-200 backdrop-blur-sm">
                        {t("matches.stats")}
                      </span>
                      {halves ? (
                        <div className="mt-1.5 font-mono text-[10px] text-zinc-300/90 drop-shadow">
                          ({halves.first}; {halves.second})
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400 drop-shadow">
                      {notNeeded ? t("matches.mapNotNeeded") : "—"}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-start gap-2.5">
                  <span
                    className={cn(
                      "min-w-[1.5rem] text-left font-mono text-3xl font-black tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
                      notNeeded || !played
                        ? "text-zinc-500"
                        : t2Win && played
                          ? "text-[#7dcf4a]"
                          : "text-[#e35d5d]",
                    )}
                  >
                    {notNeeded ? "" : map.team2Score}
                  </span>
                  <div className="text-left">
                    {pickerId === match.team2.id ? (
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[var(--hltv-green)] drop-shadow">
                        {t("matches.pickBadge")}
                      </span>
                    ) : null}
                    <TeamLogo
                      team={match.team2}
                      size="sm"
                      className="h-8 w-8 border border-white/10 bg-black/40"
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {match.maps.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-zinc-600">{t("matches.noMapsYet")}</p>
        ) : null}
      </div>
    </section>
  );
}
