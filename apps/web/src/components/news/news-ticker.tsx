"use client";

import { useEffect, useRef } from "react";

import { useI18n } from "@/i18n/provider";

type TickerItem = {
  id: string;
  text: string;
  type: "score" | "transfer" | "event" | "news";
};

function TickerSegment({ items, label }: { items: TickerItem[]; label: string }) {
  return (
    <div className="flex shrink-0 items-center whitespace-nowrap" aria-hidden={label !== "a"}>
      {items.map((item) => (
        <span
          key={`${label}-${item.id}`}
          className="mx-6 inline-flex items-center gap-2 text-[12px] text-[#c6c6c6]"
        >
          <span
            className={
              item.type === "score"
                ? "text-[var(--hltv-live)]"
                : item.type === "transfer"
                  ? "text-amber-300"
                  : item.type === "event"
                    ? "text-[var(--hltv-green)]"
                    : "text-[#9a9a9a]"
            }
          >
            ●
          </span>
          {item.text}
        </span>
      ))}
    </div>
  );
}

export function NewsTicker() {
  const { dict } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const items: TickerItem[] = [
    { id: "t1", text: dict.ticker.t1, type: "score" },
    { id: "t2", text: dict.ticker.t2, type: "transfer" },
    { id: "t3", text: dict.ticker.t3, type: "event" },
    { id: "t4", text: dict.ticker.t4, type: "score" },
    { id: "t5", text: dict.ticker.t5, type: "news" },
  ];

  useEffect(() => {
    const track = trackRef.current;
    const root = rootRef.current;
    if (!track) return;

    let raf = 0;
    let x = 0;
    let running = true;
    const speed = 0.65;

    const tick = () => {
      if (!running) {
        raf = 0;
        return;
      }
      const halfWidth = track.scrollWidth / 2;
      if (halfWidth > 1) {
        x -= speed;
        if (-x >= halfWidth) x += halfWidth;
        track.style.transform = `translate3d(${x}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || !running) return;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running) start();
      else stop();
    };

    let observer: IntersectionObserver | null = null;
    if (root && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          running = !!entry?.isIntersecting && !document.hidden;
          if (running) start();
          else stop();
        },
        { threshold: 0.01 },
      );
      observer.observe(root);
    }

    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, [dict.ticker.t1, dict.ticker.t2, dict.ticker.t3, dict.ticker.t4, dict.ticker.t5]);

  return (
    <div
      ref={rootRef}
      className="relative z-[60] h-9 overflow-hidden border-b border-[#2f2f2f] bg-[#0b0b0b]"
    >
      <div className="absolute inset-y-0 left-0 z-20 flex items-center bg-[#0b0b0b] pr-3 pl-2">
        <span className="bg-[var(--hltv-live)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Live
        </span>
      </div>

      <div className="absolute inset-y-0 left-[58px] right-0 overflow-hidden sm:left-[72px]">
        <div ref={trackRef} className="flex h-full w-max items-center will-change-transform">
          <TickerSegment items={items} label="a" />
          <TickerSegment items={items} label="b" />
        </div>
      </div>
    </div>
  );
}
