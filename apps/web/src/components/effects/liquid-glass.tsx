"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LiquidGlass({
  children,
  className,
  intensity = "md",
}: {
  children: ReactNode;
  className?: string;
  intensity?: "sm" | "md" | "lg";
}) {
  const blur =
    intensity === "sm"
      ? "backdrop-blur-md"
      : intensity === "lg"
        ? "backdrop-blur-3xl"
        : "backdrop-blur-2xl";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.35)]",
        blur,
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-[var(--by-green)]/10" />
      <div className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-60 liquid-shine" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
