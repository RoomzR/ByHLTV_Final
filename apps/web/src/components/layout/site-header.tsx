"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Radio, Search, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { AccountMenu } from "@/components/layout/account-menu";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { getStaffDeskMenuItems, STAFF_DESK_ICON_TONE } from "@/features/auth/staff-desk";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { NotificationsBell } from "@/components/shared/notifications-bell";
import { useI18n } from "@/i18n/provider";
import { NAV_LINKS, SITE } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = NAV_LINKS.filter((l) =>
  ["/matches", "/results", "/events", "/news", "/ranking", "/stats", "/live"].includes(l.href),
);

const MORE_NAV = NAV_LINKS.filter((l) => !PRIMARY_NAV.some((p) => p.href === l.href));

export function SiteHeader() {
  const pathname = usePathname();
  const { t, dict } = useI18n();
  const { user, logout, can } = useAuth();
  const [open, setOpen] = useState(false);
  const desk = user ? getStaffDeskMenuItems(can, user.role) : [];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#161616]/95 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[1320px] items-center justify-between gap-3 px-3 sm:px-4 lg:px-5">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90">
          <BrandLogo
            size={30}
            className="transition-transform duration-200 group-hover:scale-105 group-hover:drop-shadow-[0_0_10px_rgba(139,180,26,0.45)]"
          />
          <div className="leading-none">
            <div className="font-display text-[15px] font-extrabold tracking-tight text-white transition-colors duration-200 group-hover:text-[var(--hltv-green)]">
              {SITE.name}
            </div>
            <div className="mt-0.5 hidden text-[8px] uppercase tracking-[0.18em] text-zinc-500 transition-colors duration-200 group-hover:text-zinc-400 sm:block">
              {dict.site.tagline}
            </div>
          </div>
        </Link>

        <nav className="hidden h-12 items-stretch lg:flex">
          {PRIMARY_NAV.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn("nav-link", active && "nav-link-active")}
              >
                <span className="inline-flex items-center gap-1.5">
                  {"badge" in link && link.badge ? (
                    <Radio className="size-3 text-[var(--hltv-live)] transition-transform duration-200 group-hover:animate-pulse" />
                  ) : null}
                  {t(link.labelKey)}
                </span>
              </Link>
            );
          })}
          <div className="nav-more-wrap relative">
            <button type="button" className="nav-more-btn">
              {t("header.more")} ▾
            </button>
            <div className="nav-dropdown absolute left-0 top-full z-50 min-w-[180px] border border-[var(--border)] bg-[#1b1b1b] shadow-2xl">
              {MORE_NAV.map((link) => (
                <Link key={link.href} href={link.href} className="nav-dropdown-link">
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <NotificationsBell />
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={t("nav.search")}
            className="transition-colors hover:text-[var(--hltv-green)]"
          >
            <Link href="/search">
              <Search className="size-4" />
            </Link>
          </Button>
          {user ? (
            <AccountMenu className="hidden sm:block" />
          ) : (
            <Button
              asChild
              size="sm"
              className="hidden bg-[var(--hltv-green)] text-black transition-all hover:bg-[var(--by-green-bright)] hover:shadow-[0_0_14px_rgba(139,180,26,0.45)] sm:inline-flex"
            >
              <Link href="/login">{t("nav.login")}</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="transition-colors hover:text-[var(--hltv-green)] lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={t("nav.menu")}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="max-h-[min(80vh,32rem)] overflow-y-auto border-t border-[var(--border)] bg-[#161616] lg:hidden"
          >
            <div className="flex flex-col">
              {NAV_LINKS.map((link, i) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn("nav-mobile-link block", active && "nav-mobile-link-active")}
                    >
                      {t(link.labelKey)}
                    </Link>
                  </motion.div>
                );
              })}

              {user ? (
                <div className="border-t border-[var(--border)] px-3 py-3">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {user.username} · {user.role}
                  </div>
                  {desk.length > 0 ? (
                    <div className="mb-2 space-y-0.5">
                      <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hltv-green)]">
                        {t("account.desk")}
                      </div>
                      {desk.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 rounded-sm px-2 py-2 text-sm text-zinc-200 hover:bg-[#222] hover:text-[var(--hltv-green)]"
                          >
                            <Icon className={cn("size-4 shrink-0", STAFF_DESK_ICON_TONE[item.tone])} />
                            <span className="font-semibold">{t(item.titleKey)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="block rounded-sm px-2 py-2 text-sm font-semibold text-zinc-200 hover:bg-[#222] hover:text-[var(--hltv-green)]"
                  >
                    {t("account.profile")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="mt-0.5 w-full rounded-sm px-2 py-2 text-left text-sm font-semibold text-zinc-300 hover:bg-[#222] hover:text-[var(--hltv-live)]"
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              ) : (
                <div className="border-t border-[var(--border)] px-3 py-3">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="inline-flex bg-[var(--hltv-green)] px-3 py-2 text-sm font-bold uppercase text-black"
                  >
                    {t("nav.login")}
                  </Link>
                </div>
              )}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
