"use client";

import { useEffect, useState } from "react";

import { PageTransition } from "@/components/effects/page-transition";
import { MatchRow } from "@/components/matches/match-row";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/i18n/provider";
import { apiClient, type MatchDto } from "@/shared/api/client";

export function MatchesView() {
  const { t } = useI18n();
  const [live, setLive] = useState<MatchDto[]>([]);
  const [upcoming, setUpcoming] = useState<MatchDto[]>([]);
  const [finished, setFinished] = useState<MatchDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.matches("LIVE"),
      apiClient.matches("UPCOMING"),
      apiClient.matches("FINISHED"),
    ])
      .then(([l, u, f]) => {
        setLive(l);
        setUpcoming(u);
        setFinished(f);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white md:text-4xl">{t("matches.title")}</h1>
        <p className="mt-2 text-zinc-500">{t("matches.subtitle")}</p>
      </div>

      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">
            {t("matches.live")} ({live.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            {t("matches.schedule")} ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="finished">
            {t("matches.results")} ({finished.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="live" className="space-y-1">
          {live.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </TabsContent>
        <TabsContent value="upcoming" className="space-y-1">
          {upcoming.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </TabsContent>
        <TabsContent value="finished" className="space-y-1">
          {finished.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
