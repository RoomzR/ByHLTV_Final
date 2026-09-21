import type { Metadata } from "next";

import { EventsView } from "@/components/events/events-view";

export const metadata: Metadata = { title: "Ongoing Events" };

export default function OngoingEventsPage() {
  return <EventsView mode="ONGOING" />;
}
