"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Menu, X } from "lucide-react";

import { useAuth } from "@/features/auth/auth-provider";
import { getStaffDeskItems } from "@/features/auth/staff-desk";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const { t } = useI18n();
  const { can, user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = useMemo(
    () => getStaffDeskItems(can, user?.role ?? "").filter((i) => i.href.startsWith("/admin")),
    [can, user?.role],
  );

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
      <Link
        href="/admin"
        onClick={() => setOpen(false)}
        className={cn(
          "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          pathname === "/admin"
            ? "bg-[var(--hltv-green)]/15 text-[var(--hltv-green)]"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
        )}
      >
        {t("admin.dashboard")}
      </Link>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--hltv-green)]/15 text-[var(--hltv-green)]"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            <Icon className="size-4 shrink-0 opacity-80" />
            <span className="truncate">{t(item.titleKey)}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-50 flex size-10 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-zinc-200 lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Menu"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Close"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[#2a2a2a] bg-[#111111] transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#2a2a2a] px-4">
          <Link href="/admin" className="font-display text-lg font-bold text-white" onClick={() => setOpen(false)}>
            ByHLTV <span className="text-[var(--hltv-green)]">Admin</span>
          </Link>
          <button
            type="button"
            className="text-zinc-500 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        {nav}
        <div className="border-t border-[#2a2a2a] px-4 py-3 text-[11px] text-zinc-600">
          {user?.displayName ?? user?.username}
          <span className="mt-0.5 block font-mono uppercase tracking-wider text-zinc-500">
            {user?.role}
          </span>
        </div>
      </aside>
    </>
  );
}
