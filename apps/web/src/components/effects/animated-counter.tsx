"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

/** SSR-safe: render final value immediately (no spring / motion text mismatch). */
export function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <span className={cn(className, mounted && "tabular-nums")} suppressHydrationWarning>
      {value}
    </span>
  );
}
