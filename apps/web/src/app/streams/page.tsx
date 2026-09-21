"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { apiClient, type StreamDto } from "@/shared/api/client";

export default function StreamsPage() {
  const [streams, setStreams] = useState<StreamDto[]>([]);
  useEffect(() => {
    apiClient.streams().then(setStreams).catch(() => undefined);
  }, []);

  return (
    <PageTransition className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-white">Streams</h1>
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {streams.map((s) => (
          <Card key={s.id} glow className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-white">{s.title}</div>
              {s.isLive ? <Badge variant="live">LIVE</Badge> : <Badge>Offline</Badge>}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {s.platform} · {s.viewers} viewers · {s.language}
            </div>
            <Link href={s.url} target="_blank" className="mt-3 inline-block text-sm text-cyan-400">
              Open stream
            </Link>
          </Card>
        ))}
      </div>
    </PageTransition>
  );
}
