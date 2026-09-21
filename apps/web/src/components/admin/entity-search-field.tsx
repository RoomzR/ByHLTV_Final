"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  apiClient,
  type EventDto,
  type PlayerDto,
  type TeamDto,
} from "@/shared/api/client";

type EntityKind = "player" | "event" | "team";

type Selected =
  | { kind: "player"; id: string; label: string; raw?: PlayerDto }
  | { kind: "event"; id: string; label: string; raw?: EventDto }
  | { kind: "team"; id: string; label: string; raw?: TeamDto };

export function EntitySearchField({
  kind,
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  kind: EntityKind;
  label: string;
  value: Selected | null;
  onChange: (next: Selected | null) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<PlayerDto[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);

  useEffect(() => {
    if (query.trim().length < 1) {
      setPlayers([]);
      setEvents([]);
      setTeams([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      apiClient
        .search(query.trim())
        .then((res) => {
          if (cancelled) return;
          setPlayers(res.players ?? []);
          setEvents(res.events ?? []);
          setTeams(res.teams ?? []);
        })
        .catch(() => {
          if (!cancelled) {
            setPlayers([]);
            setEvents([]);
            setTeams([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const results =
    kind === "player"
      ? players.map((p) => ({
          id: p.id,
          label: `${p.nickname}${p.team?.name ? ` · ${p.team.name}` : ""}`,
          raw: p,
        }))
      : kind === "event"
        ? events.map((e) => ({
            id: e.id,
            label: `${e.name}${e.tier ? ` · ${e.tier}` : ""}`,
            raw: e,
          }))
        : teams.map((team) => ({
            id: team.id,
            label: `${team.name} · ${team.shortName}`,
            raw: team,
          }));

  const defaultPlaceholder =
    kind === "player"
      ? t("awards.searchPlayer")
      : kind === "event"
        ? t("awards.searchEvent")
        : t("admin.searchTeam");

  return (
    <div className="relative space-y-1">
      <div className="text-xs uppercase text-zinc-500">
        {label}
        {required ? " *" : ""}
      </div>
      {value ? (
        <div className="flex items-center justify-between gap-2 border border-[var(--border)] bg-[#121212] px-2 py-2">
          <span className="truncate text-sm text-zinc-100">{value.label}</span>
          <button
            type="button"
            className="shrink-0 text-zinc-500 hover:text-zinc-200"
            onClick={() => onChange(null)}
            aria-label={t("common.reset")}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder ?? defaultPlaceholder}
            className="w-full border border-[var(--border)] bg-[#121212] px-2 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[var(--hltv-green)]"
          />
          {open && query.trim() ? (
            <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto border border-[var(--border)] bg-[#161616] shadow-lg">
              {loading ? (
                <p className="px-3 py-2 text-xs text-zinc-500">{t("common.loading")}</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-2 text-xs text-zinc-500">{t("awards.noSearchResults")}</p>
              ) : (
                results.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className={cn(
                      "block w-full truncate px-3 py-2 text-left text-sm text-zinc-200",
                      "hover:bg-[#222] hover:text-[var(--hltv-green)]",
                    )}
                    onClick={() => {
                      onChange({
                        kind,
                        id: row.id,
                        label: row.label,
                        raw: row.raw as PlayerDto & EventDto & TeamDto,
                      });
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    {row.label}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export type EntitySearchSelection = Selected;
