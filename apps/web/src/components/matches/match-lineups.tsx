"use client";

import Link from "next/link";

import { CountryFlag } from "@/components/shared/country-flag";
import { TeamLogo } from "@/components/teams/team-logo";
import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import type { MatchDto, PlayerDto, TeamDto } from "@/shared/api/client";

function LineupCard({ player }: { player: PlayerDto }) {
  const photo = mediaUrl(player.photoUrl ?? (player.photo?.startsWith("/") ? player.photo : null));
  return (
    <Link
      href={`/players/${player.slug}`}
      className="flex flex-col overflow-hidden border border-[var(--border)] bg-[#1b1f23] hover:border-zinc-500"
    >
      <div className="relative flex h-28 items-end justify-center bg-[#252a30] sm:h-32">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={player.nickname} className="h-full w-full object-cover object-top" />
        ) : (
          <div className="mb-2 flex h-20 w-16 items-end justify-center bg-[#3a4048]">
            <svg viewBox="0 0 40 48" className="h-16 w-12 text-[#5a626c]" fill="currentColor">
              <circle cx="20" cy="12" r="8" />
              <path d="M4 48c0-10 7-16 16-16s16 6 16 16" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-1.5 px-1 py-2 text-[11px] font-semibold text-zinc-200">
        <CountryFlag code={player.country} />
        <span className="truncate">{player.nickname}</span>
      </div>
    </Link>
  );
}

function TeamLineup({ team }: { team: TeamDto }) {
  const { t } = useI18n();
  const players = (team.players ?? []).slice(0, 5);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 border border-[var(--border)] bg-[#16191c] px-3 py-2">
        <div className="flex items-center gap-2">
          <TeamLogo team={team} size="sm" />
          <span className="text-[12px] font-semibold uppercase tracking-wide text-zinc-200">
            {team.name}
          </span>
        </div>
        <span className="text-[11px] text-zinc-500">
          {t("matches.worldRank")} #{team.ranking}
        </span>
      </div>
      {players.length ? (
        <div className="grid grid-cols-5 gap-1.5">
          {players.map((p) => (
            <LineupCard key={p.id} player={p} />
          ))}
        </div>
      ) : (
        <p className="border border-[var(--border)] px-3 py-4 text-center text-xs text-zinc-600">
          {t("teams.rosterEmpty")}
        </p>
      )}
    </div>
  );
}

export function MatchLineups({ match }: { match: MatchDto }) {
  const { t } = useI18n();
  return (
    <section className="space-y-3">
      <div className="border border-[var(--border)] bg-[#16191c] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
        {t("matches.lineups")}
      </div>
      <TeamLineup team={match.team1} />
      <TeamLineup team={match.team2} />
    </section>
  );
}
