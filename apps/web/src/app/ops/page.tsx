"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { AdminCard } from "@/components/admin/shell/admin-card";
import { PageTransition } from "@/components/effects/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField, fieldInputClass } from "@/components/ui/form-field";
import { RequireCapability } from "@/features/auth/require-capability";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import {
  apiClient,
  type MatchDto,
  type OrganizerEventDto,
  type SubmissionDto,
} from "@/shared/api/client";

export default function OpsDashboardPage() {
  return (
    <RequireCapability anyOf={["submission.create", "submission.review"]}>
      <OpsInner />
    </RequireCapability>
  );
}

function OpsInner() {
  const { can } = useAuth();
  const { t } = useI18n();
  const [subs, setSubs] = useState<SubmissionDto[]>([]);
  const [events, setEvents] = useState<OrganizerEventDto[]>([]);
  const [queue, setQueue] = useState<SubmissionDto[]>([]);
  const [liveMatches, setLiveMatches] = useState<MatchDto[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("LIVE_PACKAGE");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const mine = await apiClient.mySubmissions();
      setSubs(mine);
      if (can("event.manage_own")) {
        setEvents(await apiClient.myOrganizerEvents());
      }
      if (can("submission.review")) {
        setQueue(await apiClient.submissionsQueue());
      }
      if (can("match.live_operate")) {
        setLiveMatches(await apiClient.matches("LIVE"));
      }
    } catch (e) {
      setError((e as { message?: string }).message ?? t("common.error"));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createSub(e: FormEvent) {
    e.preventDefault();
    try {
      const created = (await apiClient.createSubmission({
        title,
        type,
        eventId: events[0]?.event.id ?? null,
        notes,
        payload: { createdFrom: "ops" },
      })) as SubmissionDto;
      await apiClient.submitSubmission(created.id);
      setTitle("");
      setNotes("");
      await load();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    }
  }

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{t("ops.title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("ops.subtitle")}</p>
        </div>
        {can("review.tournament_applications") ? (
          <Link
            href="/admin/applications"
            className="rounded-lg border border-[#2a2a2a] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:border-[var(--hltv-green)]"
          >
            {t("ops.toApplications")}
          </Link>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}

      {can("match.live_operate") ? (
        <AdminCard title={t("ops.liveMatches")}>
          {liveMatches.length === 0 ? (
            <p className="text-sm text-zinc-600">{t("ops.noLive")}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {liveMatches.map((m) => (
                <Link
                  key={m.id}
                  href={`/ops/live/${m.slug}`}
                  className="rounded-lg border border-[#2a2a2a] bg-[#111] p-3 transition-colors hover:border-[var(--hltv-green)]/40"
                >
                  <div className="text-sm font-semibold text-white">
                    {m.team1.name} vs {m.team2.name}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {m.event?.name} · {t("ops.openLive")}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </AdminCard>
      ) : null}

      {can("submission.create") ? (
        <>
          <AdminCard title={t("ops.newSubmission")}>
            <p className="-mt-2 mb-4 text-sm text-zinc-500">{t("ops.newSubmissionHint")}</p>
            <form onSubmit={createSub} className="space-y-4">
              <FormField label={t("ops.subTitle")} hint={t("ops.subTitleHint")} htmlFor="ops-title">
                <input
                  id="ops-title"
                  required
                  className={fieldInputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>
              <FormField label={t("ops.subType")} hint={t("ops.subTypeHint")} htmlFor="ops-type">
                <select
                  id="ops-type"
                  className={fieldInputClass}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="LIVE_PACKAGE">{t("ops.typeLive")}</option>
                  <option value="MATCH_UPDATE">{t("ops.typeMatch")}</option>
                  <option value="NEWS_DRAFT">{t("ops.typeNews")}</option>
                  <option value="BRACKET">{t("ops.typeBracket")}</option>
                </select>
              </FormField>
              <FormField label={t("ops.notes")} hint={t("ops.notesHint")} htmlFor="ops-notes">
                <textarea
                  id="ops-notes"
                  className={fieldInputClass}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormField>
              <Button type="submit">{t("ops.submitReview")}</Button>
            </form>
          </AdminCard>

          <AdminCard title={t("ops.myEvents")}>
            <div className="grid gap-2 sm:grid-cols-2">
              {events.length === 0 ? (
                <p className="text-sm text-zinc-600">{t("ops.noEvents")}</p>
              ) : (
                events.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-lg border border-[#2a2a2a] bg-[#111] p-3 text-sm"
                  >
                    <div className="font-semibold text-white">{o.event.name}</div>
                    <div className="text-xs text-zinc-500">
                      {o.role} · {o.event.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </AdminCard>

          <AdminCard title={t("ops.mySubs")}>
            {subs.length === 0 ? (
              <p className="text-sm text-zinc-600">{t("ops.noSubs")}</p>
            ) : (
              <div className="space-y-2">
                {subs.map((s) => (
                  <Link
                    key={s.id}
                    href={`/ops/submissions/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#111] p-3 text-sm transition-colors hover:border-[var(--hltv-green)]/40"
                  >
                    <span className="text-white">{s.title}</span>
                    <Badge variant="cyan">{s.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </AdminCard>
        </>
      ) : null}

      {can("submission.review") ? (
        <AdminCard title={t("ops.editorQueue")}>
          <p className="-mt-2 mb-4 text-sm text-zinc-500">{t("ops.editorQueueHint")}</p>
          {queue.length === 0 ? (
            <p className="text-sm text-zinc-600">{t("ops.queueEmpty")}</p>
          ) : (
            <div className="space-y-3">
              {queue.map((s) => (
                <div key={s.id} className="rounded-lg border border-[#2a2a2a] bg-[#111] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white">{s.title}</div>
                      <div className="text-xs text-zinc-500">
                        {s.type} · @{s.author?.username} · {s.event?.name ?? "—"}
                      </div>
                    </div>
                    <Badge>{s.status}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => apiClient.requestSubmissionChanges(s.id).then(load)}
                    >
                      {t("ops.requestChanges")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => apiClient.approveSubmission(s.id).then(load)}
                    >
                      {t("ops.approve")}
                    </Button>
                    <Button size="sm" onClick={() => apiClient.publishSubmission(s.id).then(load)}>
                      {t("ops.publish")}
                    </Button>
                    <Link
                      href={`/ops/submissions/${s.id}`}
                      className="inline-flex h-8 items-center px-3 text-xs font-semibold uppercase tracking-wide text-[var(--hltv-green)] hover:underline"
                    >
                      {t("ops.openChat")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      ) : null}
    </PageTransition>
  );
}
