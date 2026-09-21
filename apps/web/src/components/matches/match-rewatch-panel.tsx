"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/provider";
import { apiClient, type MatchDemoDto, type MatchDto } from "@/shared/api/client";

export function MatchRewatchPanel({ match }: { match: MatchDto }) {
  const { t } = useI18n();
  const [demos, setDemos] = useState<MatchDemoDto[]>([]);

  useEffect(() => {
    apiClient
      .listDemos(match.slug)
      .then(setDemos)
      .catch(() => setDemos([]));
  }, [match.slug]);

  const ready = demos.filter((d) => d.status === "READY");
  const vods = match.maps
    .filter((m) => m.team1Score > 0 || m.team2Score > 0 || m.winnerId)
    .map((m, i) => ({
      label: `${match.event.name.split(" ")[0] ?? "Stream"} (Map ${i + 1} - ${m.mapName})`,
      href: match.streamUrl,
    }));

  return (
    <section className="hltv-panel">
      <div className="hltv-panel-header">
        <span>{t("matches.rewatch")}</span>
      </div>
      <div className="space-y-2 p-3">
        {match.streamUrl ? (
          <a
            href={match.streamUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 border border-[var(--hltv-green)] bg-[var(--hltv-green)]/15 px-3 py-2.5 text-[13px] font-bold uppercase tracking-wide text-[var(--hltv-green)] hover:bg-[var(--hltv-green)]/25"
          >
            ▶ {t("matches.watchStream")}
          </a>
        ) : null}

        {ready.length > 0 ? (
          ready.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-center border border-[var(--border)] bg-[#22262b] px-3 py-2 text-[12px] font-semibold text-zinc-200"
            >
              {t("matches.demoDownload")}
              {d.mapName ? ` · ${d.mapName}` : ""}
            </div>
          ))
        ) : (
          <div className="border border-dashed border-[var(--border)] px-3 py-2 text-center text-[11px] text-zinc-600">
            {t("matches.demoSoon")}
          </div>
        )}

        {vods.map((v, i) =>
          v.href ? (
            <a
              key={`${v.label}-${i}`}
              href={v.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 border border-[var(--border)] bg-[#22262b] px-3 py-2 text-[12px] text-zinc-200 hover:border-[var(--hltv-green)]"
            >
              <span className="text-zinc-500">🌐</span>
              <span className="truncate">{v.label}</span>
            </a>
          ) : (
            <div
              key={`${v.label}-${i}`}
              className="flex items-center gap-2 border border-[var(--border)] bg-[#1a1d21] px-3 py-2 text-[12px] text-zinc-600"
            >
              <span>🌐</span>
              <span className="truncate">{v.label}</span>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
