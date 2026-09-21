"use client";

import { useEffect, useState } from "react";

/** Soft pulse flag for live UI indicators (1.2s cycle). */
export function useLivePulse(enabled = true): boolean {
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setActive((v) => !v), 1200);
    return () => window.clearInterval(id);
  }, [enabled]);

  return enabled ? active : false;
}
