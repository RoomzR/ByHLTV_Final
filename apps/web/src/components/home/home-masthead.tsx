"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play, Radio } from "lucide-react";
import { useRef } from "react";

import { EnergyField } from "@/components/effects/energy-field";
import { LiquidGlass } from "@/components/effects/liquid-glass";
import { Magnetic } from "@/components/effects/cursor-glow";
import { SplitText } from "@/components/effects/split-text";
import { TiltCard } from "@/components/effects/tilt-card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

export function HomeMasthead() {
  const { t, dict } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  return (
    <section ref={ref} className="relative isolate min-h-[88vh] overflow-hidden">
      <EnergyField />
      <div className="hero-grid absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(7,9,8,0.85)_80%)]" />

      <motion.div
        style={{ y, opacity, scale }}
        className="relative mx-auto flex min-h-[88vh] max-w-[1280px] flex-col justify-center px-4 py-20 sm:px-6 lg:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--by-red)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--by-red)]" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#ffb4b4]">
            {t("hero.eyebrow")}
          </span>
        </motion.div>

        <h1 className="max-w-4xl font-display text-[clamp(3.2rem,10vw,7.5rem)] font-black leading-[0.9] tracking-[-0.04em] text-white">
          <span className="sr-only">{dict.site.name}</span>
          <SplitText
            text={dict.site.name}
            className="glow-text bg-gradient-to-br from-white via-[#ffd4d4] to-[#8dffb5] bg-clip-text text-transparent"
          />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Magnetic>
            <Button asChild size="lg" className="relative overflow-hidden rounded-full px-7">
              <Link href="/live">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2.4s_infinite]" />
                <Radio className="size-4" />
                {t("hero.ctaLive")}
              </Link>
            </Button>
          </Magnetic>
          <Magnetic>
            <Button asChild variant="outline" size="lg" className="rounded-full px-7">
              <Link href="/matches">
                <Play className="size-4" />
                {t("hero.ctaMatches")}
              </Link>
            </Button>
          </Magnetic>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.7 }}
          className="mt-14 grid gap-3 sm:grid-cols-3"
        >
          {[
            { label: "Live hub", value: "24/7", accent: "text-[#ffb4b4]" },
            { label: "BY Ranking", value: "#1", accent: "text-[#8dffb5]" },
            { label: "Scene", value: "CS2", accent: "text-white" },
          ].map((stat, i) => (
            <TiltCard key={stat.label}>
              <LiquidGlass className="p-4" intensity="sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  {stat.label}
                </div>
                <div
                  className={`mt-1 font-display text-3xl font-black tracking-tight ${stat.accent}`}
                >
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + i * 0.1 }}
                  >
                    {stat.value}
                  </motion.span>
                </div>
              </LiquidGlass>
            </TiltCard>
          ))}
        </motion.div>
      </motion.div>

      <div className="by-ornament absolute inset-x-0 bottom-0" />
      <motion.div
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-600">Scroll</span>
        <span className="h-8 w-px bg-gradient-to-b from-white/50 to-transparent" />
      </motion.div>
    </section>
  );
}
