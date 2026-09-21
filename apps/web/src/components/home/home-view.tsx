"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { AdSlot } from "@/components/ads/ad-slot";
import { RankingWidget } from "@/components/home/ranking-widget";
import { MatchRow } from "@/components/matches/match-row";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { formatRelative } from "@/lib/formatters";
import { newsCategoryKey } from "@/lib/news-category";
import { cn } from "@/lib/utils";
import { apiClient, type EventDto, type MatchDto, type NewsDto, type TeamDto } from "@/shared/api/client";

export function HomeView() {
  const { t, locale } = useI18n();
  const [live, setLive] = useState<MatchDto[]>([]);
  const [upcoming, setUpcoming] = useState<MatchDto[]>([]);
  const [finished, setFinished] = useState<MatchDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [articles, setArticles] = useState<NewsDto[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      apiClient.matches("LIVE"),
      apiClient.matches("UPCOMING"),
      apiClient.matches("FINISHED"),
      apiClient.rankingsTeams(),
      apiClient.news(locale),
      apiClient.events(),
    ])
      .then(([l, u, f, r, n, e]) => {
        if (cancelled) return;
        if (l.status === "fulfilled") setLive(l.value.slice(0, 6));
        if (u.status === "fulfilled") setUpcoming(u.value.slice(0, 8));
        if (f.status === "fulfilled") setFinished(f.value.slice(0, 8));
        if (r.status === "fulfilled") setTeams(r.value.slice(0, 8));
        if (n.status === "fulfilled") setArticles(n.value);
        if (e.status === "fulfilled") {
          setEvents(e.value.filter((ev) => ev.status !== "FINISHED").slice(0, 4));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const featured = articles.filter((n) => n.featured);
  const [lead, ...restFeatured] = featured;
  const latest = articles.filter((n) => !n.featured).slice(0, 8);

  if (loading) return <PageSkeleton rows={8} />;

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1320px] px-3 py-3 sm:px-4 lg:px-5">
        <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)_250px] xl:grid-cols-[400px_minmax(0,1fr)_270px]">
          <aside className="min-w-0 space-y-3">
            <section className="hltv-panel">
              <div className="hltv-panel-header">
                <span>{t("matches.live")}</span>
                <Link href="/live" className="text-[10px] text-zinc-400 hover:text-[var(--hltv-green)]">
                  All →
                </Link>
              </div>
              <div className="match-table">
                {live.length ? (
                  live.map((match) => <MatchRow key={match.id} match={match} compact />)
                ) : (
                  <p className="px-3 py-4 text-xs text-zinc-600">{t("live.empty")}</p>
                )}
              </div>
            </section>

            <section className="hltv-panel">
              <div className="hltv-panel-header">
                <span>{t("matches.schedule")}</span>
                <Link href="/matches" className="text-[10px] text-zinc-400 hover:text-[var(--hltv-green)]">
                  All →
                </Link>
              </div>
              <div className="match-table">
                {upcoming.map((match) => (
                  <MatchRow key={match.id} match={match} compact />
                ))}
              </div>
            </section>

            <section className="hltv-panel">
              <div className="hltv-panel-header">
                <span>{t("matches.results")}</span>
                <Link href="/results" className="text-[10px] text-zinc-400 hover:text-[var(--hltv-green)]">
                  All →
                </Link>
              </div>
              <div className="match-table">
                {finished.map((match) => (
                  <MatchRow key={match.id} match={match} compact />
                ))}
              </div>
            </section>
          </aside>

          <section className="min-w-0 space-y-3">
            <AdSlot slot="HOME_TOP" variant="banner" />
            {lead ? (
              <article className="hltv-panel">
                <Link href={`/news/${lead.slug}`} className="group block">
                  <div className="relative aspect-[2.2/1] overflow-hidden bg-[#0f0f0f] sm:aspect-[21/9]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,#2a3318,transparent_55%),radial-gradient(ellipse_at_80%_20%,#2a1518,transparent_50%)]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--hltv-green)]">
                        <span>{t(newsCategoryKey(lead.category))}</span>
                        <span className="text-zinc-600">·</span>
                        <span className="font-mono font-normal tracking-normal text-zinc-500">
                          {formatRelative(lead.publishedAt ?? new Date().toISOString(), locale)}
                        </span>
                      </div>
                      <h1
                        className={cn(
                          "font-display text-[clamp(1.55rem,4vw,3.1rem)] font-bold uppercase leading-[1.05] text-white",
                          "group-hover:text-[var(--hltv-green)]",
                        )}
                      >
                        {lead.title}
                      </h1>
                      <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-zinc-400">{lead.excerpt}</p>
                    </div>
                  </div>
                </Link>
              </article>
            ) : null}

            {restFeatured.map((article) => (
              <article key={article.id} className="hltv-panel border-l-2 border-l-[var(--hltv-green)]">
                <Link href={`/news/${article.slug}`} className="group block p-4 sm:p-5">
                  <h2 className="font-display text-[clamp(1.2rem,2.6vw,1.9rem)] font-bold uppercase text-white group-hover:text-[var(--hltv-green)]">
                    {article.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{article.excerpt}</p>
                </Link>
              </article>
            ))}

            <section className="hltv-panel">
              <div className="hltv-panel-header">
                <span>{t("home.latestArticles")}</span>
                <Link href="/news" className="text-[10px] text-zinc-400 hover:text-[var(--hltv-green)]">
                  All →
                </Link>
              </div>
              <div>
                {latest.map((article, idx) => (
                  <div key={article.id}>
                    <Link
                      href={`/news/${article.slug}`}
                      className="hltv-row group !grid-cols-1 gap-1 py-3"
                    >
                      <div className="min-w-0">
                        <div className="mb-1 text-[10px] font-bold uppercase text-zinc-600">
                          <span className="text-[var(--hltv-green)]">{t(newsCategoryKey(article.category))}</span>
                          <span className="ml-2">{formatRelative(article.publishedAt ?? new Date().toISOString(), locale)}</span>
                        </div>
                        <h3 className="font-display text-[clamp(1rem,1.6vw,1.2rem)] font-bold uppercase text-zinc-100 group-hover:text-[var(--hltv-green)]">
                          {article.title}
                        </h3>
                      </div>
                    </Link>
                    {idx === 1 ? (
                      <div className="border-b border-[var(--border)] px-3 py-2">
                        <AdSlot slot="HOME_FEED" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="hltv-panel">
              <div className="hltv-panel-header">
                <span>{t("home.events")}</span>
                <Link href="/events" className="text-[10px] text-zinc-400 hover:text-[var(--hltv-green)]">
                  All →
                </Link>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="block p-4 hover:bg-[#222]"
                  >
                    <div className="font-display text-sm font-bold uppercase text-white">{event.name}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {event.location} · {event.status} · ${event.prizePool.toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </section>

          <aside className="min-w-0 space-y-3">
            <AdSlot slot="HOME_SIDEBAR" />
            <RankingWidget
              teams={teams.map((team) => ({
                id: team.slug,
                name: team.name,
                shortName: team.shortName,
                logo: team.logo,
                country: team.country,
                ranking: team.ranking,
                region: team.region,
              }))}
              title={t("home.topTeams")}
            />

            <section className="hltv-panel">
              <div className="hltv-panel-header">
                <span>{t("home.quickLinks")}</span>
              </div>
              <div>
                {[
                  { href: "/fantasy", label: t("nav.fantasy") },
                  { href: "/forums", label: t("nav.forums") },
                  { href: "/gallery", label: t("nav.gallery") },
                  { href: "/betting", label: t("nav.betting") },
                  { href: "/streams", label: t("nav.streams") },
                  { href: "/stats", label: t("nav.stats") },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hltv-row !grid-cols-[1fr_auto] text-[11px] font-bold uppercase tracking-wide text-zinc-300 hover:text-[var(--hltv-green)]"
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="text-zinc-600">→</span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}
