"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRole } from "@byhltv/shared";

import { AdminCard, AdminStatCard } from "@/components/admin/shell/admin-card";
import { PageTransition } from "@/components/effects/page-transition";
import { RequireCapability } from "@/features/auth/require-capability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import {
  apiClient,
  type AdminOverviewDto,
  type AdsOverviewDto,
  type FeatureFlagDto,
} from "@/shared/api/client";

export default function AdminPage() {
  return (
    <RequireCapability capability="admin.panel">
      <AdminInner />
    </RequireCapability>
  );
}

function AdminInner() {
  const { can, hasMinRole } = useAuth();
  const { t } = useI18n();
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [adsOverview, setAdsOverview] = useState<AdsOverviewDto | null>(null);
  const [flags, setFlags] = useState<FeatureFlagDto[]>([]);
  const [audit, setAudit] = useState<unknown[]>([]);
  const [system, setSystem] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    Promise.all([
      apiClient.adminOverview(),
      apiClient.adminFlags(),
      apiClient.adminAudit(),
      can("ads.manage")
        ? apiClient.adsStatsOverview().catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([o, f, a, ads]) => {
        setOverview(o);
        setFlags(f);
        setAudit(a);
        setAdsOverview(ads);
      })
      .catch((e) => setError((e as { message?: string }).message ?? t("common.error")));
    if (hasMinRole(UserRole.SUPERADMIN)) {
      apiClient.adminSystem().then(setSystem).catch(() => setSystem(null));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleFlag(key: string, enabled: boolean) {
    await apiClient.adminSetFlag(key, !enabled);
    load();
  }

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{t("admin.title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.dashboardHint")}</p>
        </div>
        {can("ads.manage") ? (
          <Link
            href="/admin/ads"
            className="rounded-lg bg-[var(--hltv-green)] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-black"
          >
            {t("admin.adsTitle")}
          </Link>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overview ? (
          <>
            <AdminStatCard label={t("admin.users")} value={overview.users} />
            <AdminStatCard label={t("admin.matches")} value={overview.matches} />
            <AdminStatCard label={t("admin.news")} value={overview.news} />
            <AdminStatCard label="Threads" value={overview.threads} />
          </>
        ) : null}
        {adsOverview ? (
          <>
            <AdminStatCard
              label={t("admin.adsImpressionsToday")}
              value={adsOverview.today.impressions}
              tone="green"
            />
            <AdminStatCard
              label={t("admin.adsClicksToday")}
              value={adsOverview.today.clicks}
              tone="amber"
            />
            <AdminStatCard
              label={t("admin.adsActive")}
              value={adsOverview.active}
              hint={`${adsOverview.total} total`}
            />
            <AdminStatCard
              label="CTR"
              value={`${(adsOverview.today.ctr * 100).toFixed(1)}%`}
            />
          </>
        ) : null}
      </div>

      {system ? (
        <AdminCard title={t("admin.system")}>
          <pre className="overflow-auto font-mono text-xs text-zinc-400">
            {JSON.stringify(system, null, 2)}
          </pre>
        </AdminCard>
      ) : null}

      <AdminCard title={t("admin.flags")}>
        <div className="grid gap-2 md:grid-cols-2">
          {flags.map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2"
            >
              <span className="font-mono text-sm text-zinc-300">{f.key}</span>
              <Button size="sm" variant="outline" onClick={() => toggleFlag(f.key, f.enabled)}>
                <Badge variant={f.enabled ? "green" : "default"}>
                  {f.enabled ? "ON" : "OFF"}
                </Badge>
              </Button>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title={t("admin.audit")}>
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-[#2a2a2a] bg-[#171717] text-zinc-500">
              <tr>
                <th className="px-2 py-2">{t("admin.action")}</th>
                <th className="px-2 py-2">{t("admin.entity")}</th>
                <th className="px-2 py-2">{t("admin.userCol")}</th>
              </tr>
            </thead>
            <tbody>
              {(
                audit as Array<{
                  id: string;
                  action: string;
                  entity?: string;
                  user?: { username: string };
                }>
              ).map((row) => (
                <tr key={row.id} className="border-b border-[#222]">
                  <td className="px-2 py-2 font-mono text-zinc-300">{row.action}</td>
                  <td className="px-2 py-2 text-zinc-500">{row.entity}</td>
                  <td className="px-2 py-2">{row.user?.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </PageTransition>
  );
}
