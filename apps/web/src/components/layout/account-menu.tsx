"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import {
  getStaffDeskMenuItems,
  STAFF_DESK_ICON_TONE,
} from "@/features/auth/staff-desk";
import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function AccountMenu({ className }: { className?: string }) {
  const { user, logout, can } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const desk = getStaffDeskMenuItems(can, user.role);
  const display = user.displayName || user.username;
  const initial = display.trim().charAt(0).toUpperCase() || "?";
  const avatar = mediaUrl(user.avatarUrl);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "gap-1.5 px-2 transition-colors hover:text-[var(--hltv-green)]",
          open && "bg-[#222] text-[var(--hltv-green)]",
        )}
        onClick={() => setOpen((v) => !v)}
        aria-label={t("account.openMenu")}
        aria-expanded={open}
      >
        <span className="max-w-[7.5rem] truncate font-semibold">{user.username}</span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 opacity-70 transition-transform", open && "rotate-180")}
        />
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 flex max-h-[min(70vh,26rem)] w-[min(18rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#171717] shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
          >
            <div className="shrink-0 border-b border-[#2a2a2a] bg-gradient-to-br from-[rgba(139,180,26,0.12)] via-[#1b1b1b] to-[#121212] px-3 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--hltv-green)]">
                {t("account.menuTitle")}
              </div>
              <div className="mt-2 flex items-center gap-2.5">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--hltv-green)] font-display text-sm font-bold text-black">
                    {initial}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-white">{display}</div>
                  <div className="truncate text-[11px] text-zinc-500">@{user.username}</div>
                  <Badge variant="cyan" className="mt-1">
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {desk.length > 0 ? (
                <div className="border-b border-[var(--border)] p-1.5">
                  <div className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {t("account.desk")}
                  </div>
                  <div className="space-y-0.5">
                    {desk.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                        >
                          <Icon
                            className={cn("size-3.5 shrink-0", STAFF_DESK_ICON_TONE[item.tone])}
                          />
                          <span className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                            {t(item.titleKey)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="space-y-0.5 p-1.5">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] font-semibold text-zinc-200 transition-colors hover:bg-[#222] hover:text-[var(--hltv-green)]"
                >
                  <UserRound className="size-3.5 shrink-0 text-zinc-500" />
                  {t("account.profile")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] font-semibold text-zinc-300 transition-colors hover:bg-[#222] hover:text-[var(--hltv-live)]"
                >
                  <LogOut className="size-3.5 shrink-0 text-zinc-500" />
                  {t("nav.logout")}
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
