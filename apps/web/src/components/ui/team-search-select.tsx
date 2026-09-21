"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { fieldInputClass } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import type { TeamDto } from "@/shared/api/client";

type Props = {
  id: string;
  label?: string;
  teams: TeamDto[];
  value: string;
  onChange: (teamId: string) => void;
  excludeId?: string;
  placeholder?: string;
  required?: boolean;
};

export function TeamSearchSelect({
  id,
  teams,
  value,
  onChange,
  excludeId,
  placeholder = "Search team…",
  required,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = teams.find((t) => t.id === value);

  useEffect(() => {
    if (selected) setQuery(`${selected.name} (${selected.shortName})`);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teams
      .filter((t) => t.id !== excludeId)
      .filter((t) => {
        if (!q) return true;
        return (
          t.name.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q)
        );
      })
      .slice(0, 40);
  }, [teams, query, excludeId]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        className={fieldInputClass}
        value={query}
        required={required && !value}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
      />
      {open ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto border border-[var(--border)] bg-[#161616] shadow-lg">
          {filtered.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#222]",
                  t.id === value ? "bg-[#1f2a1f] text-[var(--hltv-green)]" : "text-zinc-200",
                )}
                onClick={() => {
                  onChange(t.id);
                  setQuery(`${t.name} (${t.shortName})`);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{t.name}</span>
                <span className="font-mono text-[10px] text-zinc-500">{t.shortName}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-xs text-zinc-600">No teams found</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
