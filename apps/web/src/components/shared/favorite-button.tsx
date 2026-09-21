"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import { apiClient, type FavoriteDto } from "@/shared/api/client";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  matchId,
  teamId,
  playerId,
  className,
}: {
  matchId?: string;
  teamId?: string;
  playerId?: string;
  className?: string;
}) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiClient
      .favorites()
      .then((list) => {
        if (cancelled) return;
        const found = list.find(
          (f) =>
            (matchId && f.matchId === matchId) ||
            (teamId && f.teamId === teamId) ||
            (playerId && f.playerId === playerId),
        );
        setFavoriteId(found?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setFavoriteId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user, matchId, teamId, playerId]);

  if (!user) return null;

  const saved = Boolean(favoriteId);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (favoriteId) {
        await apiClient.removeFavorite(favoriteId);
        setFavoriteId(null);
      } else {
        const created = (await apiClient.addFavorite({
          matchId,
          teamId,
          playerId,
        })) as FavoriteDto;
        setFavoriteId(created.id);
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-[var(--hltv-green)]",
        saved && "text-[var(--hltv-green)]",
        className,
      )}
      aria-label={saved ? t("favorites.remove") : t("favorites.add")}
    >
      <Star className={cn("size-3.5", saved && "fill-current")} />
      {saved ? t("favorites.inFavorites") : t("favorites.add")}
    </button>
  );
}
