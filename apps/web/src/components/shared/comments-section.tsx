"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import { apiClient } from "@/shared/api/client";

export type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  user: { username: string; displayName: string };
};

export function CommentsSection({
  newsId,
  matchId,
  initial,
}: {
  newsId?: string;
  matchId?: string;
  initial?: CommentItem[];
}) {
  const { user, can } = useAuth();
  const { t } = useI18n();
  const [comments, setComments] = useState<CommentItem[]>(initial ?? []);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reported, setReported] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initial?.length) return;
    const qs = newsId ? `newsId=${newsId}` : matchId ? `matchId=${matchId}` : "";
    if (!qs) return;
    apiClient
      .comments(qs)
      .then(setComments)
      .catch(() => setComments([]));
  }, [newsId, matchId, initial]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setBusy(true);
    setError("");
    try {
      const created = await apiClient.createComment({
        target: newsId ? "NEWS" : "MATCH",
        newsId,
        matchId,
        body: body.trim(),
      });
      setComments((prev) => [created, ...prev]);
      setBody("");
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function hide(id: string) {
    await apiClient.hideComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  async function report(id: string) {
    if (!user || reported[id]) return;
    try {
      await apiClient.createReport({
        targetType: "COMMENT",
        targetId: id,
        reason: "User report from comments",
      });
      setReported((prev) => ({ ...prev, [id]: true }));
    } catch {
      /* ignore duplicate / offline */
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-white">{t("comments.title")}</h2>
      {!user ? (
        <p className="text-sm text-zinc-500">
          <Link href="/login" className="text-[var(--hltv-green)] hover:underline">
            {t("auth.signIn")}
          </Link>{" "}
          {t("comments.signInToComment")}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full border border-[var(--border)] bg-[#111] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[var(--hltv-green)]"
            placeholder={t("comments.placeholder")}
          />
          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
          <Button type="submit" size="sm" disabled={busy || !body.trim()}>
            {t("comments.post")}
          </Button>
        </form>
      )}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-zinc-600">{t("comments.empty")}</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="border border-[var(--border)] bg-[#1b1b1b] p-3">
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-zinc-500">
                <Link
                  href={`/users/${c.user.username}`}
                  className="font-semibold text-zinc-300 transition-colors hover:text-[var(--hltv-green)]"
                >
                  {c.user.displayName}
                </Link>
                <Link
                  href={`/users/${c.user.username}`}
                  className="transition-colors hover:text-[var(--hltv-green)]"
                >
                  @{c.user.username}
                </Link>
              </div>
              <p className="text-sm text-zinc-300">{c.body}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {can("comment.moderate") ? (
                  <button
                    type="button"
                    onClick={() => hide(c.id)}
                    className="text-[10px] uppercase text-rose-400 hover:underline"
                  >
                    {t("comments.hide")}
                  </button>
                ) : null}
                {user && can("report.create") ? (
                  <button
                    type="button"
                    onClick={() => report(c.id)}
                    disabled={reported[c.id]}
                    className="text-[10px] uppercase text-zinc-500 hover:text-amber-400 hover:underline disabled:opacity-50"
                  >
                    {reported[c.id] ? t("comments.reported") : t("comments.report")}
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
