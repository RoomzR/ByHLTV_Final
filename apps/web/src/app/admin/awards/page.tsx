"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { CmsBackLink } from "@/components/admin/cms-back-link";
import {
  EntitySearchField,
  type EntitySearchSelection,
} from "@/components/admin/entity-search-field";
import { PageTransition } from "@/components/effects/page-transition";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { RequireCapability } from "@/features/auth/require-capability";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { apiClient, type SceneAwardDto } from "@/shared/api/client";

const KINDS = ["MVP", "EVP", "TOP20", "HALL_OF_FAME"] as const;
type Kind = (typeof KINDS)[number];

export default function AdminAwardsPage() {
  return (
    <RequireCapability capability="awards.manage">
      <AwardsInner />
    </RequireCapability>
  );
}

function AwardsInner() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();
  const [items, setItems] = useState<SceneAwardDto[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<SceneAwardDto | null>(null);
  const [kind, setKind] = useState<Kind>("MVP");
  const [player, setPlayer] = useState<EntitySearchSelection | null>(null);
  const [event, setEvent] = useState<EntitySearchSelection | null>(null);
  const [year, setYear] = useState(String(currentYear));
  const [rank, setRank] = useState("1");
  const [note, setNote] = useState("");
  const [listYear, setListYear] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const needsEvent = kind === "MVP" || kind === "EVP";
  const needsRank = kind === "EVP" || kind === "TOP20";
  const needsYear = kind === "TOP20" || kind === "HALL_OF_FAME";

  const load = async () => {
    try {
      const awards = await apiClient.awards();
      setItems(awards);
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

  function resetForm() {
    setEditing(null);
    setKind("MVP");
    setPlayer(null);
    setEvent(null);
    setYear(String(currentYear));
    setRank("1");
    setNote("");
  }

  function startEdit(item: SceneAwardDto) {
    setEditing(item);
    setKind(item.kind);
    setPlayer(
      item.player
        ? {
            kind: "player",
            id: item.playerId,
            label: item.player.nickname,
            raw: item.player,
          }
        : { kind: "player", id: item.playerId, label: item.playerId },
    );
    setEvent(
      item.event
        ? {
            kind: "event",
            id: item.event.id,
            label: item.event.name,
            raw: item.event,
          }
        : item.eventId
          ? { kind: "event", id: item.eventId, label: item.eventId }
          : null,
    );
    setYear(item.year != null ? String(item.year) : String(currentYear));
    setRank(item.rank != null ? String(item.rank) : "1");
    setNote(item.note ?? "");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!player) {
      setError(t("awards.playerRequired"));
      return;
    }
    if (needsEvent && !event) {
      setError(t("awards.eventRequired"));
      return;
    }
    const body: Record<string, unknown> = {
      kind,
      playerId: player.id,
      eventId: needsEvent ? event!.id : null,
      year: year ? Number(year) : null,
      rank: needsRank || kind === "TOP20" ? Number(rank) : kind === "EVP" ? Number(rank) : null,
      note: note || null,
    };
    if (kind === "HALL_OF_FAME") {
      body.rank = null;
      body.eventId = null;
    }
    if (kind === "MVP") {
      body.rank = null;
    }
    try {
      if (editing) await apiClient.updateAward(editing.id, body);
      else await apiClient.createAward(body);
      resetForm();
      await load();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    }
  }

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const item of items) {
      if (item.year) set.add(item.year);
    }
    set.add(currentYear);
    return [...set].sort((a, b) => b - a);
  }, [items, currentYear]);

  const filtered = useMemo(() => {
    let list = items;
    if (listYear !== "all") {
      list = list.filter((i) => i.year === Number(listYear));
    }
    return list;
  }, [items, listYear]);

  const top20Slots = useMemo(() => {
    const y = listYear === "all" ? currentYear : Number(listYear);
    const byRank = new Map(
      items.filter((i) => i.kind === "TOP20" && i.year === y).map((i) => [i.rank ?? 0, i]),
    );
    return Array.from({ length: 20 }, (_, i) => ({
      rank: i + 1,
      award: byRank.get(i + 1) ?? null,
    }));
  }, [items, listYear, currentYear]);

  if (loading) return <PageSkeleton />;

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{t("admin.awardsTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.awardsHint")}</p>
        </div>
        <CmsBackLink />
      </div>

      <p className="border border-[var(--border)] bg-[#151515] px-3 py-2.5 text-[12px] leading-relaxed text-zinc-400">
        {t("awards.rulesGuide")}
      </p>

      {error ? <p className="text-rose-400">{error}</p> : null}

      <form
        onSubmit={onSubmit}
        className="grid gap-3 border border-[var(--border)] bg-[#1b1b1b] p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-sm uppercase text-zinc-500">
          {editing ? t("common.edit") : t("common.create")}
        </h2>

        <label className="text-xs uppercase text-zinc-500">
          {t("admin.awardKind")}
          <select
            className="mt-1 w-full border border-[var(--border)] bg-[#121212] px-2 py-2 text-sm"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as Kind);
              setEvent(null);
            }}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <div className="text-[11px] leading-snug text-zinc-500 sm:pt-6">
          {kind === "MVP" || kind === "EVP"
            ? t("awards.hintEventAward")
            : kind === "TOP20"
              ? t("awards.hintTop20")
              : t("awards.hintHof")}
        </div>

        <EntitySearchField
          kind="player"
          label={t("stats.player")}
          value={player?.kind === "player" ? player : null}
          onChange={setPlayer}
          required
        />

        {needsEvent ? (
          <EntitySearchField
            kind="event"
            label={t("awards.tournament")}
            value={event?.kind === "event" ? event : null}
            onChange={setEvent}
            required
          />
        ) : (
          <div />
        )}

        {(needsYear || needsEvent) && (
          <label className="text-xs uppercase text-zinc-500">
            {t("admin.awardYear")}
            <input
              className="mt-1 w-full border border-[var(--border)] bg-[#121212] px-2 py-2 text-sm"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder={needsEvent ? t("awards.yearFromEvent") : undefined}
            />
          </label>
        )}

        {needsRank ? (
          <label className="text-xs uppercase text-zinc-500">
            {t("admin.awardRank")}
            <input
              className="mt-1 w-full border border-[var(--border)] bg-[#121212] px-2 py-2 text-sm"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              min={1}
              max={kind === "TOP20" ? 20 : 100}
            />
          </label>
        ) : null}

        <label className="sm:col-span-2 text-xs uppercase text-zinc-500">
          {t("admin.awardNote")}
          <input
            className="mt-1 w-full border border-[var(--border)] bg-[#121212] px-2 py-2 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <Button type="submit">{editing ? t("common.update") : t("common.create")}</Button>
          {editing ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              {t("common.reset")}
            </Button>
          ) : null}
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {t("admin.awardYear")}
        </span>
        <button
          type="button"
          onClick={() => setListYear("all")}
          className={cn(
            "border px-2 py-1 text-[10px] font-bold uppercase",
            listYear === "all"
              ? "border-[var(--hltv-green)] text-[var(--hltv-green)]"
              : "border-[var(--border)] text-zinc-500",
          )}
        >
          {t("players.allRoles")}
        </button>
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setListYear(String(y))}
            className={cn(
              "border px-2 py-1 text-[10px] font-bold uppercase",
              listYear === String(y)
                ? "border-[var(--hltv-green)] text-[var(--hltv-green)]"
                : "border-[var(--border)] text-zinc-500",
            )}
          >
            {y}
          </button>
        ))}
      </div>

      {listYear !== "all" || kind === "TOP20" ? (
        <section className="hltv-panel">
          <div className="hltv-panel-header">
            <span>
              Top20 · {listYear === "all" ? currentYear : listYear}
            </span>
          </div>
          {top20Slots.map((slot) => (
            <div
              key={slot.rank}
              className="hltv-row !grid-cols-[40px_minmax(0,1fr)_auto] !gap-2 text-[13px]"
            >
              <span className="font-mono text-zinc-500">#{slot.rank}</span>
              <span className="truncate text-zinc-200">
                {slot.award?.player?.nickname ?? (
                  <span className="text-zinc-600">{t("awards.slotEmpty")}</span>
                )}
              </span>
              {slot.award ? (
                <Button size="sm" variant="outline" onClick={() => startEdit(slot.award!)}>
                  {t("common.edit")}
                </Button>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("admin.awardsTitle")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {filtered.length}
          </span>
        </div>
        {filtered.map((item) => (
          <div
            key={item.id}
            className="hltv-row !grid-cols-1 gap-2 sm:!grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div className="min-w-0 text-sm text-zinc-300">
              <span className="font-mono text-[var(--hltv-green)]">{item.kind}</span>
              {item.year ? <span className="text-zinc-500"> · {item.year}</span> : null}
              {item.rank ? <span className="text-zinc-500"> · #{item.rank}</span> : null}
              <span className="ml-2 font-semibold text-white">{item.player?.nickname}</span>
              {item.event ? (
                <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                  {item.event.name}
                  {item.event.tier ? ` · ${item.event.tier}` : ""}
                </span>
              ) : null}
              {item.note ? (
                <span className="mt-0.5 block text-[11px] text-zinc-600">{item.note}</span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                {t("common.edit")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => apiClient.deleteAward(item.id).then(load)}
              >
                {t("common.delete")}
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-zinc-600">{t("awards.empty")}</p>
        ) : null}
      </section>
    </PageTransition>
  );
}
