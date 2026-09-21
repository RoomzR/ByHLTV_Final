import Link from "next/link";

import { TeamLogo } from "@/components/teams/team-logo";

type RankingTeam = {
  id: string;
  slug?: string;
  name: string;
  shortName: string;
  logo: string;
  country: string;
  ranking: number;
  region: string;
};

interface RankingWidgetProps {
  teams: RankingTeam[];
  title?: string;
}

export function RankingWidget({ teams, title = "World ranking" }: RankingWidgetProps) {
  return (
    <div className="hltv-panel">
      <div className="hltv-panel-header">
        <span>{title}</span>
        <Link href="/ranking" className="text-[10px] font-semibold text-zinc-400 hover:text-[var(--hltv-green)]">
          Full →
        </Link>
      </div>
      <div>
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.slug ?? team.id}`}
            className="hltv-row !grid-cols-[28px_1fr_auto] !gap-2"
          >
            <span
              className={`font-mono text-xs font-bold ${
                team.ranking <= 3 ? "text-[var(--hltv-green)]" : "text-zinc-500"
              }`}
            >
              #{team.ranking}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <TeamLogo team={team} size="sm" />
              <span className="truncate text-[13px] font-semibold text-zinc-100">{team.name}</span>
            </span>
            <span className="font-mono text-[11px] text-zinc-500">{1000 - team.ranking * 70}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
