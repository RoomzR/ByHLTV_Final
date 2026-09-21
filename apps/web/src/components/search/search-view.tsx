"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Newspaper,
  Search as SearchIcon,
  Swords,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

import { PageTransition } from "@/components/effects/page-transition";
import { TeamLogo } from "@/components/teams/team-logo";
import { useI18n } from "@/i18n/provider";
import { apiClient, type SearchResultDto } from "@/shared/api/client";
import { cn } from "@/lib/utils";

type NewsHit = {
  title?: string;
  excerpt?: string;
  article?: { slug?: string; category?: string };
};

export function SearchView() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [result, setResult] = useState<SearchResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const next = q.trim();
    const url = next ? `/search?q=${encodeURIComponent(next)}` : "/search";
    router.replace(url, { scroll: false });
  }, [q, router]);

  useEffect(() => {
    if (!q.trim()) {
      setResult(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = setTimeout(() => {
      apiClient
        .search(q)
        .then(setResult)
        .catch(() => setResult({ teams: [], players: [], news: [], events: [], matches: [] }))
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(id);
  }, [q]);

  const newsHits = (result?.news ?? []) as NewsHit[];
  const total = useMemo(() => {
    if (!result) return 0;
    return (
      result.teams.length +
      result.players.length +
      result.events.length +
      result.matches.length +
      newsHits.length
    );
  }, [result, newsHits.length]);

  return (
    <PageTransition className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(139,180,26,0.16),transparent_60%)]" />
      <div className="relative mx-auto max-w-4xl px-3 py-10 sm:px-4 lg:px-5">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--hltv-green)]">
          {t("search.eyebrow")}
        </div>
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl">
          {t("search.title")}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-500">{t("search.subtitle")}</p>

        <div className="mt-8 border border-[var(--border)] bg-[#161616] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <label className="flex items-center gap-3 px-3 py-2">
            <SearchIcon className="size-5 shrink-0 text-[var(--hltv-green)]" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full bg-transparent text-base text-white outline-none placeholder:text-zinc-600"
              autoComplete="off"
              spellCheck={false}
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                className="rounded-sm p-1 text-zinc-500 transition-colors hover:bg-[#222] hover:text-white"
                aria-label={t("search.clear")}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <div className="flex flex-wrap gap-2 border-t border-[var(--border)] px-3 py-2.5">
            {[t("nav.teams"), t("nav.players"), t("nav.events"), t("nav.news"), t("nav.matches")].map(
              (chip) => (
                <span
                  key={chip}
                  className="border border-[var(--border)] bg-[#121212] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500"
                >
                  {chip}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
          <span>
            {loading
              ? t("common.loading")
              : q.trim()
                ? t("search.found").replace("{n}", String(total))
                : t("search.hint")}
          </span>
          <span className="font-mono uppercase tracking-wide text-zinc-600">{locale}</span>
        </div>

        <AnimatePresence mode="wait">
          {!q.trim() ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-10 grid gap-3 sm:grid-cols-3"
            >
              {[
                { icon: Trophy, title: t("nav.teams"), text: t("search.tipTeams") },
                { icon: UserRound, title: t("nav.players"), text: t("search.tipPlayers") },
                { icon: Newspaper, title: t("nav.news"), text: t("search.tipNews") },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-[var(--border)] bg-[#151515] p-4"
                >
                  <item.icon className="size-5 text-[var(--hltv-green)]" />
                  <div className="mt-3 font-semibold text-white">{item.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.text}</p>
                </div>
              ))}
            </motion.div>
          ) : result && total === 0 && !loading ? (
            <motion.p
              key="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12 text-center text-sm text-zinc-500"
            >
              {t("search.empty")}
            </motion.p>
          ) : result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-6"
            >
              <ResultGroup
                title={t("nav.teams")}
                icon={Trophy}
                count={result.teams.length}
              >
                {result.teams.map((team) => (
                  <ResultLink key={team.id} href={`/teams/${team.slug}`}>
                    <TeamLogo
                      team={{ id: team.slug, name: team.name, logo: team.logo }}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-white">{team.name}</span>
                      <span className="text-[11px] text-zinc-500">
                        #{team.ranking} · {team.country}
                      </span>
                    </span>
                  </ResultLink>
                ))}
              </ResultGroup>

              <ResultGroup
                title={t("nav.players")}
                icon={UserRound}
                count={result.players.length}
              >
                {result.players.map((p) => (
                  <ResultLink key={p.id} href={`/players/${p.slug}`}>
                    <span className="flex h-8 w-8 items-center justify-center bg-[#222] font-display text-xs font-bold text-[var(--hltv-green)]">
                      {p.nickname.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-white">{p.nickname}</span>
                      <span className="text-[11px] text-zinc-500">
                        {p.realName}
                        {p.team ? ` · ${p.team.name}` : ""}
                      </span>
                    </span>
                  </ResultLink>
                ))}
              </ResultGroup>

              <ResultGroup
                title={t("nav.events")}
                icon={CalendarDays}
                count={result.events.length}
              >
                {result.events.map((e) => (
                  <ResultLink key={e.id} href={`/events/${e.slug}`}>
                    <span className="flex h-8 w-8 items-center justify-center bg-[#222] text-[10px] font-bold text-zinc-300">
                      {e.tier}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-white">{e.name}</span>
                      <span className="text-[11px] text-zinc-500">
                        {e.location} · {e.status}
                      </span>
                    </span>
                  </ResultLink>
                ))}
              </ResultGroup>

              <ResultGroup
                title={t("nav.matches")}
                icon={Swords}
                count={result.matches.length}
              >
                {result.matches.map((m) => (
                  <ResultLink key={m.id} href={`/matches/${m.slug}`}>
                    <span className="min-w-0 flex-1 font-semibold text-white">
                      {m.team1?.name ?? "TBD"} vs {m.team2?.name ?? "TBD"}
                    </span>
                    <span className="text-[11px] uppercase text-zinc-500">{m.status}</span>
                  </ResultLink>
                ))}
              </ResultGroup>

              <ResultGroup title={t("nav.news")} icon={Newspaper} count={newsHits.length}>
                {newsHits.map((n, i) => {
                  const slug = n.article?.slug;
                  if (!slug) return null;
                  return (
                    <ResultLink key={`${slug}-${i}`} href={`/news/${slug}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-white">
                          {n.title ?? slug}
                        </span>
                        {n.excerpt ? (
                          <span className="line-clamp-1 text-[11px] text-zinc-500">{n.excerpt}</span>
                        ) : null}
                      </span>
                    </ResultLink>
                  );
                })}
              </ResultGroup>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

function ResultGroup({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: typeof Trophy;
  count: number;
  children: React.ReactNode;
}) {
  if (!count) return null;
  return (
    <section className="border border-[var(--border)] bg-[#151515]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
          <Icon className="size-3.5 text-[var(--hltv-green)]" />
          {title}
        </div>
        <span className="font-mono text-[11px] text-zinc-600">{count}</span>
      </div>
      <div className="divide-y divide-[#222]">{children}</div>
    </section>
  );
}

function ResultLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#1c1c1c]",
      )}
    >
      {children}
    </Link>
  );
}
