"use client";

import { useEffect, useState } from "react";

import { PageTransition } from "@/components/effects/page-transition";
import { MatchRow } from "@/components/matches/match-row";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { apiClient, type MatchDto } from "@/shared/api/client";

export function ResultsView() {
  const { t } = useI18n();
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .matches("FINISHED")
      .then(setMatches)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <PageTransition className="mx-auto max-w-5xl space-y-4 px-4 py-10">
      <h1 className="font-display text-3xl font-bold uppercase text-white">{t("matches.results")}</h1>
      <div className="hltv-panel">
        {matches.map((m) => (
          <MatchRow key={m.id} match={m} />
        ))}
      </div>
    </PageTransition>
  );
}
