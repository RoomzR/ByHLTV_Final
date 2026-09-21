import type { Metadata } from "next";

import { PlayerDetailView } from "@/components/players/player-detail-view";

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

export default async function PlayerDetailPage({ params }: PlayerPageProps) {
  const { id } = await params;
  return <PlayerDetailView id={id} />;
}
