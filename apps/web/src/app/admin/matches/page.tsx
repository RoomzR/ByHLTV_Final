"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { CmsBackLink } from "@/components/admin/cms-back-link";
import { PageTransition } from "@/components/effects/page-transition";
import { MapVetoEditor } from "@/components/matches/map-veto-editor";
import { RequireCapability } from "@/features/auth/require-capability";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/shell/admin-card";
import { FormField, fieldInputClass } from "@/components/ui/form-field";
import { TeamSearchSelect } from "@/components/ui/team-search-select";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import {
  apiClient,
  type EventDto,
  type MatchDto,
  type TeamDto,
} from "@/shared/api/client";

export default function AdminMatchesPage() {
  return (
    <RequireCapability anyOf={["match.publish", "match.live_operate"]}>
      <MatchesInner />
    </RequireCapability>
  );
}

function MatchesInner() {
  const { can } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<MatchDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [error, setError] = useState("");
  const [vetoMatch, setVetoMatch] = useState<MatchDto | null>(null);
  const [form, setForm] = useState({
    slug: "",
    team1Id: "",
    team2Id: "",
    eventId: "",
    format: "BO3",
    scheduledAt: "",
    stars: "0",
    maps: "Mirage, Inferno, Nuke",
    streamUrl: "",
  });

  const load = () =>
    Promise.all([apiClient.matches(), apiClient.teams(), apiClient.adminEvents()])
      .then(([m, tm, ev]) => {
        setItems(m);
        setTeams(tm);
        setEvents(ev);
        setForm((f) => ({
          ...f,
          eventId: f.eventId || ev[0]?.id || "",
          scheduledAt:
            f.scheduledAt ||
            new Date(Date.now() + 3600_000).toISOString().slice(0, 16),
        }));
        setVetoMatch((cur) => (cur ? m.find((x) => x.id === cur.id) ?? cur : null));
      })
      .catch((e) => setError((e as { message?: string }).message ?? t("common.error")));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.team1Id || !form.team2Id) {
      setError(t("admin.pickBothTeams"));
      return;
    }
    try {
      const maps = form.maps
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const created = await apiClient.createMatch({
        slug: form.slug || undefined,
        team1Id: form.team1Id,
        team2Id: form.team2Id,
        eventId: form.eventId,
        format: form.format,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        stars: Number(form.stars) || 0,
        maps: maps.length ? maps : undefined,
        streamUrl: form.streamUrl.trim() || null,
        status: "UPCOMING",
      });
      setForm((f) => ({ ...f, slug: "", team1Id: "", team2Id: "", streamUrl: "" }));
      await load();
      setVetoMatch(created);
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    }
  }

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{t("admin.matchesTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.matchesHint")}</p>
        </div>
        <CmsBackLink />
      </div>
      {error ? <p className="text-rose-400">{error}</p> : null}

      <AdminCard className="space-y-3 border-[var(--border)] bg-[#121212] p-4 text-sm text-zinc-400">
        <p className="font-semibold text-zinc-200">{t("admin.matchesWhoTitle")}</p>
        <ul className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed">
          <li>{t("admin.matchesWho1")}</li>
          <li>{t("admin.matchesWho2")}</li>
          <li>{t("admin.matchesWho3")}</li>
          <li>{t("admin.matchesWhoEditor")}</li>
        </ul>
      </AdminCard>

      {(can("match.publish") || can("match.live_operate")) && events.length > 0 && teams.length >= 2 ? (
        <AdminCard className="space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            {t("admin.newMatch")}
          </h2>
          <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("admin.slug")} hint={t("admin.slugHintOptional")} htmlFor="m-slug">
              <input
                id="m-slug"
                className={fieldInputClass}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto"
              />
            </FormField>
            <FormField label={t("admin.matchEvent")} htmlFor="m-event">
              <select
                id="m-event"
                className={fieldInputClass}
                value={form.eventId}
                onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                required
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label={t("admin.matchTeam1")} htmlFor="m-t1">
              <TeamSearchSelect
                id="m-t1"
                teams={teams}
                value={form.team1Id}
                excludeId={form.team2Id}
                onChange={(team1Id) => setForm({ ...form, team1Id })}
                placeholder={t("admin.searchTeam")}
                required
              />
            </FormField>
            <FormField label={t("admin.matchTeam2")} htmlFor="m-t2">
              <TeamSearchSelect
                id="m-t2"
                teams={teams}
                value={form.team2Id}
                excludeId={form.team1Id}
                onChange={(team2Id) => setForm({ ...form, team2Id })}
                placeholder={t("admin.searchTeam")}
                required
              />
            </FormField>
            <FormField label={t("admin.matchFormat")} htmlFor="m-fmt">
              <select
                id="m-fmt"
                className={fieldInputClass}
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
              >
                <option value="BO1">BO1</option>
                <option value="BO3">BO3</option>
                <option value="BO5">BO5</option>
              </select>
            </FormField>
            <FormField label={t("admin.matchWhen")} htmlFor="m-when">
              <input
                id="m-when"
                type="datetime-local"
                className={fieldInputClass}
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                required
              />
            </FormField>
            <FormField label={t("admin.matchMaps")} hint={t("admin.matchMapsHint")} htmlFor="m-maps">
              <input
                id="m-maps"
                className={fieldInputClass}
                value={form.maps}
                onChange={(e) => setForm({ ...form, maps: e.target.value })}
              />
            </FormField>
            <FormField label={t("admin.matchStars")} htmlFor="m-stars">
              <input
                id="m-stars"
                type="number"
                min={0}
                max={5}
                className={fieldInputClass}
                value={form.stars}
                onChange={(e) => setForm({ ...form, stars: e.target.value })}
              />
            </FormField>
            <FormField
              label={t("admin.matchStream")}
              hint={t("admin.matchStreamHint")}
              htmlFor="m-stream"
              className="sm:col-span-2"
            >
              <input
                id="m-stream"
                type="url"
                className={fieldInputClass}
                value={form.streamUrl}
                onChange={(e) => setForm({ ...form, streamUrl: e.target.value })}
                placeholder="https://twitch.tv/... or https://youtube.com/..."
              />
            </FormField>
            <div className="sm:col-span-2">
              <Button type="submit">{t("admin.createMatch")}</Button>
            </div>
          </form>
        </AdminCard>
      ) : (
        <p className="text-sm text-zinc-500">{t("admin.matchesNeedData")}</p>
      )}

      {vetoMatch ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-zinc-300">
              {t("ops.mapVetoEdit")}:{" "}
              <span className="font-semibold text-white">
                {vetoMatch.team1.name} vs {vetoMatch.team2.name}
              </span>
            </p>
            <button
              type="button"
              className="text-xs text-zinc-500 hover:text-zinc-300"
              onClick={() => setVetoMatch(null)}
            >
              {t("common.cancel")}
            </button>
          </div>
          <MapVetoEditor
            match={vetoMatch}
            onSaved={(m) => {
              setVetoMatch(m);
              void load();
            }}
          />
        </div>
      ) : null}

      <AdminCard className="overflow-hidden p-0">
        <div className="border-b border-[var(--border)] px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500">
          {t("admin.matchesList")}
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {items.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <div className="font-semibold text-zinc-200">
                  {m.team1.name} vs {m.team2.name}
                </div>
                <div className="text-xs text-zinc-500">
                  {m.event?.name} · {m.format} · {m.status} · {m.slug}
                  {m.vetos?.length ? ` · veto ${m.vetos.length}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  className="text-zinc-300 hover:text-[var(--hltv-green)]"
                  onClick={() => setVetoMatch(m)}
                >
                  {t("ops.mapVetoEdit")}
                </button>
                <Link href={`/matches/${m.slug}`} className="text-zinc-400 hover:text-[var(--hltv-green)]">
                  {t("common.view")}
                </Link>
                {can("match.live_operate") ? (
                  <Link
                    href={`/ops/live/${m.slug}`}
                    className="font-semibold text-[var(--hltv-green)] hover:underline"
                  >
                    {t("ops.liveControl")}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="px-4 py-6 text-sm text-zinc-600">{t("admin.noMatches")}</li>
          ) : null}
        </ul>
      </AdminCard>
    </PageTransition>
  );
}
