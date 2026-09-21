"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";

import { CmsBackLink } from "@/components/admin/cms-back-link";
import { EventLogo } from "@/components/events/event-logo";
import { PageTransition } from "@/components/effects/page-transition";
import { RequireCapability } from "@/features/auth/require-capability";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/shell/admin-card";
import { FormField, fieldInputClass } from "@/components/ui/form-field";
import { ImageUpload } from "@/components/ui/image-upload";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import { CS2_MAP_POOL } from "@/lib/maps";
import { mediaUrl } from "@/lib/media";
import { apiClient, type EventDto } from "@/shared/api/client";

type FormState = {
  slug: string;
  name: string;
  location: string;
  prizePool: string;
  tier: string;
  logo: string | null;
  coverImage: string | null;
  status: string;
};

const emptyForm = (): FormState => ({
  slug: "",
  name: "",
  location: "Minsk",
  prizePool: "10000",
  tier: "B",
  logo: null,
  coverImage: null,
  status: "UPCOMING",
});

export default function AdminEventsPage() {
  return (
    <RequireCapability anyOf={["event.manage", "event.manage_own"]}>
      <EventsInner />
    </RequireCapability>
  );
}

function EventsInner() {
  const { can } = useAuth();
  const { t } = useI18n();
  const canCreate = can("event.manage");
  const [items, setItems] = useState<EventDto[]>([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = () =>
    apiClient
      .adminEvents()
      .then(setItems)
      .catch((e) => setError((e as { message?: string }).message ?? t("common.error")));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(ev: EventDto) {
    setEditingId(ev.id);
    setForm({
      slug: ev.slug,
      name: ev.name,
      location: ev.location,
      prizePool: String(ev.prizePool ?? 0),
      tier: ev.tier,
      logo: isUpload(ev.logo) ? ev.logo : null,
      coverImage: ev.coverImage ?? null,
      status: ev.status,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await apiClient.updateEvent(editingId, {
          slug: form.slug,
          name: form.name,
          location: form.location,
          prizePool: Number(form.prizePool),
          tier: form.tier,
          logo: form.logo || form.name[0] || "E",
          coverImage: form.coverImage,
          status: form.status,
          mapPool: [...CS2_MAP_POOL],
        });
      } else {
        if (!canCreate) return;
        const start = new Date();
        const end = new Date(Date.now() + 7 * 86400000);
        await apiClient.createEvent({
          slug: form.slug,
          name: form.name,
          location: form.location,
          prizePool: Number(form.prizePool),
          tier: form.tier,
          logo: form.logo || form.name[0] || "E",
          coverImage: form.coverImage,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          status: "UPCOMING",
          teamsCount: 8,
          mapPool: [...CS2_MAP_POOL],
        });
      }
      cancelEdit();
      load();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    }
  }

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{t("admin.eventsTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.eventsHint")}</p>
        </div>
        <CmsBackLink />
      </div>
      {error ? <p className="text-rose-400">{error}</p> : null}

      {(canCreate || editingId) && (
        <AdminCard className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {editingId ? t("admin.editEvent") : t("admin.newEvent")}
            </h2>
            {editingId ? (
              <button
                type="button"
                className="text-xs text-zinc-500 hover:text-zinc-300"
                onClick={cancelEdit}
              >
                {t("common.cancel")}
              </button>
            ) : null}
          </div>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("admin.slug")} hint={t("admin.slugHint")} htmlFor="ev-slug">
              <input
                id="ev-slug"
                className={fieldInputClass}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </FormField>
            <FormField label={t("admin.displayName")} htmlFor="ev-name">
              <input
                id="ev-name"
                className={fieldInputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </FormField>
            <FormField label={t("admin.location")} htmlFor="ev-loc">
              <input
                id="ev-loc"
                className={fieldInputClass}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </FormField>
            <FormField
              label={t("admin.prizePool")}
              hint={t("admin.prizePoolHint")}
              htmlFor="ev-prize"
            >
              <input
                id="ev-prize"
                className={fieldInputClass}
                value={form.prizePool}
                onChange={(e) => setForm({ ...form, prizePool: e.target.value })}
              />
            </FormField>
            <FormField label={t("admin.tier")} htmlFor="ev-tier">
              <select
                id="ev-tier"
                className={fieldInputClass}
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
              >
                {["S", "A", "B", "C"].map((tier) => (
                  <option key={tier} value={tier}>
                    {t("admin.tier")} {tier}
                  </option>
                ))}
              </select>
            </FormField>
            {editingId ? (
              <FormField label={t("admin.eventStatus")} htmlFor="ev-status">
                <select
                  id="ev-status"
                  className={fieldInputClass}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="FINISHED">FINISHED</option>
                </select>
              </FormField>
            ) : null}
            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <ImageUpload
                label={t("upload.logo")}
                hint={t("admin.eventLogoHint")}
                value={form.logo}
                onChange={(url) => setForm((f) => ({ ...f, logo: url }))}
                fit="contain"
                variant="avatar"
              />
              <ImageUpload
                label={t("upload.cover")}
                hint={t("admin.eventCoverHint")}
                value={form.coverImage}
                onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
                fit="cover"
                variant="cover"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">
                {editingId ? t("common.save") : t("admin.createEvent")}
              </Button>
            </div>
          </form>
        </AdminCard>
      )}

      <div className="space-y-3">
        {items.map((ev) => (
          <AdminCard key={ev.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <EventLogo logo={ev.logo} name={ev.name} size="md" />
                <div className="min-w-0">
                  <div className="truncate font-semibold text-zinc-100">{ev.name}</div>
                  <div className="mt-0.5 truncate text-xs text-zinc-500">
                    {ev.slug} · {ev.status} · {t("admin.tier")} {ev.tier}
                  </div>
                </div>
                {ev.coverImage && mediaUrl(ev.coverImage) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(ev.coverImage)!}
                    alt=""
                    className="ml-auto hidden h-12 w-24 shrink-0 rounded-md border border-[#2a2a2a] object-cover lg:block"
                  />
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => startEdit(ev)}
                >
                  <Pencil className="size-3.5" />
                  {t("common.edit")}
                </Button>
                <Button asChild size="sm" className="rounded-lg">
                  <Link href={`/events/${ev.slug}`}>
                    <ExternalLink className="size-3.5" />
                    {t("admin.viewPage")}
                  </Link>
                </Button>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </PageTransition>
  );
}

function isUpload(logo?: string | null) {
  if (!logo) return false;
  return logo.startsWith("/uploads/") || logo.startsWith("http");
}
