"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

import type { MatchDto } from "@/shared/api/client";
import { apiClient } from "@/shared/api/client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

export function useLiveMatch(slug?: string) {
  const [match, setMatch] = useState<MatchDto | null>(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let socket: Socket | null = null;
    let cancelled = false;

    apiClient
      .match(slug)
      .then((m) => {
        if (!cancelled) setMatch(m);
      })
      .catch((e) => {
        if (!cancelled) setError((e as { message?: string }).message ?? "Failed to load match");
      });

    socket = io(`${WS_URL}/live`, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      setConnected(true);
      socket?.emit("match:subscribe", { slug });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("match:update", (payload: MatchDto) => {
      if (payload.slug === slug) setMatch(payload);
    });
    socket.on("stats:update", (payload: MatchDto) => {
      if (payload.slug === slug) setMatch(payload);
    });
    socket.on("rounds:update", (payload: MatchDto) => {
      if (payload.slug === slug) setMatch(payload);
    });

    return () => {
      cancelled = true;
      socket?.emit("match:unsubscribe", { slug });
      socket?.disconnect();
    };
  }, [slug]);

  return { match, error, connected };
}

export function useLiveMatches() {
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let socket: Socket | null = null;
    apiClient
      .matches("LIVE")
      .then(setMatches)
      .catch((e) => setError((e as { message?: string }).message ?? "Failed"));

    socket = io(`${WS_URL}/live`, { transports: ["websocket", "polling"] });
    socket.on("match:update", (payload: MatchDto) => {
      setMatches((prev) => {
        const idx = prev.findIndex((m) => m.id === payload.id || m.slug === payload.slug);
        if (payload.status !== "LIVE") {
          return idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
        }
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = payload;
          return next;
        }
        return [payload, ...prev];
      });
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  return { matches, error };
}
