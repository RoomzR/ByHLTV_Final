import type { Metadata } from "next";

import { EventsView } from "@/components/events/events-view";

export const metadata: Metadata = { title: "Events Archive" };

export default function ArchiveEventsPage() {
  return <EventsView mode="FINISHED" />;
}
