"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { CmsBackLink } from "@/components/admin/cms-back-link";
import {
  EntitySearchField,
  type EntitySearchSelection,
} from "@/components/admin/entity-search-field";
import { PageTransition } from "@/components/effects/page-transition";
import { Button } from "@/components/ui/button";
import { FormField, fieldInputClass } from "@/components/ui/form-field";
import { ImageUpload } from "@/components/ui/image-upload";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { PageSkeleton } from "@/components/ui/skeleton";
import { RequireCapability } from "@/features/auth/require-capability";
import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import { apiClient, type GalleryAlbumDto } from "@/shared/api/client";

function slugify(title: string) {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
  return s || `album-${Date.now()}`;
}

export default function AdminGalleryPage() {
  return (
    <RequireCapability capability="gallery.manage">
      <GalleryInner />
    </RequireCapability>
  );
}

function GalleryInner() {
  const { t } = useI18n();
  const [albums, setAlbums] = useState<GalleryAlbumDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<GalleryAlbumDto | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [event, setEvent] = useState<EntitySearchSelection | null>(null);
  const [team, setTeam] = useState<EntitySearchSelection | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const list = await apiClient.gallery();
      setAlbums(list);
    } catch (e) {
      setError((e as { message?: string }).message ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEditing(null);
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setCoverUrl(null);
    setImages([]);
    setEvent(null);
    setTeam(null);
    setError("");
  }

  function startEdit(album: GalleryAlbumDto) {
    setEditing(album);
    setTitle(album.title);
    setSlug(album.slug);
    setSlugTouched(true);
    setCoverUrl(album.coverUrl ?? null);
    setImages((album.images ?? []).map((img) => img.url));
    setEvent(
      album.event
        ? { kind: "event", id: album.event.id, label: album.event.name }
        : null,
    );
    setTeam(
      album.team
        ? { kind: "team", id: album.team.id, label: album.team.name }
        : null,
    );
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError(t("admin.galleryTitleRequired"));
      return;
    }
    if (images.length === 0) {
      setError(t("admin.galleryImagesRequired"));
      return;
    }
    setSaving(true);
    setError("");
    const body = {
      title: title.trim(),
      slug: (slug.trim() || slugify(title)).toLowerCase(),
      coverUrl: coverUrl || images[0] || null,
      eventId: event?.kind === "event" ? event.id : null,
      teamId: team?.kind === "team" ? team.id : null,
      images: images.map((url) => ({ url, caption: null })),
    };
    try {
      if (editing) {
        await apiClient.updateGalleryAlbum(editing.id, body);
      } else {
        await apiClient.createGalleryAlbum(body);
      }
      resetForm();
      await load();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function removeAlbum(id: string) {
    if (!window.confirm(t("admin.galleryDeleteConfirm"))) return;
    try {
      await apiClient.deleteGalleryAlbum(id);
      if (editing?.id === id) resetForm();
      await load();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    }
  }

  if (loading) return <PageSkeleton rows={8} />;

  return (
    <PageTransition className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CmsBackLink />
          <h1 className="mt-2 font-display text-3xl font-bold text-white">
            {t("admin.galleryTitle")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.galleryHint")}</p>
        </div>
      </div>

      {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}

      <form
        onSubmit={onSubmit}
        className="space-y-4 border border-[var(--border)] bg-[#161616] p-4"
      >
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--hltv-green)]">
          {editing ? t("admin.galleryEdit") : t("admin.galleryCreate")}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t("admin.galleryAlbumTitle")}>
            <input
              className={fieldInputClass}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
          </FormField>
          <FormField label={t("admin.slug")} hint={t("admin.gallerySlugHint")}>
            <input
              className={fieldInputClass}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
              }}
              required
            />
          </FormField>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <EntitySearchField
            kind="event"
            label={t("awards.tournament")}
            value={event?.kind === "event" ? event : null}
            onChange={setEvent}
          />
          <EntitySearchField
            kind="team"
            label={t("stats.team")}
            value={team?.kind === "team" ? team : null}
            onChange={setTeam}
          />
        </div>

        <ImageUpload
          label={t("admin.galleryCover")}
          hint={t("admin.galleryCoverHint")}
          value={coverUrl}
          onChange={setCoverUrl}
        />

        <MultiImageUpload
          label={t("admin.galleryPhotos")}
          hint={t("admin.galleryPhotosHint")}
          values={images}
          onChange={setImages}
          max={48}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? t("common.loading") : editing ? t("common.save") : t("admin.galleryCreate")}
          </Button>
          {editing ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              {t("common.cancel")}
            </Button>
          ) : null}
        </div>
      </form>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("admin.galleryTitle")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {albums.length}
          </span>
        </div>
        <div>
          {albums.map((album) => {
            const cover = mediaUrl(album.coverUrl ?? album.images?.[0]?.url);
            const count = album._count?.images ?? album.images?.length ?? 0;
            return (
              <div
                key={album.id}
                className="hltv-row !grid-cols-[56px_minmax(0,1fr)_auto] !gap-3"
              >
                <span className="flex h-12 w-12 overflow-hidden border border-[var(--border)] bg-[#111]">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="m-auto text-[10px] text-zinc-600">—</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-zinc-100">
                    {album.title}
                  </span>
                  <span className="block truncate text-[11px] text-zinc-500">
                    /gallery/{album.slug}
                    {album.event ? ` · ${album.event.name}` : ""}
                    {album.team ? ` · ${album.team.name}` : ""}
                    {` · ${count} ${t("galleryPage.photos")}`}
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/gallery/${album.slug}`}
                    className="text-[11px] font-bold uppercase tracking-wider text-[var(--hltv-green)]"
                  >
                    {t("common.view")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => startEdit(album)}
                    className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200"
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeAlbum(album.id)}
                    className="text-[11px] font-bold uppercase tracking-wider text-[#e35d5d]"
                  >
                    {t("common.delete")}
                  </button>
                </span>
              </div>
            );
          })}
          {albums.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-zinc-600">{t("galleryPage.empty")}</p>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}
