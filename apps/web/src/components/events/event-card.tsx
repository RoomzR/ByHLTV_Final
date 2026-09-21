"use client";

import Link from "next/link";
import { MapPin, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EventLogo } from "@/components/events/event-logo";
import type { TranslationKey } from "@/i18n/get-dictionary";
import { useI18n } from "@/i18n/provider";
import { formatPrize } from "@/lib/formatters";
import { mediaUrl } from "@/lib/media";
import type { EventDto } from "@/shared/api/client";

interface EventCardProps {
  event: EventDto;
}

export function EventCard({ event }: EventCardProps) {
  const { t } = useI18n();
  const status = (event.status ?? "UPCOMING").toLowerCase();
  const statusKey = `events.status.${status}` as TranslationKey;
  const cover = mediaUrl(event.coverImage);

  return (
    <Link href={`/events/${event.slug}`} className="block h-full overflow-hidden hover:bg-[#222]">
      <div className="relative h-28 overflow-hidden bg-[#12151a]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover object-center opacity-90" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a1a] to-[#0a0c0e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1b] to-transparent" />
        <div className="absolute bottom-2 left-3">
          <EventLogo logo={event.logo} name={event.name} size="md" className="border-zinc-600" />
        </div>
        <div className="absolute right-2 top-2">
          <Badge
            variant={
              status === "ongoing"
                ? "live"
                : event.tier === "A" || event.tier === "S"
                  ? "gold"
                  : "default"
            }
            className={status === "ongoing" ? "glitch-live" : undefined}
          >
            {t(statusKey)}
          </Badge>
        </div>
      </div>
      <div className="space-y-2 p-4 pt-3">
        <div className="flex items-center gap-2">
          <Badge variant="cyan">Tier {event.tier}</Badge>
          <span className="text-[11px] text-zinc-500">
            {event.teamsCount} {t("events.teams")}
          </span>
        </div>
        <h3 className="news-headline text-lg text-white hover:text-[var(--hltv-green)]">
          {event.name}
        </h3>
        <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {event.location}
          </span>
          <span className="inline-flex items-center gap-1 text-[var(--hltv-green)]">
            <Trophy className="size-3" />
            {formatPrize(event.prizePool)}
          </span>
        </div>
      </div>
    </Link>
  );
}
