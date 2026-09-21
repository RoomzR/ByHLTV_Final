"use client";

import Link from "next/link";
import { format } from "date-fns";
import { be, enUS, ru } from "date-fns/locale";

import { TeamLogo } from "@/components/teams/team-logo";
import { useI18n } from "@/i18n/provider";
import type { Locale } from "@/i18n/config";
import { mapImageSrc, normalizeMapName } from "@/lib/maps";
import type { MatchDto } from "@/shared/api/client";
import { cn } from "@/lib/utils";

const DATE_LOCALES = { be, ru, en: enUS } as const;

function scoreClass(own: number, opp: number, finished: boolean) {
  if (!finished || own === opp) return "text-zinc-100";
  return own > opp ? "text-[#7dcf4a]" : "text-[#e35d5d]";
}

export function MatchPageHeader({ match }: { match: MatchDto }) {
  const { t, locale } = useI18n();
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const when = new Date(match.scheduledAt);
  const timeStr = format(when, "HH:mm");
  const dateStr =
    locale === "en"
      ? format(when, "do 'of' MMMM yyyy", { locale: enUS })
      : format(when, "d MMMM yyyy", { locale: DATE_LOCALES[locale as Locale] ?? be });

  const bgMap =
    match.activeMapName ||
    match.maps.find((m) => !m.winnerId)?.mapName ||
    match.maps[0]?.mapName ||
    "Mirage";
  const bgSrc = mapImageSrc(normalizeMapName(bgMap));

  return (
    <header className="hltv-panel relative overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgSrc}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.22] saturate-50"
        onError={(e) => {
          e.currentTarget.style.opacity = "0";
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#121212]/40 via-[#1b1b1b]/85 to-[#1b1b1b]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent, transparent 12px, #fff 12px, #fff 13px)",
        }}
      />

      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-6 sm:gap-6 sm:px-8 sm:py-8">
        <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-4">
          <div className="min-w-0 text-right">
            <Link
              href={`/teams/${match.team1.slug}`}
              className="block truncate font-display text-sm font-bold uppercase tracking-wide text-zinc-200 hover:text-[var(--hltv-green)] sm:text-lg"
            >
              {match.team1.name}
            </Link>
            <div className="text-[10px] text-zinc-500">#{match.team1.ranking}</div>
          </div>
          <TeamLogo
            team={match.team1}
            size="lg"
            className="h-12 w-12 border border-white/10 bg-black/30 sm:h-14 sm:w-14"
          />
          <div
            className={cn(
              "font-mono text-4xl font-black tabular-nums drop-shadow sm:text-5xl",
              scoreClass(match.team1Score, match.team2Score, isFinished),
            )}
          >
            {match.team1Score}
          </div>
        </div>

        <div className="min-w-[7.5rem] text-center sm:min-w-[10rem]">
          <div className="font-mono text-lg font-bold text-zinc-100 sm:text-xl">{timeStr}</div>
          <div className="mt-0.5 text-[10px] leading-tight text-zinc-500 sm:text-[11px]">
            {dateStr}
          </div>
          <Link
            href={`/events/${match.event.slug}`}
            className="mt-1.5 block truncate text-[11px] text-zinc-400 hover:text-[var(--hltv-green)]"
          >
            {match.event.name}
          </Link>
        </div>

        <div className="flex min-w-0 items-center justify-start gap-3 sm:gap-4">
          <div
            className={cn(
              "font-mono text-4xl font-black tabular-nums drop-shadow sm:text-5xl",
              scoreClass(match.team2Score, match.team1Score, isFinished),
            )}
          >
            {match.team2Score}
          </div>
          <TeamLogo
            team={match.team2}
            size="lg"
            className="h-12 w-12 border border-white/10 bg-black/30 sm:h-14 sm:w-14"
          />
          <div className="min-w-0 text-left">
            <Link
              href={`/teams/${match.team2.slug}`}
              className="block truncate font-display text-sm font-bold uppercase tracking-wide text-zinc-200 hover:text-[var(--hltv-green)] sm:text-lg"
            >
              {match.team2.name}
            </Link>
            <div className="text-[10px] text-zinc-500">#{match.team2.ranking}</div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "relative border-t border-[var(--border)] px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider",
          isLive
            ? "bg-[#2a1518]/95 text-[var(--hltv-live)]"
            : isFinished
              ? "bg-[#161616]/95 text-zinc-300"
              : "bg-[#161616]/95 text-zinc-400",
        )}
      >
        {isLive ? (
          <span className="inline-flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--hltv-live)] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[var(--hltv-live)]" />
            </span>
            {t("matches.matchLive")}
          </span>
        ) : isFinished ? (
          t("matches.matchOver")
        ) : (
          t("matches.matchUpcoming")
        )}
        {isLive && match.activeMapName
          ? ` · ${match.activeMapName} · R${match.currentRound ?? 0}`
          : null}
        {isLive && match.gsiOnline ? ` · ${t("live.gsiOnline")}` : null}
        {match.streamUrl ? (
          <>
            {" · "}
            <a
              href={match.streamUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--hltv-green)] hover:underline"
            >
              {t("matches.watchStream")}
            </a>
          </>
        ) : null}
      </div>
    </header>
  );
}
