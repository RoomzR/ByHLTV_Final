"use client";

import { useEffect, useMemo, useState } from "react";

import { EventCard } from "@/components/events/event-card";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { apiClient, type EventDto } from "@/shared/api/client";

type EventsMode = "all" | "ONGOING" | "FINISHED" | "UPCOMING";

const TITLE: Record<EventsMode, "events.title" | "eventsNav.ongoing" | "eventsNav.archive" | "eventsNav.calendar"> = {
  all: "events.title",
  ONGOING: "eventsNav.ongoing",
  FINISHED: "eventsNav.archive",
  UPCOMING: "eventsNav.calendar",
};

const SUB: Record<EventsMode, "events.subtitle" | "eventsNav.ongoingSub" | "eventsNav.archiveSub" | "eventsNav.calendarSub"> = {
  all: "events.subtitle",
  ONGOING: "eventsNav.ongoingSub",
  FINISHED: "eventsNav.archiveSub",
  UPCOMING: "eventsNav.calendarSub",
};

export function EventsView({ mode = "all" }: { mode?: EventsMode }) {
  const { t } = useI18n();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const status = mode === "all" ? undefined : mode;
    apiClient
      .events(status)
      .then((items) => {
        if (!cancelled) setEvents(items);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const grouped = useMemo(() => {
    if (mode !== "UPCOMING") return null;
    const map = new Map<string, EventDto[]>();
    for (const event of events) {
      const key = event.startDate
        ? new Date(event.startDate).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : t("eventsNav.undated");
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [events, mode, t]);

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-white">{t(TITLE[mode])}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t(SUB[mode])}</p>
      </div>

      {events.length === 0 ? (
        <p className="border border-[var(--border)] bg-[#151515] px-4 py-10 text-center text-sm text-zinc-600">
          {t("eventsNav.empty")}
        </p>
      ) : mode === "UPCOMING" && grouped ? (
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <section key={date} className="space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{date}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
