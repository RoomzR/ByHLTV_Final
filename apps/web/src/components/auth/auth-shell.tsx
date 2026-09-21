"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { PageTransition } from "@/components/effects/page-transition";
import { useI18n } from "@/i18n/provider";
import { SITE } from "@/lib/constants/navigation";

export const authInputClass =
  "w-full border border-[var(--border)] bg-[#101010] px-3.5 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-[var(--hltv-green)]";

export function AuthShell({
  title,
  hint,
  children,
  footer,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <PageTransition className="relative min-h-screen overflow-x-hidden bg-[#0b0b0b]">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,#0b0b0b_0%,#121212_38%,#0e0e0e_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(139,180,26,0.28), transparent 55%), radial-gradient(ellipse 50% 40% at 80% 90%, rgba(196,30,58,0.12), transparent 50%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[18%] h-[min(70vw,520px)] w-[min(70vw,520px)] -translate-x-1/2"
        initial={{ opacity: 0, scale: 0.92, rotate: 45 }}
        animate={{ opacity: 1, scale: 1, rotate: 45 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0 border border-[var(--hltv-green)]/25" />
        <div className="absolute inset-[12%] border border-white/[0.06]" />
        <div className="absolute inset-[24%] bg-[var(--hltv-green)]/[0.04]" />
      </motion.div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--hltv-green)]/70 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <BrandLogo size={34} />
            <span className="font-display text-lg font-extrabold text-white">{SITE.name}</span>
          </Link>
          <Link
            href="/"
            className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 hover:text-[var(--hltv-green)]"
          >
            {t("admin.backToSite")}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-3xl px-5 pt-6 text-center sm:px-8 sm:pt-10"
        >
          <div className="mb-4 inline-flex items-center gap-2 border border-[var(--hltv-green)]/35 bg-[var(--hltv-green)]/10 px-3 py-1">
            <span className="size-1.5 bg-[var(--hltv-green)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--hltv-green)]">
              {t("auth.brandEyebrow")}
            </span>
          </div>
          <h1 className="font-display text-[clamp(2.6rem,8vw,5rem)] font-bold uppercase leading-[0.9] tracking-[-0.02em] text-white">
            {SITE.name}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
            {t("auth.brandBody")}
          </p>
        </motion.div>

        <div className="relative mx-auto flex w-full max-w-lg flex-1 items-center px-5 py-10 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <div className="relative border border-[var(--border)] bg-[#141414]">
              <div className="absolute inset-y-0 left-0 z-10 w-1.5 bg-[var(--hltv-green)]">
                <div
                  aria-hidden
                  className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0b0b] ring-1 ring-[var(--border)]"
                />
              </div>
              <div
                aria-hidden
                className="absolute -right-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-[#0b0b0b] ring-1 ring-[var(--border)]"
              />

              <div className="border-b border-[var(--border)] bg-[#161616] px-6 py-4 pl-7">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                      {t("auth.passLabel")}
                    </div>
                    <h2 className="mt-1 font-display text-2xl font-bold uppercase text-white">
                      {title}
                    </h2>
                  </div>
                  <div className="text-right font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                    <div>BY · CS2</div>
                    <div className="mt-0.5 text-[var(--hltv-green)]">DESK</div>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-6 py-6 pl-7 sm:px-7 sm:pl-8">
                {hint ? <p className="text-sm text-zinc-500">{hint}</p> : null}
                {children}
                <div className="border-t border-dashed border-[var(--border)] pt-4 text-center text-sm text-zinc-500">
                  {footer}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="sticky bottom-0 mt-auto border-t border-[var(--border)] bg-[#101010]/95 backdrop-blur-sm"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-4 px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-zinc-600 sm:px-8">
            <span className="text-[var(--hltv-green)]">{t("auth.statLive")}</span>
            <span className="text-zinc-700">/</span>
            <span>{t("auth.statNews")}</span>
            <span className="text-zinc-700">/</span>
            <span>{t("auth.statRank")}</span>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
