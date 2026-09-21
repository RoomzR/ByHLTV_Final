"use client";

import Link from "next/link";

import { AdminCard } from "@/components/admin/shell/admin-card";
import { useAuth } from "@/features/auth/auth-provider";
import {
  getStaffDeskGroups,
  STAFF_DESK_ICON_TONE,
  STAFF_DESK_TONE,
} from "@/features/auth/staff-desk";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function RoleCabinets() {
  const { user, can } = useAuth();
  const { t } = useI18n();
  if (!user) return null;

  const groups = getStaffDeskGroups(can, user.role);

  return (
    <section id="cabinets" className="space-y-5 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white">{t("cabinets.title")}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t("cabinets.subtitle")}</p>
        </div>
        <span className="rounded-lg border border-[#2a2a2a] bg-[#171717] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          {user.role}
        </span>
      </div>

      <div className="rounded-xl border border-[#2a2a2a] bg-[#171717] px-4 py-3 text-[12px] leading-relaxed text-zinc-400">
        {t("cabinets.roleGuide")}
      </div>

      {groups.length === 0 ? (
        <AdminCard>
          <p className="text-sm text-zinc-500">{t("cabinets.userOnly")}</p>
          {can("apply.tournament_admin") ? (
            <Link
              href="/apply/tournament-admin"
              className="mt-3 inline-flex rounded-lg bg-[var(--hltv-green)] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-black"
            >
              {t("header.becomeTo")}
            </Link>
          ) : null}
        </AdminCard>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.id} className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                    {t(group.titleKey)}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-zinc-600">{t(group.hintKey)}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  {t(group.whoKey)}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "group rounded-xl border bg-[#171717] p-4 transition-colors",
                        STAFF_DESK_TONE[item.tone],
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#111]",
                            STAFF_DESK_ICON_TONE[item.tone],
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-zinc-100 group-hover:text-[var(--hltv-green)]">
                            {t(item.titleKey)}
                          </span>
                          <span className="mt-1 block text-[12px] leading-snug text-zinc-500">
                            {t(item.descKey)}
                          </span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
