"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { CmsBackLink } from "@/components/admin/cms-back-link";
import { PageTransition } from "@/components/effects/page-transition";
import { RequireCapability } from "@/features/auth/require-capability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { apiClient, type TournamentApplicationDto } from "@/shared/api/client";

export default function AdminApplicationsPage() {
  return (
    <RequireCapability capability="review.tournament_applications">
      <ApplicationsInner />
    </RequireCapability>
  );
}

function ApplicationsInner() {
  const { t } = useI18n();
  const [apps, setApps] = useState<TournamentApplicationDto[]>([]);
  const [error, setError] = useState("");

  const load = () => {
    apiClient
      .listTournamentApplications()
      .then(setApps)
      .catch((e) => setError((e as { message?: string }).message ?? t("common.error")));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-4 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase text-white">
            {t("admin.appsTitle")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.appsHint")}</p>
        </div>
        <CmsBackLink />
      </div>
      {error ? <p className="text-rose-400">{error}</p> : null}
      {apps.map((a) => (
        <div key={a.id} className="border border-[var(--border)] bg-[#1b1b1b] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-white">{a.orgName || a.user?.username}</div>
              <div className="text-xs text-zinc-500">
                @{a.user?.username} · {a.status}
              </div>
            </div>
            <Badge variant="cyan">{a.status}</Badge>
          </div>
          {a.status === "PENDING" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  await apiClient.approveTournamentApplication(a.id);
                  load();
                }}
              >
                {t("ops.approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await apiClient.rejectTournamentApplication(a.id, t("admin.rejectDefault"));
                  load();
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </PageTransition>
  );
}
