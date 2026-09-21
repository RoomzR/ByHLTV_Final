"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Heart,
  LayoutDashboard,
  Menu,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "@/features/auth/auth-provider";
import { getStaffDeskItems, STAFF_DESK_ICON_TONE } from "@/features/auth/staff-desk";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href === "/profile") return pathname === "/profile";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CabinetSidebar() {
  const { t } = useI18n();
  const { can, user } = useAuth();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  const desk = useMemo(
    () => getStaffDeskItems(can, user?.role ?? ""),
    [can, user?.role],
  );

  const accountLinks = [
    { id: "overview", href: "/profile", titleKey: "cabinets.overview" as const, icon: LayoutDashboard },
    { id: "edit", href: "/profile#edit", titleKey: "profile.editTitle" as const, icon: UserRound },
    { id: "favorites", href: "/profile#favorites", titleKey: "favorites.title" as const, icon: Heart },
  ];

  const nav = (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
      <div>
        <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
          {t("cabinets.accountNav")}
        </div>
        <div className="flex flex-col gap-0.5">
          {accountLinks.map((item) => {
            const Icon = item.icon;
            const active =
              item.href.includes("#")
                ? pathname === "/profile"
                : isActivePath(pathname, item.href);
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
        </div>
      </div>

      {desk.length > 0 ? (
        <div>
          <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
            {t("cabinets.title")}
          </div>
          <div className="flex flex-col gap-0.5">
            {desk.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);
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
                  <Icon className={cn("size-4 shrink-0", STAFF_DESK_ICON_TONE[item.tone])} />
                  <span className="truncate">{t(item.titleKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
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
          <Link
            href="/profile"
            className="font-display text-lg font-bold text-white"
            onClick={() => setOpen(false)}
          >
            ByHLTV <span className="text-[var(--hltv-green)]">{t("cabinets.shellBrand")}</span>
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

export function CabinetHeader() {
  const { t } = useI18n();
  const { user } = useAuth();
  const pathname = usePathname() ?? "";

  const heading = pathname.startsWith("/admin")
    ? t("cabinets.adminTitle")
    : pathname.startsWith("/ops")
      ? t("cabinets.opsTitle")
      : pathname.startsWith("/mod")
        ? t("cabinets.modTitle")
        : pathname.startsWith("/apply")
          ? t("cabinets.applyTitle")
          : t("cabinets.title");

  const subtitle = pathname.startsWith("/admin")
    ? t("cabinets.adminDesc")
    : pathname.startsWith("/ops")
      ? t("cabinets.opsDesc")
      : pathname.startsWith("/mod")
        ? t("cabinets.modDesc")
        : pathname.startsWith("/apply")
          ? t("cabinets.applyDesc")
          : t("cabinets.subtitle");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[#2a2a2a] bg-[#0f0f0f]/95 px-4 backdrop-blur sm:px-6">
      <div className="min-w-0 pl-12 lg:pl-0">
        <h1 className="truncate font-display text-lg font-bold text-white sm:text-xl">{heading}</h1>
        <p className="truncate text-xs text-zinc-500">{subtitle}</p>
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

export function CabinetShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0b0b0b] text-zinc-100">
      <CabinetSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <CabinetHeader />
        <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
