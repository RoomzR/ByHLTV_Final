"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Radio, Sparkles } from "lucide-react";

import { Magnetic } from "@/components/effects/cursor-glow";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

export function HomeHero() {
  const { t, dict } = useI18n();
  const title = dict.site.name;

  return (
    <section className="relative isolate overflow-hidden border-b border-zinc-800/60">
      <div className="absolute inset-0 -z-10">
        <div className="hero-grid absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(74,222,128,0.12),transparent_45%)]" />
        <motion.div
          className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </div>

      <div className="mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 font-display text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/90"
          >
            <Sparkles className="size-3.5" />
            {t("hero.eyebrow")}
          </motion.p>

          <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-8xl">
            <span className="sr-only">{title}</span>
            <span aria-hidden className="inline-flex flex-wrap">
              {title.split("").map((char, i) => (
                <motion.span
                  key={`${char}-${i}`}
                  initial={{ opacity: 0, y: 40, rotateX: 40 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.08 + i * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block glow-text bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent"
                >
                  {char}
                </motion.span>
              ))}
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.55 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.55 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Magnetic>
              <Button asChild size="lg" className="relative overflow-hidden">
                <Link href="/live">
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2.4s_infinite]" />
                  <Radio className="size-4" />
                  {t("hero.ctaLive")}
                </Link>
              </Button>
            </Magnetic>
            <Magnetic>
              <Button asChild variant="outline" size="lg">
                <Link href="/matches">
                  <Play className="size-4" />
                  {t("hero.ctaMatches")}
                </Link>
              </Button>
            </Magnetic>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
