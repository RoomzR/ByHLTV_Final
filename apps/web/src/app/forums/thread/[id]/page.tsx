"use client";

import { useParams } from "next/navigation";

import { ForumThreadView } from "@/components/forums/forum-thread-view";

export default function ForumThreadPage() {
  const params = useParams<{ id: string }>();
  if (!params.id) return null;
  return <ForumThreadView id={params.id} />;
}
