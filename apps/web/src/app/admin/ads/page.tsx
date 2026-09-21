"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AD_FORMATS, AD_SLOTS, AD_STATUSES } from "@byhltv/shared";

import { AdminCard } from "@/components/admin/shell/admin-card";
import { PageTransition } from "@/components/effects/page-transition";
import { Button } from "@/components/ui/button";
import { FormField, fieldInputClass } from "@/components/ui/form-field";
import { ImageUpload } from "@/components/ui/image-upload";
import { PageSkeleton } from "@/components/ui/skeleton";
import { RequireCapability } from "@/features/auth/require-capability";
import { useI18n } from "@/i18n/provider";
import { adFormatLabel, adStatusLabel } from "@/lib/ads-labels";
import { cn } from "@/lib/utils";
import {
  apiClient,
  type AdDto,
  type AdFormat,
  type AdPlacementSlot,
  type AdStatus,
} from "@/shared/api/client";

function emptyForm() {
  return {
    title: "",
    slug: "",
    format: "BANNER" as AdFormat,
    status: "DRAFT" as AdStatus,
    imageUrl: null as string | null,
    href: "https://",
    excerpt: "",
    body: "",
    sponsorLabel: "Реклама",
    weight: "1",
    startAt: "",
    endAt: "",
    slots: ["HOME_SIDEBAR"] as AdPlacementSlot[],
  };
}

function AdForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: AdDto | null;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => {
    if (!initial) return emptyForm();
    return {
      title: initial.title,
      slug: initial.slug ?? "",
      format: initial.format,
      status: initial.status,
      imageUrl: initial.imageUrl ?? null,
      href: initial.href,
      excerpt: initial.excerpt ?? "",
      body: initial.body ?? "",
      sponsorLabel: initial.sponsorLabel || "Реклама",
      weight: String(initial.weight ?? 1),
      startAt: initial.startAt ? initial.startAt.slice(0, 16) : "",
      endAt: initial.endAt ? initial.endAt.slice(0, 16) : "",
      slots: (initial.placements ?? []).map((p) => p.slot),
    };
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleSlot(slot: AdPlacementSlot) {
    setForm((f) => ({
      ...f,
      slots: f.slots.includes(slot) ? f.slots.filter((s) => s !== slot) : [...f.slots, slot],
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.href.trim() || form.slots.length === 0) {
      setError(t("admin.adsFormInvalid"));
      return;
    }
    setSaving(true);
    setError("");
    const body = {
      title: form.title.trim(),
      slug: form.slug.trim() || null,
      format: form.format,
      status: form.status,
      imageUrl: form.imageUrl,
      href: form.href.trim(),
      excerpt: form.excerpt.trim() || null,
      body: form.body.trim() || null,
      sponsorLabel: form.sponsorLabel.trim() || "Реклама",
      weight: Number(form.weight) || 1,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      slots: form.slots,
    };
    try {
      if (initial) await apiClient.updateAd(initial.id, body);
      else await apiClient.createAd(body);
      onSaved();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={t("admin.adsName")}>
          <input
            className={fieldInputClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </FormField>
        <FormField label={t("admin.slug")}>
          <input
            className={fieldInputClass}
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </FormField>
        <FormField label={t("admin.adsFormat")}>
          <select
            className={fieldInputClass}
            value={form.format}
            onChange={(e) => setForm({ ...form, format: e.target.value as AdFormat })}
          >
            {AD_FORMATS.map((f) => (
              <option key={f} value={f}>
                {adFormatLabel(f, t)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={t("admin.adsStatus")}>
          <select
            className={fieldInputClass}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as AdStatus })}
          >
            {AD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {adStatusLabel(s, t)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={t("admin.adsHref")}>
          <input
            className={fieldInputClass}
            value={form.href}
            onChange={(e) => setForm({ ...form, href: e.target.value })}
            required
          />
        </FormField>
        <FormField label={t("admin.adsWeight")}>
          <input
            className={fieldInputClass}
            type="number"
            min={1}
            max={100}
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
          />
        </FormField>
        <FormField label={t("admin.adsStart")}>
          <input
            className={fieldInputClass}
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          />
        </FormField>
        <FormField label={t("admin.adsEnd")}>
          <input
            className={fieldInputClass}
            type="datetime-local"
            value={form.endAt}
            onChange={(e) => setForm({ ...form, endAt: e.target.value })}
          />
        </FormField>
      </div>

      <FormField label={t("admin.adsSponsorLabel")}>
        <input
          className={fieldInputClass}
          value={form.sponsorLabel}
          onChange={(e) => setForm({ ...form, sponsorLabel: e.target.value })}
        />
      </FormField>
      <FormField label={t("admin.adsExcerpt")}>
        <textarea
          className={fieldInputClass}
          rows={2}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        />
      </FormField>
      <FormField label={t("admin.adsBody")}>
        <textarea
          className={fieldInputClass}
          rows={4}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
      </FormField>

      <ImageUpload
        label={t("admin.adsImage")}
        value={form.imageUrl}
        onChange={(url) => setForm({ ...form, imageUrl: url })}
        variant="cover"
        fit="cover"
      />

      <div>
        <div className="mb-2 text-xs uppercase text-zinc-500">{t("admin.adsSlots")}</div>
        <div className="flex flex-wrap gap-1.5">
          {AD_SLOTS.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => toggleSlot(slot)}
              className={cn(
                "border px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                form.slots.includes(slot)
                  ? "border-[var(--hltv-green)] bg-[var(--hltv-green)]/10 text-[var(--hltv-green)]"
                  : "border-[#2a2a2a] text-zinc-500",
              )}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? t("common.loading") : t("common.save")}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export default function AdminAdsPage() {
  return (
    <RequireCapability capability="ads.manage">
      <AdsInner />
    </RequireCapability>
  );
}

function AdsInner() {
  const { t } = useI18n();
  const [items, setItems] = useState<AdDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdDto | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    try {
      const list = await apiClient.adminAds();
      setItems(list);
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

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((a) => a.status === statusFilter);
  }, [items, statusFilter]);

  async function remove(id: string) {
    if (!window.confirm(t("admin.adsDeleteConfirm"))) return;
    await apiClient.deleteAd(id);
    if (editing?.id === id) {
      setEditing(null);
      setShowForm(false);
    }
    await load();
  }

  function totals(ad: AdDto) {
    const stats = ad.stats ?? [];
    const impressions = stats.reduce((s, r) => s + r.impressions, 0);
    const clicks = stats.reduce((s, r) => s + r.clicks, 0);
    return { impressions, clicks, ctr: impressions ? clicks / impressions : 0 };
  }

  if (loading) return <PageSkeleton rows={8} />;

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{t("admin.adsTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.adsHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/ads/analytics"
            className="rounded-lg border border-[#2a2a2a] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:border-[var(--hltv-green)]"
          >
            {t("admin.adsAnalytics")}
          </Link>
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            {t("admin.adsCreate")}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}

      {showForm ? (
        <AdminCard title={editing ? t("admin.adsEdit") : t("admin.adsCreate")}>
          <AdForm
            key={editing?.id ?? "new"}
            initial={editing}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSaved={async () => {
              setShowForm(false);
              setEditing(null);
              await load();
            }}
          />
        </AdminCard>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {["all", ...AD_STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={cn(
              "border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              statusFilter === s
                ? "border-[var(--hltv-green)] text-[var(--hltv-green)]"
                : "border-[#2a2a2a] text-zinc-500",
            )}
          >
            {s === "all" ? t("admin.adsAllAds") : adStatusLabel(s, t)}
          </button>
        ))}
      </div>

      <AdminCard title={t("admin.adsTitle")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[#2a2a2a] text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-2 py-2">{t("admin.adsName")}</th>
                <th className="px-2 py-2">{t("admin.adsFormat")}</th>
                <th className="px-2 py-2">{t("admin.adsStatus")}</th>
                <th className="px-2 py-2">{t("admin.adsSlots")}</th>
                <th className="px-2 py-2 text-right">Imp</th>
                <th className="px-2 py-2 text-right">Clk</th>
                <th className="px-2 py-2 text-right">CTR</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((ad) => {
                const st = totals(ad);
                return (
                  <tr key={ad.id} className="border-b border-[#222]">
                    <td className="px-2 py-2 font-medium text-zinc-100">{ad.title}</td>
                    <td className="px-2 py-2 text-xs text-zinc-400">{adFormatLabel(ad.format, t)}</td>
                    <td className="px-2 py-2 text-xs text-zinc-400">{adStatusLabel(ad.status, t)}</td>
                    <td className="px-2 py-2 text-[10px] text-zinc-500">
                      {(ad.placements ?? []).map((p) => p.slot).join(", ") || "—"}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-xs">{st.impressions}</td>
                    <td className="px-2 py-2 text-right font-mono text-xs">{st.clicks}</td>
                    <td className="px-2 py-2 text-right font-mono text-xs">
                      {(st.ctr * 100).toFixed(1)}%
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        className="mr-2 text-[11px] font-bold uppercase text-zinc-400 hover:text-white"
                        onClick={() => {
                          setEditing(ad);
                          setShowForm(true);
                        }}
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        className="text-[11px] font-bold uppercase text-[#e35d5d]"
                        onClick={() => void remove(ad.id)}
                      >
                        {t("common.delete")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">{t("admin.adsEmpty")}</p>
          ) : null}
        </div>
      </AdminCard>
    </PageTransition>
  );
}
