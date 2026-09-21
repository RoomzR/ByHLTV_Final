"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { TranslationKey } from "@/i18n/get-dictionary";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export type SectionNavItem = {
  href: string;
  labelKey: TranslationKey;
  /** Exact match only (for index routes like /players). */
  exact?: boolean;
};

export function SectionSidebar({
  titleKey,
  items,
}: {
  titleKey: TranslationKey;
  items: SectionNavItem[];
}) {
  const { t } = useI18n();
  const pathname = usePathname();

  function isActive(item: SectionNavItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <>
      <aside className="hidden h-fit border border-[var(--border)] bg-[#1a1a1a] lg:sticky lg:top-16 lg:block">
        <div className="border-b border-[var(--border)] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          {t(titleKey)}
        </div>
        <nav>
          {items.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative block border-b border-[var(--border)] px-3 py-2.5 text-[13px] transition-colors last:border-b-0",
                  active
                    ? "bg-[#242a30] font-semibold text-zinc-100 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[var(--hltv-green)]"
                    : "text-zinc-400 hover:bg-[#1f1f1f] hover:text-zinc-200",
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap",
                active
                  ? "border-[var(--hltv-green)] bg-[var(--hltv-green)]/10 text-[var(--hltv-green)]"
                  : "border-[var(--border)] text-zinc-500",
              )}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function SectionShell({
  titleKey,
  items,
  children,
}: {
  titleKey: TranslationKey;
  items: SectionNavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-3 py-6 sm:px-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-5">
      <SectionSidebar titleKey={titleKey} items={items} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
