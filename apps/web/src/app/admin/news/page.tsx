"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { CmsBackLink } from "@/components/admin/cms-back-link";
import { PageTransition } from "@/components/effects/page-transition";
import { RequireCapability } from "@/features/auth/require-capability";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/shell/admin-card";
import { FormField, fieldInputClass } from "@/components/ui/form-field";
import { ImageUpload } from "@/components/ui/image-upload";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { useI18n } from "@/i18n/provider";
import { LOCALE_LABELS, LOCALE_SHORT, LOCALES, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { apiClient } from "@/shared/api/client";

type NewsRow = {
  id: string;
  slug: string;
  category: string;
  published: boolean;
  coverImage?: string | null;
  galleryImages?: string | string[];
  translations?: Array<{ locale: string; title: string; excerpt?: string; content?: string }>;
};

type LocaleFields = { title: string; excerpt: string; content: string };

const emptyLocale = (): LocaleFields => ({ title: "", excerpt: "", content: "" });

function emptyTranslations(): Record<Locale, LocaleFields> {
  return { be: emptyLocale(), ru: emptyLocale(), en: emptyLocale() };
}

function parseGallery(raw: NewsRow["galleryImages"]): string[] {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminNewsPage() {
  return (
    <RequireCapability capability="news.publish">
      <NewsInner />
    </RequireCapability>
  );
}

function NewsInner() {
  const { t } = useI18n();
  const [items, setItems] = useState<NewsRow[]>([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("NEWS");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [langTab, setLangTab] = useState<Locale>("ru");
  const [tr, setTr] = useState<Record<Locale, LocaleFields>>(emptyTranslations);

  const load = () =>
    apiClient
      .adminNews()
      .then((rows) => setItems(rows as NewsRow[]))
      .catch((e) => setError((e as { message?: string }).message ?? t("common.error")));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEditingId(null);
    setSlug("");
    setCategory("NEWS");
    setCoverImage(null);
    setGallery([]);
    setLangTab("ru");
    setTr(emptyTranslations());
  }

  function startEdit(item: NewsRow) {
    const next = emptyTranslations();
    for (const row of item.translations ?? []) {
      const loc = row.locale as Locale;
      if (LOCALES.includes(loc)) {
        next[loc] = {
          title: row.title ?? "",
          excerpt: row.excerpt ?? "",
          content: row.content ?? "",
        };
      }
    }
    setEditingId(item.id);
    setSlug(item.slug);
    setCategory(item.category);
    setCoverImage(item.coverImage ?? null);
    setGallery(parseGallery(item.galleryImages));
    setTr(next);
    setLangTab(
      (LOCALES.find((l) => next[l].title.trim()) as Locale | undefined) ?? "ru",
    );
  }

  function patchLocale(locale: Locale, patch: Partial<LocaleFields>) {
    setTr((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
  }

  function copyFrom(source: Locale) {
    const src = tr[source];
    if (!src.title && !src.excerpt && !src.content) return;
    setTr((prev) => ({
      ...prev,
      [langTab]: { ...src },
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    for (const loc of LOCALES) {
      if (!tr[loc].title.trim() || !tr[loc].excerpt.trim() || !tr[loc].content.trim()) {
        setError(t("admin.newsNeedAllLocales"));
        setLangTab(loc);
        return;
      }
    }
    const body = {
      slug,
      category,
      featured: false,
      coverImage: coverImage || null,
      galleryImages: gallery,
      tags: [],
      translations: LOCALES.map((locale) => ({
        locale,
        title: tr[locale].title.trim(),
        excerpt: tr[locale].excerpt.trim(),
        content: tr[locale].content.trim(),
      })),
    };
    try {
      if (editingId) {
        await apiClient.updateNews(editingId, body);
      } else {
        await apiClient.createNews(body);
      }
      resetForm();
      load();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    }
  }

  async function remove(id: string) {
    await apiClient.deleteNews(id);
    if (editingId === id) resetForm();
    load();
  }

  const current = tr[langTab];

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{t("admin.newsEditor")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.newsEditorHint")}</p>
        </div>
        <CmsBackLink />
      </div>
      {error ? <p className="text-rose-400">{error}</p> : null}

      <AdminCard className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            {editingId ? t("admin.editArticle") : t("admin.newArticle")}
          </h2>
          {editingId ? (
            <button
              type="button"
              className="text-xs text-zinc-500 hover:text-zinc-300"
              onClick={resetForm}
            >
              {t("common.cancel")}
            </button>
          ) : null}
        </div>
        <form onSubmit={onSubmit} className="grid gap-4">
          <FormField label={t("admin.slug")} hint={t("admin.slugHint")} htmlFor="news-slug">
            <input
              id="news-slug"
              className={fieldInputClass}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </FormField>
          <FormField label={t("admin.category")} htmlFor="news-cat">
            <select
              id="news-cat"
              className={fieldInputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="NEWS">{t("news.categories.news")}</option>
              <option value="INTERVIEW">{t("news.categories.interview")}</option>
              <option value="ANALYSIS">{t("news.categories.analysis")}</option>
              <option value="TRANSFER">{t("news.categories.transfer")}</option>
            </select>
          </FormField>

          <div className="space-y-3 border border-[var(--border)] bg-[#0f0f0f] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {t("admin.newsTranslations")}
              </div>
              <p className="text-[11px] text-zinc-600">{t("admin.newsTranslationsHint")}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {LOCALES.map((loc) => {
                const filled = Boolean(
                  tr[loc].title.trim() && tr[loc].excerpt.trim() && tr[loc].content.trim(),
                );
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLangTab(loc)}
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide",
                      langTab === loc
                        ? "bg-[var(--hltv-green)] text-black"
                        : "bg-[#1b1b1b] text-zinc-400 hover:text-white",
                    )}
                  >
                    {LOCALE_SHORT[loc]}
                    <span
                      className={cn(
                        "ml-1.5 inline-block size-1.5 rounded-full",
                        filled ? "bg-emerald-400" : "bg-zinc-600",
                      )}
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="text-zinc-500">
                {t("admin.newsEditingLocale")}: {LOCALE_LABELS[langTab]}
              </span>
              {LOCALES.filter((l) => l !== langTab).map((src) => (
                <button
                  key={src}
                  type="button"
                  className="text-[var(--hltv-green)] hover:underline"
                  onClick={() => copyFrom(src)}
                >
                  {t("admin.newsCopyFrom")} {LOCALE_SHORT[src]}
                </button>
              ))}
            </div>

            <FormField
              label={t("admin.headline")}
              hint={t("admin.headlineHint")}
              htmlFor={`news-title-${langTab}`}
            >
              <input
                id={`news-title-${langTab}`}
                className={fieldInputClass}
                value={current.title}
                onChange={(e) => patchLocale(langTab, { title: e.target.value })}
                required={langTab === "ru"}
              />
            </FormField>
            <FormField
              label={t("admin.summary")}
              hint={t("admin.summaryHint")}
              htmlFor={`news-excerpt-${langTab}`}
            >
              <input
                id={`news-excerpt-${langTab}`}
                className={fieldInputClass}
                value={current.excerpt}
                onChange={(e) => patchLocale(langTab, { excerpt: e.target.value })}
                required={langTab === "ru"}
              />
            </FormField>
            <FormField
              label={t("admin.body")}
              hint={t("admin.bodyHint")}
              htmlFor={`news-body-${langTab}`}
            >
              <textarea
                id={`news-body-${langTab}`}
                className={fieldInputClass}
                rows={6}
                value={current.content}
                onChange={(e) => patchLocale(langTab, { content: e.target.value })}
                required={langTab === "ru"}
              />
            </FormField>
          </div>

          <ImageUpload
            label={t("upload.cover")}
            hint={t("upload.hint")}
            value={coverImage}
            onChange={setCoverImage}
            fit="cover"
            variant="cover"
          />
          <MultiImageUpload
            label={t("upload.gallery")}
            hint={t("upload.galleryHint")}
            values={gallery}
            onChange={setGallery}
            max={12}
          />
          <Button type="submit">
            {editingId ? t("common.save") : t("admin.publishArticle")}
          </Button>
        </form>
      </AdminCard>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          {t("admin.publishedArticles")}
        </h2>
        {items.map((item) => {
          const title =
            item.translations?.find((x) => x.locale === "ru")?.title ??
            item.translations?.find((x) => x.locale === "be")?.title ??
            item.translations?.[0]?.title ??
            item.slug;
          const locales = (item.translations ?? []).map((x) => x.locale.toUpperCase()).join(" · ");
          return (
            <AdminCard key={item.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <div className="font-semibold text-zinc-200">{title}</div>
                <div className="text-xs text-zinc-500">
                  /news/{item.slug} · {item.category}
                  {locales ? ` · ${locales}` : ""}
                  {parseGallery(item.galleryImages).length
                    ? ` · ${parseGallery(item.galleryImages).length} photos`
                    : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => startEdit(item)}>
                  {t("common.edit")}
                </Button>
                <Link
                  href={`/news/${item.slug}`}
                  className="inline-flex h-8 items-center px-3 text-xs font-bold uppercase text-[var(--hltv-green)]"
                >
                  {t("common.view")}
                </Link>
                <Button size="sm" variant="outline" onClick={() => void remove(item.id)}>
                  {t("common.delete")}
                </Button>
              </div>
            </AdminCard>
          );
        })}
      </div>
    </PageTransition>
  );
}
