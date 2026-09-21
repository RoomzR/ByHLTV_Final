"use client";

import { useParams } from "next/navigation";

import { ForumCategoryView } from "@/components/forums/forum-category-view";

export default function ForumCategoryPage() {
  const params = useParams<{ category: string }>();
  if (!params.category) return null;
  return <ForumCategoryView slug={params.category} />;
}
