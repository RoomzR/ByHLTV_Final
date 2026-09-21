"use client";

import { mapFallbackSrc, mapImageSrc, normalizeMapName } from "@/lib/maps";
import { cn } from "@/lib/utils";

type Props = {
  mapName: string;
  className?: string;
  label?: boolean;
  dimmed?: boolean;
  badge?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: "h-12 w-[4.5rem]",
  md: "h-16 w-28",
  lg: "h-24 w-40",
};

export function MapThumb({
  mapName,
  className,
  label = true,
  dimmed,
  badge,
  size = "md",
}: Props) {
  const name = normalizeMapName(mapName);
  const src = mapImageSrc(name);
  const fallback = mapFallbackSrc(name);

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-[var(--border)] bg-[#111]",
        SIZE[size],
        dimmed && "opacity-45 grayscale",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        className="h-full w-full object-cover"
        onError={(e) => {
          const el = e.currentTarget;
          if (el.src.endsWith(".svg")) return;
          el.src = fallback;
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
      {label ? (
        <span className="absolute bottom-1 left-1.5 text-[10px] font-bold uppercase tracking-wide text-white drop-shadow">
          {name}
        </span>
      ) : null}
      {badge ? (
        <span className="absolute right-1 top-1 bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--hltv-green)]">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
