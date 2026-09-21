"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageTransition } from "@/components/effects/page-transition";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import { apiClient, type PublicUserDto } from "@/shared/api/client";

export default function PublicUserPage() {
  const params = useParams<{ username: string }>();
  const { t, locale } = useI18n();
  const [user, setUser] = useState<PublicUserDto | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiClient
      .publicUser(params.username)
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch((e) => {
        if (!cancelled) setError((e as { message?: string }).message ?? t("common.notFound"));
      });
    return () => {
      cancelled = true;
    };
  }, [params.username, t]);

  if (error) {
    return (
      <PageTransition className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-rose-400">{error}</p>
        <Link href="/" className="mt-4 inline-block text-[var(--hltv-green)] hover:underline">
          {t("common.backHome")}
        </Link>
      </PageTransition>
    );
  }

  if (!user) return <PageSkeleton rows={4} />;

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Card className="gradient-border space-y-3 p-6">
        <div className="flex flex-wrap items-center gap-3">
          {mediaUrl(user.avatarUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(user.avatarUrl)}
              alt=""
              className="h-16 w-16 border border-[var(--border)] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center bg-[#222] font-display text-xl font-bold text-[var(--hltv-green)]">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-bold text-white">{user.displayName}</h1>
              <Badge variant="cyan">{user.role}</Badge>
            </div>
            <p className="mt-1 text-zinc-500">@{user.username}</p>
          </div>
        </div>
        {user.bio ? <p className="text-zinc-300">{user.bio}</p> : (
          <p className="text-sm text-zinc-600">{t("profile.noBio")}</p>
        )}
        <p className="text-xs text-zinc-600">
          {t("profile.memberSince")}{" "}
          {new Date(user.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : locale === "ru" ? "ru-RU" : "be-BY")}
        </p>
      </Card>
    </PageTransition>
  );
}
