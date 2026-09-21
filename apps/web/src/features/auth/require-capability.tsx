"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Capability } from "@byhltv/shared";

import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";

export function RequireCapability({
  capability,
  anyOf,
  children,
  fallback,
}: {
  capability?: Capability;
  anyOf?: Capability[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, loading, can } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="mx-auto max-w-[1320px] px-4 py-16 text-sm text-zinc-400">
        {t("common.loading")}
      </div>
    );
  }

  if (!user) {
    return (
      fallback ?? (
        <div className="mx-auto max-w-[1320px] px-4 py-16">
          <p className="text-sm text-zinc-300">{t("common.signInRequired")}</p>
          <Link href="/login" className="mt-3 inline-block text-[var(--hltv-green)] hover:underline">
            {t("auth.signIn")}
          </Link>
        </div>
      )
    );
  }

  const ok = capability
    ? can(capability)
    : anyOf?.some((c) => can(c)) ?? false;

  if (!ok) {
    return (
      fallback ?? (
        <div className="mx-auto max-w-[1320px] px-4 py-16 text-sm text-zinc-400">
          {t("common.noPermission")}
        </div>
      )
    );
  }

  return <>{children}</>;
}
