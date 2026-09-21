"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AdminCard } from "@/components/admin/shell/admin-card";
import { PageTransition } from "@/components/effects/page-transition";
import { RequireCapability } from "@/features/auth/require-capability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, fieldInputClass } from "@/components/ui/form-field";
import { useI18n } from "@/i18n/provider";
import { apiClient, type ReportDto } from "@/shared/api/client";

export default function ModPage() {
  return (
    <RequireCapability capability="report.review">
      <ModInner />
    </RequireCapability>
  );
}

function ModInner() {
  const { t } = useI18n();
  const [reports, setReports] = useState<ReportDto[]>([]);
  const [error, setError] = useState("");
  const [banUserId, setBanUserId] = useState("");
  const [banHours, setBanHours] = useState("24");
  const [banReason, setBanReason] = useState("");

  const load = () =>
    apiClient
      .reports("OPEN")
      .then(setReports)
      .catch((e) => setError((e as { message?: string }).message ?? t("common.error")));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function review(id: string, status: "RESOLVED" | "DISMISSED") {
    await apiClient.reviewReport(id, { status });
    load();
  }

  async function banLimited() {
    if (!banUserId) return;
    const until = new Date(Date.now() + Number(banHours) * 3600_000).toISOString();
    try {
      await apiClient.banUserLimited(banUserId, {
        until,
        reason: banReason || "Temporary restriction by moderator",
      });
      setBanUserId("");
      setBanReason("");
      setError("");
    } catch (e) {
      setError((e as { message?: string }).message ?? t("common.error"));
    }
  }

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{t("mod.title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("mod.subtitle")}</p>
        </div>
        <Link
          href="/forums"
          className="rounded-lg border border-[#2a2a2a] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:border-[var(--hltv-green)]"
        >
          {t("mod.openForums")}
        </Link>
      </div>
      {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}

      <AdminCard title={t("mod.tempBan")}>
        <div className="space-y-4">
          <FormField label={t("mod.userId")} hint={t("mod.userIdHint")} htmlFor="mod-ban-id">
            <input
              id="mod-ban-id"
              className={fieldInputClass}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={banUserId}
              onChange={(e) => setBanUserId(e.target.value)}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
            <FormField label={t("mod.hours")} hint="1–168" htmlFor="mod-ban-hours">
              <input
                id="mod-ban-hours"
                className={fieldInputClass}
                type="number"
                min={1}
                max={168}
                value={banHours}
                onChange={(e) => setBanHours(e.target.value)}
              />
            </FormField>
            <FormField label={t("mod.reason")} hint={t("mod.reasonHint")} htmlFor="mod-ban-reason">
              <input
                id="mod-ban-reason"
                className={fieldInputClass}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </FormField>
          </div>
          <Button size="sm" onClick={banLimited}>
            {t("mod.applyBan")}
          </Button>
        </div>
      </AdminCard>

      <AdminCard title={t("mod.openReports")}>
        {reports.length === 0 ? (
          <p className="text-sm text-zinc-600">{t("mod.noReports")}</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="space-y-3 rounded-lg border border-[#2a2a2a] bg-[#111] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="cyan">{r.targetType}</Badge>
                  <span className="font-mono text-xs text-zinc-500">{r.targetId}</span>
                  <span className="text-xs text-zinc-600">@{r.reporter?.username}</span>
                </div>
                <p className="text-sm text-zinc-300">{r.reason}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => review(r.id, "RESOLVED")}>
                    {t("mod.resolve")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => review(r.id, "DISMISSED")}>
                    {t("mod.dismiss")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </PageTransition>
  );
}
