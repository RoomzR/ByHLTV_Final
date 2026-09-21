"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { AdminCard } from "@/components/admin/shell/admin-card";
import { PageTransition } from "@/components/effects/page-transition";
import { Button } from "@/components/ui/button";
import { FormField, fieldInputClass } from "@/components/ui/form-field";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import { apiClient, type TournamentApplicationDto } from "@/shared/api/client";

export default function ApplyTournamentAdminPage() {
  const { user, can } = useAuth();
  const { t, locale } = useI18n();
  const [message, setMessage] = useState("");
  const [orgName, setOrgName] = useState("");
  const [experience, setExperience] = useState("");
  const [apps, setApps] = useState<TournamentApplicationDto[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = () => {
    if (!user) return;
    apiClient
      .myTournamentApplications()
      .then(setApps)
      .catch((e) => setError((e as { message?: string }).message ?? t("common.error")));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    try {
      await apiClient.applyTournamentAdmin({
        message: message.trim(),
        orgName: orgName.trim() || undefined,
        experience: experience.trim() || undefined,
      });
      setMessage("");
      setOrgName("");
      setExperience("");
      setOk(t("apply.submitted"));
      load();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    }
  }

  if (!user) {
    return (
      <PageTransition className="mx-auto max-w-lg py-16 text-center">
        <p className="text-zinc-400">{t("profile.loginRequired")}</p>
        <Link href="/login" className="mt-4 inline-block text-[var(--hltv-green)] hover:underline">
          {t("auth.signIn")}
        </Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{t("apply.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t("apply.subtitle")}</p>
      </div>

      {user.role === "TOURNAMENT_ADMIN" ? (
        <AdminCard>
          <p className="text-sm text-[var(--hltv-green)]">
            {t("apply.alreadyTo")}{" "}
            <Link href="/ops" className="font-semibold underline">
              {t("apply.openStaff")}
            </Link>
          </p>
        </AdminCard>
      ) : can("apply.tournament_admin") ? (
        <AdminCard title={t("apply.title")}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField label={t("apply.org")} hint={t("apply.orgHint")} htmlFor="to-org">
              <input
                id="to-org"
                className={fieldInputClass}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </FormField>
            <FormField label={t("apply.experience")} hint={t("apply.experienceHint")} htmlFor="to-exp">
              <textarea
                id="to-exp"
                className={fieldInputClass}
                rows={3}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </FormField>
            <FormField label={t("apply.why")} hint={t("apply.whyHint")} htmlFor="to-msg">
              <textarea
                id="to-msg"
                required
                minLength={20}
                className={fieldInputClass}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </FormField>
            <Button type="submit">{t("apply.submit")}</Button>
          </form>
        </AdminCard>
      ) : (
        <p className="text-sm text-zinc-500">{t("apply.cannotApply")}</p>
      )}

      {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}
      {ok ? <p className="text-sm text-[var(--hltv-green)]">{ok}</p> : null}

      <AdminCard title={t("apply.yourApps")}>
        {apps.length === 0 ? (
          <p className="text-sm text-zinc-600">{t("apply.noApps")}</p>
        ) : (
          <div className="space-y-2">
            {apps.map((a) => (
              <div key={a.id} className="rounded-lg border border-[#2a2a2a] bg-[#111] p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-mono text-[var(--hltv-green)]">{a.status}</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(a.createdAt).toLocaleString(locale)}
                  </span>
                </div>
                <p className="mt-2 text-zinc-300">{a.message}</p>
                {a.reviewNote ? (
                  <p className="mt-1 text-xs text-zinc-500">{a.reviewNote}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </PageTransition>
  );
}
