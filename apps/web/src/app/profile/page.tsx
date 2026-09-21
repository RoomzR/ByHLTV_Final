"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { AdminCard, AdminStatCard } from "@/components/admin/shell/admin-card";
import { PageTransition } from "@/components/effects/page-transition";
import { RoleCabinets } from "@/components/profile/role-cabinets";
import { Button } from "@/components/ui/button";
import { FormField, fieldInputClass } from "@/components/ui/form-field";
import { ImageUpload } from "@/components/ui/image-upload";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import { apiClient, type FavoriteDto } from "@/shared/api/client";

export default function ProfilePage() {
  const { user, loading, refreshMe } = useAuth();
  const { t } = useI18n();
  const [favorites, setFavorites] = useState<FavoriteDto[]>([]);
  const [unread, setUnread] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadFavorites = () => {
    if (!user) return;
    apiClient.favorites().then(setFavorites).catch(() => setFavorites([]));
  };

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? "");
    setBio(user.bio ?? "");
    setAvatarUrl(user.avatarUrl ?? null);
    loadFavorites();
    apiClient
      .notificationsUnread()
      .then((r) => setUnread(r.count))
      .catch(() => setUnread(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <div className="p-10 text-zinc-500">{t("common.loading")}</div>;
  if (!user) {
    return (
      <PageTransition className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-400">{t("profile.loginRequired")}</p>
        <Link href="/login" className="mt-4 inline-block text-[var(--hltv-green)] hover:underline">
          {t("auth.signIn")}
        </Link>
      </PageTransition>
    );
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiClient.updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl?.trim() || null,
      });
      await refreshMe();
      setMessage(t("profile.saved"));
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function removeFavorite(id: string) {
    await apiClient.removeFavorite(id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }

  const avatarSrc = mediaUrl(avatarUrl);

  return (
    <PageTransition className="space-y-6">
      <AdminCard>
        <div className="flex flex-wrap items-center gap-4">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt=""
              className="h-16 w-16 rounded-xl border border-[#2a2a2a] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#222] font-display text-xl font-bold text-[var(--hltv-green)]">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
                {user.displayName}
              </h1>
              <span className="rounded-lg border border-[#2a2a2a] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {user.role}
              </span>
            </div>
            <p className="mt-1 text-zinc-500">
              <Link href={`/users/${user.username}`} className="hover:text-[var(--hltv-green)]">
                @{user.username}
              </Link>
            </p>
            {user.email ? <p className="mt-1 text-sm text-zinc-600">{user.email}</p> : null}
          </div>
        </div>
      </AdminCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label={t("favorites.title")} value={favorites.length} />
        <AdminStatCard
          label={t("notifications.title")}
          value={unread}
          tone={unread > 0 ? "green" : "default"}
        />
        <AdminStatCard label={t("cabinets.title")} value={user.role} tone="amber" />
      </div>

      <RoleCabinets />

      <div id="edit" className="scroll-mt-24">
        <AdminCard title={t("profile.editTitle")}>
          <form onSubmit={onSave} className="space-y-4">
            <FormField label={t("profile.displayName")} hint={t("profile.displayNameHint")} htmlFor="pf-name">
              <input
                id="pf-name"
                className={fieldInputClass}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
              />
            </FormField>
            <FormField label={t("profile.bio")} hint={t("profile.bioHint")} htmlFor="pf-bio">
              <textarea
                id="pf-bio"
                className={fieldInputClass}
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
              />
            </FormField>
            <ImageUpload
              label={t("upload.avatar")}
              hint={t("upload.hint")}
              value={avatarUrl}
              onChange={setAvatarUrl}
            />
            {error ? <p className="text-sm text-[#e35d5d]">{error}</p> : null}
            {message ? <p className="text-sm text-[var(--hltv-green)]">{message}</p> : null}
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("profile.save")}
            </Button>
          </form>
        </AdminCard>
      </div>

      <div id="favorites" className="scroll-mt-24">
        <AdminCard title={t("favorites.title")}>
          {favorites.length === 0 ? (
            <p className="text-sm text-zinc-600">{t("favorites.empty")}</p>
          ) : (
            <ul className="divide-y divide-[#2a2a2a]">
              {favorites.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2.5 text-sm text-zinc-300">
                  <span className="min-w-0 truncate">
                    {f.match ? (
                      <Link
                        href={`/matches/${f.match.slug}`}
                        className="hover:text-[var(--hltv-green)]"
                      >
                        {f.match.team1.name} vs {f.match.team2.name}
                      </Link>
                    ) : null}
                    {f.team ? (
                      <Link href={`/teams/${f.team.slug}`} className="hover:text-[var(--hltv-green)]">
                        {t("favorites.team")}: {f.team.name}
                      </Link>
                    ) : null}
                    {f.player ? (
                      <Link
                        href={`/players/${f.player.slug}`}
                        className="hover:text-[var(--hltv-green)]"
                      >
                        {t("favorites.player")}: {f.player.nickname}
                      </Link>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFavorite(f.id)}
                    className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-[#e35d5d] hover:underline"
                  >
                    {t("favorites.remove")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </PageTransition>
  );
}
