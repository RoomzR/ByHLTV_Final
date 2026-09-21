"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { apiClient, type NewsDto, type TransferHistoryDto } from "@/shared/api/client";

export function TransfersView() {
  const { t, locale } = useI18n();
  const [news, setNews] = useState<NewsDto[]>([]);
  const [history, setHistory] = useState<TransferHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.news(locale, "TRANSFER"),
      apiClient.playerTransfers(),
    ])
      .then(([articles, transfers]) => {
        if (cancelled) return;
        setNews(articles);
        setHistory(transfers);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-white">
          {t("playersNav.transfers")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{t("awards.transfersSubtitle")}</p>
      </div>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("awards.transferNews")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {news.length}
          </span>
        </div>
        {news.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-zinc-600">{t("awards.empty")}</p>
        ) : (
          news.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="hltv-row group !grid-cols-1 !gap-1"
            >
              <span className="text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                {article.title}
              </span>
              <span className="text-[11px] text-zinc-500">{article.excerpt}</span>
            </Link>
          ))
        )}
      </section>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("awards.rosterMoves")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {history.length}
          </span>
        </div>
        {history.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-zinc-600">{t("awards.empty")}</p>
        ) : (
          history.map((row) => (
            <div key={row.id} className="hltv-row !grid-cols-[minmax(0,1fr)_auto] !gap-2 text-[13px]">
              <div className="min-w-0">
                {row.player ? (
                  <Link
                    href={`/players/${row.player.slug}`}
                    className="font-semibold text-zinc-100 hover:text-[var(--hltv-green)]"
                  >
                    {row.player.nickname}
                  </Link>
                ) : (
                  <span>—</span>
                )}
                <span className="text-zinc-500"> → </span>
                {row.team ? (
                  <Link href={`/teams/${row.team.slug}`} className="text-zinc-300 hover:text-[var(--hltv-green)]">
                    {row.team.name}
                  </Link>
                ) : (
                  <span className="text-zinc-500">{t("players.freeAgent")}</span>
                )}
              </div>
              <span className="font-mono text-[11px] text-zinc-600">
                {row.leftAt
                  ? new Date(row.leftAt).toLocaleDateString()
                  : new Date(row.joinedAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
