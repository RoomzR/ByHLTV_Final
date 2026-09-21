import type { Metadata } from "next";

import { TeamDetailView } from "@/components/teams/team-detail-view";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

export default async function TeamDetailPage({ params }: TeamPageProps) {
  const { id } = await params;
  return <TeamDetailView id={id} />;
}
