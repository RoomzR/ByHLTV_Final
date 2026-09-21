"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { useAuth } from "@/features/auth/auth-provider";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { formatRelative } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { apiClient, type ForumThreadDto } from "@/shared/api/client";

function roleTone(role?: string) {
  if (!role) return "text-zinc-500";
  if (role === "SUPERADMIN" || role === "ADMIN") return "text-amber-400";
  if (role === "MODERATOR" || role === "EDITOR") return "text-[var(--hltv-green)]";
  return "text-zinc-500";
}

export function ForumThreadView({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const { user, can } = useAuth();
  const [thread, setThread] = useState<ForumThreadDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modBusy, setModBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiClient.forumThread(id);
      setThread(data);
    } catch {
      setThread(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitReply(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !thread) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.replyForumThread(thread.id, reply.trim());
      setReply("");
      await load();
    } catch (err) {
      setError(
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : t("forums.error"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLock() {
    if (!thread) return;
    setModBusy(true);
    try {
      await apiClient.forumLockThread(thread.id, !thread.locked);
      await load();
    } finally {
      setModBusy(false);
    }
  }

  async function togglePin() {
    if (!thread) return;
    setModBusy(true);
    try {
      await apiClient.forumPinThread(thread.id, !thread.pinned);
      await load();
    } finally {
      setModBusy(false);
    }
  }

  async function hidePost(postId: string) {
    setModBusy(true);
    try {
      await apiClient.forumHidePost(postId);
      await load();
    } finally {
      setModBusy(false);
    }
  }

  if (loading) return <PageSkeleton rows={8} />;
  if (!thread) {
    return (
      <PageTransition className="mx-auto max-w-[1100px] px-3 py-10 sm:px-4">
        <p className="text-sm text-zinc-500">{t("forums.notFound")}</p>
        <Link href="/forums" className="mt-3 inline-block text-sm text-[var(--hltv-green)]">
          ← {t("forums.back")}
        </Link>
      </PageTransition>
    );
  }

  const posts = thread.posts ?? [];
  const canMod = can("forum.moderate");
  const categoryHref = thread.category?.slug ? `/forums/${thread.category.slug}` : "/forums";

  return (
    <PageTransition className="mx-auto max-w-[1100px] space-y-4 px-3 py-6 sm:px-4 lg:px-5">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
          <Link href="/forums" className="hover:text-[var(--hltv-green)]">
            {t("forums.title")}
          </Link>
          <span className="text-zinc-700">/</span>
          <Link href={categoryHref} className="hover:text-[var(--hltv-green)]">
            {thread.category?.name ?? t("forums.category")}
          </Link>
        </div>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {thread.pinned ? (
                <span className="border border-[var(--hltv-green)]/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--hltv-green)]">
                  {t("forums.pinned")}
                </span>
              ) : null}
              {thread.locked ? (
                <span className="border border-zinc-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  {t("forums.locked")}
                </span>
              ) : null}
              <h1 className="font-display text-2xl font-bold uppercase text-white md:text-3xl">
                {thread.title}
              </h1>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {t("forums.startedBy")}{" "}
              <Link
                href={`/users/${thread.author.username}`}
                className="text-zinc-300 hover:text-[var(--hltv-green)]"
              >
                {thread.author.displayName}
              </Link>
              {thread.createdAt ? (
                <>
                  {" · "}
                  {formatRelative(thread.createdAt, locale)}
                </>
              ) : null}
            </p>
          </div>

          {canMod ? (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={modBusy}
                onClick={() => void togglePin()}
                className="border border-[var(--border)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
              >
                {thread.pinned ? t("forums.unpin") : t("forums.pin")}
              </button>
              <button
                type="button"
                disabled={modBusy}
                onClick={() => void toggleLock()}
                className="border border-[var(--border)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
              >
                {thread.locked ? t("forums.unlock") : t("forums.lock")}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <section className="hltv-panel">
        <div className="hltv-panel-header">
          <span>{t("forums.posts")}</span>
          <span className="font-mono text-[10px] normal-case tracking-normal text-zinc-500">
            {posts.length}
          </span>
        </div>

        <div>
          {posts.map((post, i) => (
            <article
              key={post.id}
              className="grid gap-3 border-b border-[#262626] bg-[var(--hltv-row)] px-3 py-4 even:bg-[var(--hltv-row-alt)] sm:grid-cols-[160px_minmax(0,1fr)]"
            >
              <aside className="min-w-0 border-b border-[var(--border)] pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-[#111] font-display text-sm font-bold text-[var(--hltv-green)]">
                  {post.author.displayName.slice(0, 1).toUpperCase()}
                </div>
                <Link
                  href={`/users/${post.author.username}`}
                  className="mt-2 block truncate text-[13px] font-semibold text-zinc-100 hover:text-[var(--hltv-green)]"
                >
                  {post.author.displayName}
                </Link>
                <div className="truncate text-[11px] text-zinc-600">@{post.author.username}</div>
                {post.author.role ? (
                  <div className={cn("mt-1 text-[10px] font-bold uppercase tracking-wider", roleTone(post.author.role))}>
                    {post.author.role}
                  </div>
                ) : null}
                <div className="mt-2 font-mono text-[10px] text-zinc-600">#{i + 1}</div>
              </aside>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <time className="font-mono text-[11px] text-zinc-500">
                    {formatRelative(post.createdAt, locale)}
                  </time>
                  {canMod ? (
                    <button
                      type="button"
                      disabled={modBusy}
                      onClick={() => void hidePost(post.id)}
                      className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 hover:text-[#e35d5d] disabled:opacity-50"
                    >
                      {t("forums.hide")}
                    </button>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-300">{post.body}</p>
              </div>
            </article>
          ))}

          {posts.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-zinc-600">{t("forums.emptyPosts")}</p>
          ) : null}
        </div>
      </section>

      {thread.locked ? (
        <p className="border border-[var(--border)] bg-[#161616] px-4 py-3 text-sm text-zinc-500">
          {t("forums.threadLocked")}
        </p>
      ) : user ? (
        <form onSubmit={submitReply} className="space-y-3 border border-[var(--border)] bg-[#161616] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--hltv-green)]">
            {t("forums.reply")}
          </div>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t("forums.replyPlaceholder")}
            rows={4}
            className="w-full resize-y border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[var(--hltv-green)]"
            required
          />
          {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="bg-[var(--hltv-green)] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-black disabled:opacity-50"
          >
            {submitting ? t("common.loading") : t("forums.sendReply")}
          </button>
        </form>
      ) : (
        <div className="border border-[var(--border)] bg-[#161616] px-4 py-3 text-sm text-zinc-500">
          <Link href="/login" className="font-semibold text-[var(--hltv-green)] hover:underline">
            {t("nav.login")}
          </Link>{" "}
          {t("forums.loginToReplyHint")}
        </div>
      )}
    </PageTransition>
  );
}
