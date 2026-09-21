"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageTransition } from "@/components/effects/page-transition";
import { useAuth } from "@/features/auth/auth-provider";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { apiClient, type ForumCategoryDto } from "@/shared/api/client";

export function ForumCategoryView({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState<ForumCategoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const cat = await apiClient.forumCategory(slug);
      setCategory(cat);
    } catch {
      setCategory(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function createThread(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const thread = await apiClient.createForumThread({
        categorySlug: slug,
        title: title.trim(),
        body: body.trim(),
      });
      router.push(`/forums/thread/${thread.id}`);
    } catch (err) {
      setError(err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : t("forums.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageSkeleton rows={8} />;
  if (!category) {
    return (
      <PageTransition className="mx-auto max-w-[1100px] px-3 py-10 sm:px-4">
        <p className="text-sm text-zinc-500">{t("forums.notFound")}</p>
        <Link href="/forums" className="mt-3 inline-block text-sm text-[var(--hltv-green)]">
          ← {t("forums.back")}
        </Link>
      </PageTransition>
    );
  }

  const threads = category.threads ?? [];

  return (
    <PageTransition className="mx-auto max-w-[1100px] space-y-4 px-3 py-6 sm:px-4 lg:px-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/forums"
            className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 hover:text-[var(--hltv-green)]"
          >
            ← {t("forums.back")}
          </Link>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase text-white">{category.name}</h1>
          {category.description ? (
            <p className="mt-1 text-sm text-zinc-500">{category.description}</p>
          ) : null}
        </div>
        {user ? (
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="border border-[var(--hltv-green)] bg-[var(--hltv-green)]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--hltv-green)] hover:bg-[var(--hltv-green)]/20"
          >
            {showNew ? t("forums.cancel") : t("forums.newThread")}
          </button>
        ) : (
          <Link
            href="/login"
            className="border border-[var(--border)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200"
          >
            {t("forums.loginToPost")}
          </Link>
        )}
      </div>

      {showNew && user ? (
        <form onSubmit={createThread} className="space-y-3 border border-[var(--border)] bg-[#161616] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--hltv-green)]">
            {t("forums.newThread")}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("forums.threadTitle")}
            maxLength={160}
            className="w-full border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[var(--hltv-green)]"
            required
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("forums.threadBody")}
            rows={5}
            className="w-full resize-y border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[var(--hltv-green)]"
            required
          />
          {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="bg-[var(--hltv-green)] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-black disabled:opacity-50"
          >
            {submitting ? t("common.loading") : t("forums.create")}
          </button>
        </form>
      ) : null}

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("forums.threads")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {threads.length}
          </span>
        </div>

        <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(0,0.9fr)_64px_100px] gap-2 border-b border-[var(--border)] bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 lg:grid">
          <span>{t("forums.topic")}</span>
          <span>{t("forums.author")}</span>
          <span className="text-right">{t("forums.posts")}</span>
          <span className="text-right">{t("forums.updated")}</span>
        </div>

        <div>
          {threads.map((thread) => {
            const posts = thread._count?.posts ?? thread.posts?.length ?? 0;
            return (
              <Link
                key={thread.id}
                href={`/forums/thread/${thread.id}`}
                className={cn(
                  "hltv-row group !grid-cols-[minmax(0,1fr)_auto] !gap-2 lg:!grid-cols-[minmax(0,1.8fr)_minmax(0,0.9fr)_64px_100px]",
                  thread.pinned && "bg-[#1a1e14]",
                )}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {thread.pinned ? (
                      <span className="border border-[var(--hltv-green)]/40 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--hltv-green)]">
                        {t("forums.pinned")}
                      </span>
                    ) : null}
                    {thread.locked ? (
                      <span className="border border-zinc-600 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        {t("forums.locked")}
                      </span>
                    ) : null}
                    <span className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                      {thread.title}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-zinc-600 lg:hidden">
                    {thread.author.displayName} · {posts} ·{" "}
                    {thread.updatedAt ? formatRelative(thread.updatedAt, locale) : "—"}
                  </span>
                </span>
                <span className="hidden truncate text-[12px] text-zinc-400 lg:block">
                  {thread.author.displayName}
                </span>
                <span className="hidden text-right font-mono text-[12px] text-zinc-400 lg:block">
                  {posts}
                </span>
                <span className="hidden text-right font-mono text-[11px] text-zinc-500 lg:block">
                  {thread.updatedAt ? formatRelative(thread.updatedAt, locale) : "—"}
                </span>
              </Link>
            );
          })}

          {threads.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-zinc-600">{t("forums.emptyThreads")}</p>
          ) : null}
        </div>
      </section>
    </PageTransition>
  );
}
