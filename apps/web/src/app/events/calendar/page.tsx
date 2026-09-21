import type { Metadata } from "next";

import { EventsView } from "@/components/events/events-view";

export const metadata: Metadata = { title: "Events Calendar" };

export default function CalendarEventsPage() {
  return <EventsView mode="UPCOMING" />;
}
