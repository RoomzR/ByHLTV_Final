"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { LOCALES, LOCALE_SHORT, type Locale } from "@/i18n/config";
import type { TranslationKey } from "@/i18n/get-dictionary";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const LOCALE_META: Record<
  Locale,
  { nameKey: TranslationKey; hintKey: TranslationKey; flag: string }
> = {
  be: { nameKey: "lang.beName", hintKey: "lang.beHint", flag: "BY" },
  ru: { nameKey: "lang.ruName", hintKey: "lang.ruHint", flag: "RU" },
  en: { nameKey: "lang.enName", hintKey: "lang.enHint", flag: "EN" },
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
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

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "gap-2 border-[#3a3a3a] bg-[#1b1b1b] px-2.5 transition-all",
          open && "border-[var(--hltv-green)]/50 bg-[var(--hltv-green)]/10",
        )}
        onClick={() => setOpen((v) => !v)}
        aria-label={t("lang.label")}
        aria-expanded={open}
      >
        <Globe2 className="size-3.5 text-[var(--hltv-green)]" />
        <span className="font-mono text-xs font-semibold tracking-wide">{LOCALE_SHORT[locale]}</span>
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(18.5rem,calc(100vw-1.5rem))] overflow-hidden border border-[var(--border)] bg-[#161616] shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
          >
            <div className="relative border-b border-[var(--border)] bg-gradient-to-br from-[rgba(139,180,26,0.14)] via-[#1b1b1b] to-[#121212] px-4 py-3.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--hltv-green)]">
                {t("lang.label")}
              </div>
              <div className="mt-1 font-display text-lg font-bold text-white">{t("lang.title")}</div>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{t("lang.subtitle")}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-400">
                <span>{t("lang.current")}</span>
                <span className="font-mono font-bold text-[var(--hltv-green)]">
                  {LOCALE_SHORT[locale]}
                </span>
              </div>
            </div>

            <div className="space-y-1 p-2">
              {LOCALES.map((code, i) => {
                const meta = LOCALE_META[code];
                const active = locale === code;
                return (
                  <motion.button
                    key={code}
                    type="button"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.18 }}
                    onClick={() => {
                      setLocale(code);
                      setOpen(false);
                    }}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-sm px-2.5 py-2.5 text-left transition-colors",
                      active
                        ? "bg-[var(--hltv-green)]/15 ring-1 ring-[var(--hltv-green)]/35"
                        : "hover:bg-[#222]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center font-mono text-[11px] font-bold tracking-wide",
                        active
                          ? "bg-[var(--hltv-green)] text-black"
                          : "bg-[#222] text-zinc-300 group-hover:bg-[#2a2a2a]",
                      )}
                    >
                      {meta.flag}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm font-semibold",
                          active ? "text-[var(--hltv-green)]" : "text-zinc-100",
                        )}
                      >
                        {t(meta.nameKey)}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                        {t(meta.hintKey)}
                      </span>
                    </span>
                    {active ? (
                      <Check className="size-4 shrink-0 text-[var(--hltv-green)]" />
                    ) : (
                      <span className="font-mono text-[10px] text-zinc-600">{LOCALE_SHORT[code]}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
