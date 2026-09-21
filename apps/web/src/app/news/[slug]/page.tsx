import type { Metadata } from "next";

import { NewsDetailView } from "@/components/news/news-detail-view";

interface NewsDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsDetailProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

export default async function NewsDetailPage({ params }: NewsDetailProps) {
  const { slug } = await params;
  return <NewsDetailView slug={slug} />;
}
