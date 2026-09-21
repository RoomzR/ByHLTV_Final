"use client";

import Link from "next/link";

import { AdSlot } from "@/components/ads/ad-slot";
import { BrandLogo } from "@/components/brand/brand-logo";
import { useI18n } from "@/i18n/provider";
import { NAV_LINKS, SITE } from "@/lib/constants/navigation";

export function SiteFooter() {
  const { t, dict } = useI18n();

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[#0e0e0e]">
      <div className="mx-auto max-w-[1320px] px-3 pt-6 sm:px-4 lg:px-5">
        <AdSlot slot="GLOBAL_FOOTER" variant="banner" className="mb-4" />
      </div>
      <div className="mx-auto grid max-w-[1320px] gap-8 px-3 py-10 sm:px-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-5">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandLogo size={34} />
            <div className="font-display text-xl font-extrabold text-white">{SITE.name}</div>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
            {dict.site.description}
          </p>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--hltv-green)]">
            {t("footer.nav")}
          </div>
          <ul className="mt-3 space-y-1.5">
            {NAV_LINKS.slice(0, 6).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-[var(--hltv-green)]"
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--hltv-green)]">
            {t("footer.legal")}
          </div>
          <ul className="mt-3 space-y-1.5">
            <li>
              <Link href="/privacy" className="text-sm text-zinc-400 transition-colors hover:text-[var(--hltv-green)]">
                {t("footer.privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-sm text-zinc-400 transition-colors hover:text-[var(--hltv-green)]">
                {t("footer.terms")}
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="text-sm text-zinc-400 transition-colors hover:text-[var(--hltv-green)]">
                {t("footer.cookies")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--hltv-green)]">
            {t("footer.community")}
          </div>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li className="leading-relaxed">
              {t("footer.developedBy")}{" "}
              <span className="font-semibold text-zinc-200">Руденко Артем Roomz</span>
            </li>
            <li>
              <a
                href="https://t.me/roomzrly"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[var(--hltv-green)]"
              >
                Telegram · @roomzrly
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border)] py-4 text-center text-[11px] text-zinc-600">
        © 2026 ByHLTV · {t("footer.rights")}
      </div>
    </footer>
  );
}
