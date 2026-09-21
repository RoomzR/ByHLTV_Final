"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

import type { StaffMessageDto } from "@/shared/api/client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

export function useOpsChat(opts: { submissionId?: string; applicationId?: string }) {
  const [messages, setMessages] = useState<StaffMessageDto[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!opts.submissionId && !opts.applicationId) return;

    const socket: Socket = io(`${WS_URL}/ops`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("ops:join", {
        submissionId: opts.submissionId,
        applicationId: opts.applicationId,
      });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("ops:message", (payload: StaffMessageDto | { type: string; status: string }) => {
      if ("body" in payload && payload.body) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
      }
    });
    socket.on("ops:submission_status", (payload: { status?: string }) => {
      if (payload.status) setStatus(payload.status);
    });

    return () => {
      socket.disconnect();
    };
  }, [opts.submissionId, opts.applicationId]);

  return { messages, status, connected, setMessages };
}
