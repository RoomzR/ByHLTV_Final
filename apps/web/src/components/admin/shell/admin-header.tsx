"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";

export function AdminHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[#2a2a2a] bg-[#0f0f0f]/95 px-4 backdrop-blur sm:px-6">
      <div className="min-w-0 pl-12 lg:pl-0">
        {title ? (
          <h1 className="truncate font-display text-lg font-bold text-white sm:text-xl">{title}</h1>
        ) : (
          <h1 className="font-display text-lg font-bold text-white">{t("admin.dashboard")}</h1>
        )}
        {subtitle ? <p className="truncate text-xs text-zinc-500">{subtitle}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:border-[var(--hltv-green)] hover:text-[var(--hltv-green)]"
        >
          {t("admin.backToSite")}
        </Link>
        <span className="hidden text-right text-xs text-zinc-500 sm:block">
          <span className="block text-zinc-300">{user?.displayName}</span>
          <span className="font-mono uppercase">{user?.role}</span>
        </span>
      </div>
    </header>
  );
}
