"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import { apiClient, type NotificationDto } from "@/shared/api/client";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    apiClient.notificationsUnread().then((r) => setCount(r.count)).catch(() => setCount(0));
  }, [user]);

  async function toggle() {
    if (!open) {
      try {
        const list = await apiClient.notifications();
        setItems(list);
        setCount(list.filter((n) => !n.read).length);
      } catch {
        setItems([]);
      }
    }
    setOpen((v) => !v);
  }

  async function markRead(id: string) {
    await apiClient.markNotificationRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setCount((c) => Math.max(0, c - 1));
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative inline-flex size-8 items-center justify-center text-zinc-400 transition-colors hover:text-[var(--hltv-green)]"
        aria-label={t("notifications.title")}
      >
        <Bell className="size-4" />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--hltv-live)] px-1 text-[9px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 border border-[var(--border)] bg-[#1b1b1b] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
            <span className="text-xs font-semibold uppercase text-zinc-400">
              {t("notifications.title")}
            </span>
            <button
              type="button"
              className="text-[10px] text-[var(--hltv-green)] hover:underline"
              onClick={() =>
                apiClient.markAllNotificationsRead().then(() => {
                  setItems((prev) => prev.map((n) => ({ ...n, read: true })));
                  setCount(0);
                })
              }
            >
              {t("notifications.markAll")}
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-4 text-xs text-zinc-600">{t("notifications.empty")}</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.href || "/profile"}
                  onClick={() => {
                    if (!n.read) markRead(n.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "block border-b border-[#2a2a2a] px-3 py-2 hover:bg-[#222]",
                    !n.read && "bg-[#1f2418]",
                  )}
                >
                  <div className="text-xs font-semibold text-zinc-200">{n.title}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">{n.body}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
