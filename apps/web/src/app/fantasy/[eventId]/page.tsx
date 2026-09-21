"use client";

import { useParams } from "next/navigation";

import { FantasyEventView } from "@/components/fantasy/fantasy-event-view";

export default function FantasyEventPage() {
  const params = useParams<{ eventId: string }>();
  if (!params.eventId) return null;
  return <FantasyEventView slug={params.eventId} />;
}
