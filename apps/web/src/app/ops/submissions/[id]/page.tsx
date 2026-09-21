"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageTransition } from "@/components/effects/page-transition";
import { Button } from "@/components/ui/button";
import { RequireCapability } from "@/features/auth/require-capability";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import { useOpsChat } from "@/hooks/use-ops-chat";
import { apiClient, type StaffMessageDto, type SubmissionDto } from "@/shared/api/client";

export default function OpsSubmissionPage() {
  return (
    <RequireCapability anyOf={["submission.create", "submission.review"]}>
      <OpsSubmissionInner />
    </RequireCapability>
  );
}

function OpsSubmissionInner() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const [sub, setSub] = useState<SubmissionDto | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const { messages: liveMessages, status: liveStatus, connected, setMessages } = useOpsChat({
    submissionId: params.id,
  });

  const load = () => {
    apiClient
      .submission(params.id)
      .then((s) => {
        setSub(s);
        setMessages(s.messages ?? []);
      })
      .catch((e) => setError((e as { message?: string }).message ?? t("common.error")));
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const msg = await apiClient.messageSubmission(params.id, body);
    setMessages((prev) => {
      const next = msg as StaffMessageDto;
      if (prev.some((m) => m.id === next.id)) return prev;
      return [...prev, next];
    });
    setBody("");
  }

  const chat = liveMessages.length ? liveMessages : (sub?.messages ?? []);
  const status = liveStatus ?? sub?.status;

  if (!user) {
    return (
      <div className="p-10 text-center">
        <Link href="/login" className="text-[var(--hltv-green)] hover:underline">
          {t("auth.signIn")}
        </Link>
      </div>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <Link href="/ops" className="text-sm text-zinc-400 hover:text-white">
        {t("ops.backStaff")}
      </Link>
      {error ? <p className="text-rose-400">{error}</p> : null}
      {sub ? (
        <>
          <h1 className="font-display text-2xl font-bold uppercase text-white">{sub.title}</h1>
          <p className="text-sm text-zinc-500">
            {sub.type} · {status}
            {connected ? " · WS" : ""}
          </p>
          <pre className="overflow-auto border border-[var(--border)] bg-[#121212] p-3 text-xs text-zinc-400">
            {typeof sub.payload === "string" ? sub.payload : JSON.stringify(sub.payload, null, 2)}
          </pre>
          <div className="space-y-2">
            <h2 className="text-sm uppercase text-zinc-500">{t("ops.chatTitle")}</h2>
            {chat.map((m: StaffMessageDto) => (
              <div key={m.id} className="border border-[var(--border)] bg-[#1b1b1b] p-3 text-sm">
                <div className="text-xs text-zinc-500">
                  {m.fromUser.displayName} · {m.fromUser.role}
                </div>
                <div className="text-zinc-200">{m.body}</div>
              </div>
            ))}
            <form onSubmit={send} className="flex gap-2">
              <input
                className="flex-1 border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("ops.messagePlaceholder")}
                required
              />
              <Button type="submit">{t("common.send")}</Button>
            </form>
          </div>
        </>
      ) : null}
    </PageTransition>
  );
}
