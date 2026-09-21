import Link from "next/link";

import { CountryFlag } from "@/components/shared/country-flag";
import { TeamLogo } from "@/components/teams/team-logo";
import { cn } from "@/lib/utils";
import type { TeamDto } from "@/shared/api/client";

interface TeamCardProps {
  team: TeamDto;
  rank?: number;
}

function rankTone(rank: number) {
  if (rank === 1) return "text-amber-300";
  if (rank === 2) return "text-zinc-300";
  if (rank === 3) return "text-amber-600";
  if (rank <= 5) return "text-[var(--hltv-green)]";
  return "text-zinc-500";
}

/** Compact ranking row — prefer TeamsView table; kept for embeds. */
export function TeamCard({ team, rank }: TeamCardProps) {
  const place = rank ?? team.ranking;
  return (
    <Link
      href={`/teams/${team.slug}`}
      className={cn(
        "hltv-row group flex !grid-cols-none items-center gap-3 !py-3",
        place <= 3 && "bg-[#1a1e14]",
      )}
    >
      <span className={cn("w-10 shrink-0 font-mono text-sm font-bold", rankTone(place))}>
        #{place}
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[#111]">
        <TeamLogo team={team} size="sm" className="h-7 w-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <CountryFlag code={team.country} className="text-[12px]" />
          <span className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
            {team.name}
          </span>
        </span>
        <span className="block truncate text-[10px] text-zinc-600">
          {team.shortName} · {team.region}
        </span>
      </span>
      <span className="shrink-0 font-mono text-[13px] font-bold text-zinc-200">{team.points}</span>
    </Link>
  );
}
