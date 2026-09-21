"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { EventLogo } from "@/components/events/event-logo";
import { PageTransition } from "@/components/effects/page-transition";
import { MatchRow } from "@/components/matches/match-row";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { formatPrize } from "@/lib/formatters";
import { mediaUrl } from "@/lib/media";
import { apiClient, type EventDto, type MatchDto, type SceneAwardDto } from "@/shared/api/client";
import { TeamLogo } from "@/components/teams/team-logo";

type BracketNode = {
  id: string;
  round: string;
  position: number;
  match?: MatchDto | null;
};

export function EventDetailView({ id }: { id: string }) {
  const { t } = useI18n();
  const [event, setEvent] = useState<EventDto | null>(null);
  const [brackets, setBrackets] = useState<BracketNode[]>([]);
  const [awards, setAwards] = useState<SceneAwardDto[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiClient
      .event(id)
      .then(async (ev) => {
        if (cancelled) return;
        setEvent(ev);
        try {
          const [b, a] = await Promise.all([
            apiClient.eventBrackets(id).catch(() => [] as BracketNode[]),
            apiClient.awards(undefined, undefined, ev.id).catch(() => [] as SceneAwardDto[]),
          ]);
          if (!cancelled) {
            setBrackets(b as BracketNode[]);
            setAwards(a);
          }
        } catch {
          if (!cancelled) {
            setBrackets([]);
            setAwards([]);
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setError((e as { message?: string }).message ?? "Not found");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const byRound = useMemo(() => {
    const map = new Map<string, BracketNode[]>();
    for (const node of brackets) {
      const list = map.get(node.round) ?? [];
      list.push(node);
      map.set(node.round, list);
    }
    return [...map.entries()];
  }, [brackets]);

  if (error) return <div className="p-10 text-center text-rose-400">{error}</div>;
  if (!event) return <PageSkeleton rows={6} />;

  const eventMatches = event.matches ?? [];
  const cover = mediaUrl(event.coverImage);

  return (
    <PageTransition className="space-y-8">
      <header className="overflow-hidden border border-[var(--border)] bg-[#1b1f23]">
        <div className="relative h-48 overflow-hidden bg-[#12151a] sm:h-56 md:h-64">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a1a] via-[#12151a] to-[#0a0c0e]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b1f23] via-[#1b1f23]/40 to-transparent" />
        </div>

        <div className="relative -mt-12 flex flex-col gap-4 px-4 pb-5 sm:-mt-14 sm:flex-row sm:items-end sm:px-6 sm:pb-6">
          <EventLogo
            logo={event.logo}
            name={event.name}
            size="xl"
            className="border-2 border-[var(--border)] shadow-lg shadow-black/40"
          />
          <div className="min-w-0 flex-1 space-y-2 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{event.name}</h1>
              <Badge variant="gold">Tier {event.tier}</Badge>
              <Badge variant={event.status === "ONGOING" ? "live" : "default"}>
                {event.status === "ONGOING"
                  ? t("events.status.ongoing")
                  : event.status === "FINISHED"
                    ? t("events.status.finished")
                    : t("events.status.upcoming")}
              </Badge>
            </div>
            <p className="text-sm text-zinc-400">
              {event.location} · {formatPrize(event.prizePool)} · {event.teamsCount}{" "}
              {t("events.teams")}
            </p>
          </div>
        </div>
      </header>

      {awards.length > 0 ? (
        <section className="hltv-panel">
          <div className="hltv-panel-header">
            <span>{t("awards.eventAwards")}</span>
          </div>
          {awards
            .slice()
            .sort((a, b) => {
              if (a.kind === "MVP") return -1;
              if (b.kind === "MVP") return 1;
              return (a.rank ?? 99) - (b.rank ?? 99);
            })
            .map((a) => (
              <div
                key={a.id}
                className="hltv-row !grid-cols-[64px_minmax(0,1fr)] !gap-2 text-[13px]"
              >
                <span className="font-mono text-[10px] font-bold text-[var(--hltv-green)]">
                  {a.kind}
                  {a.kind === "EVP" && a.rank ? ` #${a.rank}` : ""}
                </span>
                {a.player ? (
                  <Link
                    href={`/players/${a.player.slug}`}
                    className="truncate font-semibold text-zinc-100 hover:text-[var(--hltv-green)]"
                  >
                    {a.player.nickname}
                  </Link>
                ) : (
                  <span>—</span>
                )}
              </div>
            ))}
        </section>
      ) : null}

      {byRound.length > 0 ? (
        <section>
          <SectionHeader title="Brackets" />
          <div className="space-y-4">
            {byRound.map(([round, nodes]) => (
              <div key={round}>
                <h3 className="mb-2 text-xs uppercase tracking-wider text-zinc-500">{round}</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {nodes
                    .sort((a, b) => a.position - b.position)
                    .map((node) =>
                      node.match ? (
                        <MatchRow key={node.id} match={node.match} compact />
                      ) : (
                        <div
                          key={node.id}
                          className="border border-[var(--border)] bg-[#1b1b1b] p-3 text-xs text-zinc-600"
                        >
                          TBD · pos {node.position}
                        </div>
                      ),
                    )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeader titleKey="events.tournamentMatches" />
        <div className="space-y-3">
          {eventMatches.length > 0 ? (
            eventMatches.map((match) => <MatchRow key={match.id} match={match} />)
          ) : (
            <p className="text-sm text-zinc-500">{t("events.noMatches")}</p>
          )}
        </div>
      </section>

      {event.teams && event.teams.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-xl text-white">{t("events.teams")}</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {event.teams.map((et) => (
              <Link
                key={et.team.id}
                href={`/teams/${et.team.slug}`}
                className="flex items-center gap-2 border border-[var(--border)] bg-[#1b1b1b] px-3 py-2 text-sm hover:border-zinc-500"
              >
                <TeamLogo team={et.team} size="sm" />
                <span className="text-zinc-200">{et.team.name}</span>
                {et.seed != null ? (
                  <span className="ml-auto text-xs text-zinc-600">#{et.seed}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </PageTransition>
  );
}
