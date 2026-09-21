"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { CmsBackLink } from "@/components/admin/cms-back-link";
import { PageTransition } from "@/components/effects/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { RequireCapability } from "@/features/auth/require-capability";
import type { TranslationKey } from "@/i18n/get-dictionary";
import { useI18n } from "@/i18n/provider";
import { ImageUpload } from "@/components/ui/image-upload";
import { apiClient, type PlayerDto, type TeamDto } from "@/shared/api/client";

const ROLES = ["AWPER", "RIFLER", "IGL", "SUPPORT", "LURKER"] as const;

const formSeed = {
  nickname: "",
  realName: "",
  country: "BY",
  role: "RIFLER",
  teamId: "",
  steamId: "",
  photoUrl: "" as string | null,
  status: "ACTIVE",
};

const STATUSES = ["ACTIVE", "INACTIVE", "RETIRED"] as const;

const FIELD_KEYS: Array<["nickname" | "realName" | "country" | "steamId", TranslationKey]> = [
  ["nickname", "admin.nickname"],
  ["realName", "admin.realName"],
  ["country", "admin.country"],
  ["steamId", "admin.steamId"],
];

export default function AdminPlayersPage() {
  return (
    <RequireCapability capability="player.manage">
      <PlayersInner />
    </RequireCapability>
  );
}

function PlayersInner() {
  const { t } = useI18n();
  const [players, setPlayers] = useState<PlayerDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<PlayerDto | null>(null);
  const [form, setForm] = useState(formSeed);

  const load = async () => {
    try {
      const [p, teamRows] = await Promise.all([apiClient.adminPlayers(), apiClient.teams()]);
      setPlayers(p);
      setTeams(teamRows);
    } catch (e) {
      setError((e as { message?: string }).message ?? "Failed");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCreate() {
    setEditing(null);
    setForm({
      ...formSeed,
      teamId: teams[0]?.id ?? "",
    });
  }

  function startEdit(p: PlayerDto) {
    setEditing(p);
    setForm({
      nickname: p.nickname,
      realName: p.realName,
      country: p.country,
      role: p.role,
      teamId: p.teamId ?? p.team?.id ?? "",
      steamId: p.steamId ?? "",
      photoUrl: p.photoUrl ?? null,
      status: p.status ?? "ACTIVE",
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const body = {
      nickname: form.nickname,
      realName: form.realName,
      country: form.country,
      role: form.role,
      teamId: form.teamId || null,
      steamId: form.steamId || null,
      photoUrl: form.photoUrl || null,
      photo: form.nickname[0]?.toUpperCase() ?? "P",
      status: form.status,
    };
    try {
      if (editing) await apiClient.updatePlayer(editing.id, body);
      else await apiClient.createPlayer(body);
      setEditing(null);
      startCreate();
      await load();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Save failed");
    }
  }

  if (!players.length && !error) return <PageSkeleton />;

  return (
    <PageTransition className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold uppercase text-white">{t("admin.playersCms")}</h1>
        <CmsBackLink />
      </div>
      {error ? <p className="text-rose-400">{error}</p> : null}

      <form onSubmit={save} className="grid gap-2 border border-[var(--border)] bg-[#1b1b1b] p-4 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-sm uppercase text-zinc-500">
          {editing ? `${t("admin.editPlayer")} ${editing.nickname}` : t("admin.createPlayer")}
        </h2>
        {FIELD_KEYS.map(([key, labelKey]) => (
          <label key={key} className="text-xs uppercase text-zinc-500">
            {t(labelKey)}
            <input
              className="mt-1 w-full border border-[var(--border)] bg-[#121212] px-2 py-2 text-sm"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              required={key === "nickname" || key === "realName"}
            />
          </label>
        ))}
        <label className="text-xs uppercase text-zinc-500">
          {t("admin.role")}
          <select
            className="mt-1 w-full border border-[var(--border)] bg-[#121212] px-2 py-2 text-sm"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase text-zinc-500">
          {t("admin.playerStatus")}
          <select
            className="mt-1 w-full border border-[var(--border)] bg-[#121212] px-2 py-2 text-sm"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase text-zinc-500">
          {t("admin.team")}
          <select
            className="mt-1 w-full border border-[var(--border)] bg-[#121212] px-2 py-2 text-sm"
            value={form.teamId}
            onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
          >
            <option value="">{t("common.none")}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <ImageUpload
            label={t("upload.photo")}
            hint={t("upload.hint")}
            value={form.photoUrl}
            onChange={(url) => setForm((f) => ({ ...f, photoUrl: url }))}
          />
        </div>
        <div className="sm:col-span-2 flex gap-2">
          <Button type="submit">{editing ? t("common.update") : t("common.create")}</Button>
          <Button type="button" variant="outline" onClick={startCreate}>
            {t("common.reset")}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 border border-[var(--border)] bg-[#1b1b1b] p-3"
          >
            <div className="flex items-center gap-3">
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photoUrl} alt="" className="h-10 w-10 object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center bg-[#333] font-bold">
                  {p.photo}
                </div>
              )}
              <div>
                <Link href={`/players/${p.slug}`} className="font-semibold text-white hover:text-[var(--hltv-green)]">
                  {p.nickname}
                </Link>
                <div className="text-xs text-zinc-500">
                  {p.realName} · {p.team?.name ?? "FA"} · Steam {p.steamId ?? "—"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{p.status ?? "ACTIVE"}</Badge>
              <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                {t("common.edit")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => apiClient.deletePlayer(p.id).then(load)}
              >
                {t("admin.deactivate")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => apiClient.recomputePlayer(p.id).then(load)}
              >
                {t("admin.recompute")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
}
