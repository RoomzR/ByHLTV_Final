"use client";

import { motion } from "framer-motion";

export function EnergyField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[var(--by-red)]/30 blur-[90px]"
        animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-10 top-32 h-80 w-80 rounded-full bg-[var(--by-green)]/25 blur-[100px]"
        animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[var(--by-red)]/15 blur-[80px]"
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      {[...Array(18)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white/70"
          style={{
            left: `${(i * 17) % 100}%`,
            top: `${(i * 29) % 100}%`,
            boxShadow: "0 0 12px rgba(255,255,255,0.6)",
          }}
          animate={{
            y: [0, -24, 0],
            opacity: [0.15, 0.9, 0.15],
            scale: [1, 1.6, 1],
          }}
          transition={{
            duration: 3 + (i % 5),
            delay: i * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="pulse-grid absolute inset-0 opacity-40" />
    </div>
  );
}
