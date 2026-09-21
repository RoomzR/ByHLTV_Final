"use client";

import { useParams } from "next/navigation";

import { GalleryAlbumView } from "@/components/gallery/gallery-album-view";

export default function GalleryAlbumPage() {
  const params = useParams<{ albumId: string }>();
  if (!params.albumId) return null;
  return <GalleryAlbumView slug={params.albumId} />;
}
