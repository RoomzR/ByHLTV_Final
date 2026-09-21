import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TeamLogo } from "@/components/teams/team-logo";
import { getTeam } from "@/data/mock";
import { formatRating } from "@/lib/formatters";
import type { Player } from "@/types";

interface PlayerCardProps {
  player: Player;
  rank?: number;
}

export function PlayerCard({ player, rank }: PlayerCardProps) {
  const team = player.teamId ? getTeam(player.teamId) : undefined;

  return (
    <Link href={`/players/${player.id}`} className="block h-full">
      <Card glow className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 font-display text-lg font-bold text-cyan-300 shadow-inner">
              {player.photo}
            </div>
            <div>
              <div className="font-display text-lg font-semibold text-white">
                {rank ? (
                  <span className="mr-2 text-zinc-600">#{rank}</span>
                ) : null}
                {player.nickname}
              </div>
              <div className="text-xs text-zinc-500">{player.realName}</div>
            </div>
          </div>
          <Badge variant="cyan">{player.role}</Badge>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-zinc-950/70 p-2">
            <div className="text-[10px] uppercase text-zinc-600">Rating</div>
            <div className="font-mono text-sm text-cyan-300">
              {formatRating(player.rating)}
            </div>
          </div>
          <div className="rounded-xl bg-zinc-950/70 p-2">
            <div className="text-[10px] uppercase text-zinc-600">K/D</div>
            <div className="font-mono text-sm">{formatRating(player.kd)}</div>
          </div>
          <div className="rounded-xl bg-zinc-950/70 p-2">
            <div className="text-[10px] uppercase text-zinc-600">ADR</div>
            <div className="font-mono text-sm">{player.adr.toFixed(1)}</div>
          </div>
        </div>

        {team ? (
          <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
            <TeamLogo team={team} size="sm" />
            {team.name}
          </div>
        ) : null}
      </Card>
    </Link>
  );
}
