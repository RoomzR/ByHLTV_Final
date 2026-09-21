"use client";

import { MapThumb } from "@/components/matches/map-thumb";
import type { MatchDto } from "@/shared/api/client";
import { useI18n } from "@/i18n/provider";

function normalizeAction(action: string): "ban" | "pick" | "leftover" {
  const a = action.toLowerCase();
  if (a === "removed" || a === "remove" || a === "ban") return "ban";
  if (a === "picked" || a === "pick") return "pick";
  return "leftover";
}

export function MapVetoBoard({ match }: { match: MatchDto }) {
  const { t } = useI18n();
  const vetos = [...(match.vetos ?? [])].sort((a, b) => a.order - b.order);
  if (!vetos.length) return null;

  const teamName = (teamId?: string | null) => {
    if (!teamId) return "—";
    if (teamId === match.team1.id) return match.team1.name;
    if (teamId === match.team2.id) return match.team2.name;
    return "Team";
  };

  return (
    <section className="hltv-panel overflow-hidden">
      <div className="hltv-panel-header flex items-center justify-between gap-2">
        <span>{t("matches.mapVeto")}</span>
        <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
          {match.format}
        </span>
      </div>

      <div className="grid gap-0 border-b border-[var(--border)] sm:grid-cols-2">
        <div className="px-4 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-zinc-400 sm:border-r sm:border-[var(--border)]">
          {match.team1.name}
        </div>
        <div className="hidden px-4 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-zinc-400 sm:block">
          {match.team2.name}
        </div>
      </div>

      <ul className="divide-y divide-[var(--border)]">
        {vetos.map((v) => {
          const action = normalizeAction(v.action);
          const isT1 = v.teamId === match.team1.id;
          const isT2 = v.teamId === match.team2.id;
          const label =
            action === "ban"
              ? t("matches.vetoBan")
              : action === "pick"
                ? t("matches.vetoPick")
                : t("matches.vetoLeftover");
          const tone =
            action === "ban"
              ? "text-rose-400"
              : action === "pick"
                ? "text-[var(--hltv-green)]"
                : "text-amber-300";

          return (
            <li
              key={`${v.order}-${v.mapName}-${v.action}`}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-3"
            >
              <div className={`flex justify-end ${isT1 || action === "leftover" ? "" : "opacity-25"}`}>
                {isT1 || (action === "leftover" && !isT2) ? (
                  <MapThumb
                    mapName={v.mapName}
                    size="sm"
                    dimmed={action === "ban"}
                    badge={label}
                  />
                ) : (
                  <span className="text-zinc-700">·</span>
                )}
              </div>
              <div className="flex min-w-[6.5rem] flex-col items-center justify-center text-center">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${tone}`}>
                  {label}
                </span>
                <span className="text-[10px] text-zinc-600">
                  #{v.order}
                  {action !== "leftover" ? ` · ${teamName(v.teamId)}` : ""}
                </span>
              </div>
              <div className={`flex justify-start ${isT2 ? "" : "opacity-25"}`}>
                {isT2 ? (
                  <MapThumb
                    mapName={v.mapName}
                    size="sm"
                    dimmed={action === "ban"}
                    badge={label}
                  />
                ) : (
                  <span className="text-zinc-700">·</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
