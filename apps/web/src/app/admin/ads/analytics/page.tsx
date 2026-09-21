"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AdminCard, AdminStatCard } from "@/components/admin/shell/admin-card";
import {
  AdminBarChart,
  AdminDonutChart,
  AdminLineChart,
} from "@/components/admin/shell/admin-chart";
import { PageTransition } from "@/components/effects/page-transition";
import { PageSkeleton } from "@/components/ui/skeleton";
import { fieldInputClass } from "@/components/ui/form-field";
import { RequireCapability } from "@/features/auth/require-capability";
import { useI18n } from "@/i18n/provider";
import { adFormatLabel, adStatusLabel } from "@/lib/ads-labels";
import { cn } from "@/lib/utils";
import {
  apiClient,
  type AdDto,
  type AdsOverviewDto,
  type AdsStatsDto,
} from "@/shared/api/client";

function dayOffset(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const FORMAT_COLORS: Record<string, string> = {
  BANNER: "#8bb41a",
  TEASER: "#38bdf8",
  SPONSORED_ARTICLE: "#f59e0b",
};

const SLOT_COLORS = [
  "#8bb41a",
  "#38bdf8",
  "#f59e0b",
  "#a78bfa",
  "#fb7185",
  "#34d399",
  "#f472b6",
  "#94a3b8",
];

export default function AdminAdsAnalyticsPage() {
  return (
    <RequireCapability capability="ads.manage">
      <AnalyticsInner />
    </RequireCapability>
  );
}

function AnalyticsInner() {
  const { t } = useI18n();
  const [stats, setStats] = useState<AdsStatsDto | null>(null);
  const [overview, setOverview] = useState<AdsOverviewDto | null>(null);
  const [ads, setAds] = useState<AdDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState(dayOffset(-13));
  const [to, setTo] = useState(dayOffset(0));
  const [adId, setAdId] = useState("");
  const [preset, setPreset] = useState<"7" | "14" | "30" | "custom">("14");

  const load = async (f = from, tDay = to, id = adId) => {
    setLoading(true);
    setError("");
    try {
      const [s, o, list] = await Promise.all([
        apiClient.adsStats(f, tDay, id || undefined),
        apiClient.adsStatsOverview(),
        apiClient.adminAds(),
      ]);
      setStats(s);
      setOverview(o);
      setAds(list);
    } catch (e) {
      setError((e as { message?: string }).message ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPreset(p: "7" | "14" | "30") {
    setPreset(p);
    const nextFrom = dayOffset(-(Number(p) - 1));
    const nextTo = dayOffset(0);
    setFrom(nextFrom);
    setTo(nextTo);
    void load(nextFrom, nextTo, adId);
  }

  const dailyChart = useMemo(
    () =>
      (stats?.daily ?? []).map((d) => ({
        label: d.date,
        impressions: d.impressions,
        clicks: d.clicks,
        ctr: Number((d.ctr * 100).toFixed(2)),
      })),
    [stats],
  );

  const formatSegments = useMemo(
    () =>
      (stats?.byFormat ?? []).map((f) => ({
        label: adFormatLabel(f.format, t),
        value: f.impressions,
        color: FORMAT_COLORS[f.format] ?? "#71717a",
      })),
    [stats, t],
  );

  const slotBars = useMemo(
    () =>
      (stats?.bySlot ?? [])
        .filter((s) => s.impressions > 0 || s.clicks > 0)
        .map((s) => ({
          label: s.slot.replace(/_/g, " "),
          impressions: s.impressions,
          clicks: s.clicks,
        })),
    [stats],
  );

  const topImps = Math.max(1, ...(stats?.ads.map((a) => a.impressions) ?? [1]));

  if (loading && !stats) return <PageSkeleton rows={10} />;

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/admin/ads"
            className="text-[11px] font-bold uppercase text-zinc-600 hover:text-[var(--hltv-green)]"
          >
            ← {t("admin.adsTitle")}
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">
            {t("admin.adsAnalytics")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.adsAnalyticsHint")}</p>
        </div>
      </div>

      <AdminCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(["7", "14", "30"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyPreset(p)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider",
                  preset === p
                    ? "border-[var(--hltv-green)] bg-[var(--hltv-green)]/15 text-[var(--hltv-green)]"
                    : "border-[#2a2a2a] text-zinc-400 hover:border-zinc-500",
                )}
              >
                {p}d
              </button>
            ))}
          </div>
          <label className="space-y-1 text-[11px] uppercase text-zinc-500">
            {t("admin.adsStart")}
            <input
              type="date"
              className={fieldInputClass}
              value={from}
              onChange={(e) => {
                setPreset("custom");
                setFrom(e.target.value);
              }}
            />
          </label>
          <label className="space-y-1 text-[11px] uppercase text-zinc-500">
            {t("admin.adsEnd")}
            <input
              type="date"
              className={fieldInputClass}
              value={to}
              onChange={(e) => {
                setPreset("custom");
                setTo(e.target.value);
              }}
            />
          </label>
          <label className="min-w-[180px] flex-1 space-y-1 text-[11px] uppercase text-zinc-500">
            {t("admin.adsName")}
            <select
              className={fieldInputClass}
              value={adId}
              onChange={(e) => setAdId(e.target.value)}
            >
              <option value="">{t("admin.adsAllAds")}</option>
              {ads.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void load(from, to, adId)}
            className="rounded-lg bg-[var(--hltv-green)] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-black"
          >
            {t("admin.adsApplyRange")}
          </button>
        </div>
      </AdminCard>

      {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}

      {overview ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            label={t("admin.adsImpressionsToday")}
            value={overview.today.impressions}
            tone="green"
            hint={
              overview.yesterday
                ? `${t("admin.adsYesterday")}: ${overview.yesterday.impressions}`
                : undefined
            }
          />
          <AdminStatCard
            label={t("admin.adsClicksToday")}
            value={overview.today.clicks}
            tone="amber"
            hint={
              overview.yesterday
                ? `${t("admin.adsYesterday")}: ${overview.yesterday.clicks}`
                : undefined
            }
          />
          <AdminStatCard
            label={t("admin.adsWeek")}
            value={overview.week?.impressions ?? "—"}
            hint={
              overview.week
                ? `${overview.week.clicks} ${t("admin.adsClicks").toLowerCase()}`
                : undefined
            }
          />
          <AdminStatCard
            label={t("admin.adsActive")}
            value={overview.active}
            hint={`${overview.total} ${t("admin.adsTotal").toLowerCase()}`}
          />
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              label={t("admin.adsImpressions")}
              value={stats.totals.impressions.toLocaleString()}
              tone="green"
              delta={stats.deltas?.impressions}
              hint={`${stats.from} → ${stats.to}`}
            />
            <AdminStatCard
              label={t("admin.adsClicks")}
              value={stats.totals.clicks.toLocaleString()}
              tone="amber"
              delta={stats.deltas?.clicks}
            />
            <AdminStatCard
              label="CTR"
              value={`${(stats.totals.ctr * 100).toFixed(2)}%`}
              delta={stats.deltas?.ctr}
            />
            <AdminStatCard
              label={t("admin.adsPrevPeriod")}
              value={stats.previousTotals?.impressions.toLocaleString() ?? "—"}
              hint={
                stats.previous
                  ? `${stats.previous.from} → ${stats.previous.to}`
                  : undefined
              }
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AdminCard title={t("admin.adsTrafficTrend")}>
              <AdminLineChart
                data={dailyChart}
                series={[
                  {
                    key: "impressions",
                    label: t("admin.adsImpressions"),
                    color: "#8bb41a",
                  },
                  { key: "clicks", label: t("admin.adsClicks"), color: "#f59e0b" },
                ]}
                area
              />
            </AdminCard>
            <AdminCard title={t("admin.adsCtrTrend")}>
              <AdminLineChart
                data={dailyChart}
                series={[{ key: "ctr", label: "CTR %", color: "#38bdf8" }]}
                area={false}
              />
            </AdminCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AdminCard title={t("admin.adsByFormat")}>
              <AdminDonutChart
                segments={formatSegments}
                centerLabel={t("admin.adsImpressions")}
                centerValue={stats.totals.impressions.toLocaleString()}
              />
              {(stats.byFormat ?? []).length === 0 ? (
                <p className="mt-2 text-center text-sm text-zinc-600">{t("admin.adsEmptyStats")}</p>
              ) : null}
            </AdminCard>
            <AdminCard title={t("admin.adsBySlot")}>
              <AdminBarChart
                data={slotBars}
                series={[
                  {
                    key: "impressions",
                    label: t("admin.adsImpressions"),
                    color: "#8bb41a",
                  },
                  { key: "clicks", label: t("admin.adsClicks"), color: "#38bdf8" },
                ]}
                height={200}
              />
              {slotBars.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-600">{t("admin.adsEmptyStats")}</p>
              ) : null}
            </AdminCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {(stats.byStatus ?? []).map((s) => (
              <AdminStatCard
                key={s.status}
                label={adStatusLabel(s.status, t)}
                value={s.count}
                hint={`${s.impressions.toLocaleString()} imp · ${s.clicks.toLocaleString()} clk · ${(s.ctr * 100).toFixed(1)}% CTR`}
              />
            ))}
          </div>

          <AdminCard title={t("admin.adsTop")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-[#2a2a2a] text-[10px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">{t("admin.adsName")}</th>
                    <th className="px-2 py-2">{t("admin.adsFormat")}</th>
                    <th className="px-2 py-2">{t("admin.adsStatus")}</th>
                    <th className="px-2 py-2">{t("admin.adsSlots")}</th>
                    <th className="px-2 py-2 w-40">{t("admin.adsShare")}</th>
                    <th className="px-2 py-2 text-right">{t("admin.adsImpressions")}</th>
                    <th className="px-2 py-2 text-right">{t("admin.adsClicks")}</th>
                    <th className="px-2 py-2 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.ads.map((a, idx) => (
                    <tr key={a.adId} className="border-b border-[#222]">
                      <td className="px-2 py-3 font-medium text-zinc-100">
                        <button
                          type="button"
                          className="text-left hover:text-[var(--hltv-green)]"
                          onClick={() => {
                            setAdId(a.adId);
                            void load(from, to, a.adId);
                          }}
                        >
                          {a.title}
                        </button>
                      </td>
                      <td className="px-2 py-3 text-xs text-zinc-400">{adFormatLabel(a.format, t)}</td>
                      <td className="px-2 py-3 text-xs text-zinc-400">
                        {a.status ? adStatusLabel(a.status, t) : "—"}
                      </td>
                      <td className="px-2 py-3 text-[10px] text-zinc-500">
                        {(a.slots ?? []).join(", ") || "—"}
                      </td>
                      <td className="px-2 py-3">
                        <div className="h-2 overflow-hidden rounded-full bg-[#222]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(4, (a.impressions / topImps) * 100)}%`,
                              background: SLOT_COLORS[idx % SLOT_COLORS.length],
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-3 text-right font-mono text-xs">
                        {a.impressions.toLocaleString()}
                      </td>
                      <td className="px-2 py-3 text-right font-mono text-xs">
                        {a.clicks.toLocaleString()}
                      </td>
                      <td className="px-2 py-3 text-right font-mono text-xs">
                        {(a.ctr * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.ads.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-600">{t("admin.adsEmptyStats")}</p>
              ) : null}
            </div>
          </AdminCard>

          <AdminCard title={t("admin.adsDailyTable")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-[#2a2a2a] text-[10px] uppercase text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">{t("admin.adsDate")}</th>
                    <th className="px-2 py-2 text-right">{t("admin.adsImpressions")}</th>
                    <th className="px-2 py-2 text-right">{t("admin.adsClicks")}</th>
                    <th className="px-2 py-2 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(stats.daily ?? [])].reverse().map((d) => (
                    <tr key={d.date} className="border-b border-[#222]">
                      <td className="px-2 py-2 font-mono text-xs text-zinc-300">{d.date}</td>
                      <td className="px-2 py-2 text-right font-mono text-xs">
                        {d.impressions.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs">
                        {d.clicks.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs">
                        {(d.ctr * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </>
      ) : null}
    </PageTransition>
  );
}
