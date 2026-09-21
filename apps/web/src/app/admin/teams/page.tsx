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
import { useI18n } from "@/i18n/provider";
import { apiClient, type TeamDto } from "@/shared/api/client";

export default function AdminTeamsPage() {
  return (
    <RequireCapability capability="team.manage">
      <TeamsInner />
    </RequireCapability>
  );
}

function TeamsInner() {
  const { t } = useI18n();
  const [items, setItems] = useState<TeamDto[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    country: "BY",
    region: "Belarus",
    logo: null as string | null,
  });

  const load = () =>
    apiClient
      .teams()
      .then(setItems)
      .catch((e) => setError((e as { message?: string }).message ?? t("common.error")));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await apiClient.createTeam({
        name: form.name,
        shortName: form.shortName,
        country: form.country,
        region: form.region,
        logo: form.logo || form.shortName[0] || "T",
      });
      setForm({ name: "", shortName: "", country: "BY", region: "Belarus", logo: null });
      load();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    }
  }

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{t("admin.teamsTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.teamsHint")}</p>
        </div>
        <CmsBackLink />
      </div>
      {error ? <p className="text-rose-400">{error}</p> : null}

      <AdminCard className="space-y-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          {t("admin.newTeam")}
        </h2>
        <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("admin.fullName")} hint={t("admin.fullNameHint")} htmlFor="team-name">
            <input
              id="team-name"
              className={fieldInputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </FormField>
          <FormField label={t("admin.shortTag")} hint={t("admin.shortTagHint")} htmlFor="team-short">
            <input
              id="team-short"
              className={fieldInputClass}
              maxLength={8}
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value })}
              required
            />
          </FormField>
          <div className="sm:col-span-2">
            <ImageUpload
              label={t("upload.logo")}
              hint={t("upload.hint")}
              value={form.logo}
              onChange={(url) => setForm((f) => ({ ...f, logo: url }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">{t("admin.createTeam")}</Button>
          </div>
        </form>
      </AdminCard>

      <div className="space-y-2">
        {items.map((team) => (
          <AdminCard key={team.id} className="flex items-center justify-between p-3">
            <div>
              <div className="font-semibold text-zinc-200">{team.name}</div>
              <div className="text-xs text-zinc-500">
                {team.slug} · #{team.ranking}
              </div>
            </div>
            <Link href={`/teams/${team.slug}`} className="text-xs font-semibold text-[var(--hltv-green)]">
              {t("admin.viewPage")}
            </Link>
          </AdminCard>
        ))}
      </div>
    </PageTransition>
  );
}
