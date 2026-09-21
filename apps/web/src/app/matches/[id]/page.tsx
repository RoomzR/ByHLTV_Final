import type { Metadata } from "next";

import { MatchDetailView } from "@/components/matches/match-detail-view";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Match ${id}` };
}

export default async function MatchDetailPage({ params }: MatchPageProps) {
  const { id } = await params;
  return <MatchDetailView id={id} />;
}
