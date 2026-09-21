import type { Metadata } from "next";

import { EventDetailView } from "@/components/events/event-detail-view";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params;
  return <EventDetailView id={id} />;
}
