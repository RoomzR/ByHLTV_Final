"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface ParticleBackgroundProps {
  density?: number;
}

export function ParticleBackground({ density = 42 }: ParticleBackgroundProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: density }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 11) % 100}%`,
        top: `${(i * 53 + 7) % 100}%`,
        size: 1 + (i % 4),
        delay: (i % 10) * 0.35,
        duration: 4.5 + (i % 6),
        x: ((i % 5) - 2) * 18,
        color:
          i % 3 === 0
            ? "rgba(34,211,238,0.85)"
            : i % 3 === 1
              ? "rgba(74,222,128,0.75)"
              : "rgba(255,255,255,0.55)",
      })),
    [density],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="aurora-blob aurora-blob-a" />
      <div className="aurora-blob aurora-blob-b" />
      <div className="aurora-blob aurora-blob-c" />
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 6}px ${p.color}`,
          }}
          animate={{
            y: [0, -24 - (p.id % 12), 0],
            x: [0, p.x, 0],
            opacity: [0.15, 0.75, 0.15],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="scanlines absolute inset-0 opacity-[0.035]" />
    </div>
  );
}
