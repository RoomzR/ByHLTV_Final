"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { TeamLogo } from "@/components/teams/team-logo";
import { getEvent, getTeam } from "@/data/mock";
import { useI18n } from "@/i18n/provider";
import { formatMatchTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Match } from "@/types";

interface MatchCardProps {
  match: Match;
  compact?: boolean;
}

export function MatchCard({ match, compact = false }: MatchCardProps) {
  const { t, locale } = useI18n();
  const team1 = getTeam(match.team1Id);
  const team2 = getTeam(match.team2Id);
  const event = getEvent(match.eventId);
  const liveMap = match.maps.find((m) => !m.winnerId) ?? match.maps.at(-1);

  if (!team1 || !team2) return null;

  const s1 =
    match.status === "live" && liveMap ? liveMap.team1Score : match.team1Score;
  const s2 =
    match.status === "live" && liveMap ? liveMap.team2Score : match.team2Score;

  return (
    <Link href={`/matches/${match.id}`} className="block w-full">
      <article
        className={cn(
          "w-full border-b border-[#2a2a2a] bg-[var(--surface)] px-2.5 py-2.5 transition-colors hover:bg-[#242424]",
          match.status === "live" && "shadow-[inset_3px_0_0_0_var(--hltv-live)]",
        )}
      >
        {!compact ? (
          <div className="mb-1 truncate text-[10px] text-[#7a7a7a]">{event?.name}</div>
        ) : (
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="truncate text-[10px] text-[#7a7a7a]">{event?.name}</span>
            <span className="star-rating shrink-0">{"★".repeat(match.stars)}</span>
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <TeamLogo team={team1} size="sm" />
            <span className="truncate text-[12px] font-semibold text-[#e8e8e8]" title={team1.name}>
              {team1.name}
            </span>
          </div>

          <div className="flex min-w-[52px] flex-col items-center justify-center">
            {match.status === "upcoming" ? (
              <span className="whitespace-nowrap text-[11px] font-bold text-[#9a9a9a]">
                {formatMatchTime(match.scheduledAt, locale)}
              </span>
            ) : (
              <>
                <div
                  className={cn(
                    "font-mono text-[15px] font-bold tabular-nums leading-none",
                    match.status === "live" ? "text-[var(--hltv-live)]" : "text-white",
                  )}
                >
                  {s1} : {s2}
                </div>
                {match.status === "live" ? (
                  <Badge variant="live" className="mt-1 scale-90">
                    LIVE
                  </Badge>
                ) : (
                  <span className="mt-0.5 text-[9px] uppercase text-[#666]">
                    {match.format.toUpperCase()}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex min-w-0 items-center justify-end gap-1.5">
            <span className="truncate text-right text-[12px] font-semibold text-[#e8e8e8]" title={team2.name}>
              {team2.name}
            </span>
            <TeamLogo team={team2} size="sm" />
          </div>
        </div>

        {match.status === "live" && liveMap ? (
          <div className="mt-1.5 text-center text-[10px] text-[#6a6a6a]">{liveMap.map}</div>
        ) : null}
      </article>
    </Link>
  );
}
