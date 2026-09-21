"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { fieldInputClass } from "@/components/ui/form-field";
import { MapThumb } from "@/components/matches/map-thumb";
import { useI18n } from "@/i18n/provider";
import { CS2_MAP_POOL } from "@/lib/maps";
import type { MatchDto } from "@/shared/api/client";
import { apiClient } from "@/shared/api/client";

export { CS2_MAP_POOL };

type Step = {
  action: "ban" | "pick" | "leftover";
  mapName: string;
  teamId: string | null;
  order: number;
};

type Props = {
  match: MatchDto;
  onSaved?: (match: MatchDto) => void;
};

function defaultBo3Template(team1Id: string, team2Id: string): Step[] {
  return [
    { order: 1, action: "ban", teamId: team1Id, mapName: "" },
    { order: 2, action: "ban", teamId: team2Id, mapName: "" },
    { order: 3, action: "pick", teamId: team1Id, mapName: "" },
    { order: 4, action: "pick", teamId: team2Id, mapName: "" },
    { order: 5, action: "ban", teamId: team1Id, mapName: "" },
    { order: 6, action: "ban", teamId: team2Id, mapName: "" },
    { order: 7, action: "leftover", teamId: null, mapName: "" },
  ];
}

function defaultBo1Template(team1Id: string, team2Id: string): Step[] {
  return [
    { order: 1, action: "ban", teamId: team1Id, mapName: "" },
    { order: 2, action: "ban", teamId: team2Id, mapName: "" },
    { order: 3, action: "ban", teamId: team1Id, mapName: "" },
    { order: 4, action: "ban", teamId: team2Id, mapName: "" },
    { order: 5, action: "ban", teamId: team1Id, mapName: "" },
    { order: 6, action: "ban", teamId: team2Id, mapName: "" },
    { order: 7, action: "leftover", teamId: null, mapName: "" },
  ];
}

function defaultBo5Template(team1Id: string, team2Id: string): Step[] {
  return [
    { order: 1, action: "ban", teamId: team1Id, mapName: "" },
    { order: 2, action: "ban", teamId: team2Id, mapName: "" },
    { order: 3, action: "pick", teamId: team1Id, mapName: "" },
    { order: 4, action: "pick", teamId: team2Id, mapName: "" },
    { order: 5, action: "pick", teamId: team1Id, mapName: "" },
    { order: 6, action: "pick", teamId: team2Id, mapName: "" },
    { order: 7, action: "leftover", teamId: null, mapName: "" },
  ];
}

function templateFor(format: string, t1: string, t2: string) {
  if (format === "BO1") return defaultBo1Template(t1, t2);
  if (format === "BO5") return defaultBo5Template(t1, t2);
  return defaultBo3Template(t1, t2);
}

export function MapVetoEditor({ match, onSaved }: Props) {
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [steps, setSteps] = useState<Step[]>(() => {
    if (match.vetos?.length) {
      return match.vetos
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((v) => ({
          order: v.order,
          action: (["ban", "pick", "leftover"].includes(v.action)
            ? v.action
            : v.action === "removed"
              ? "ban"
              : v.action === "picked"
                ? "pick"
                : "leftover") as Step["action"],
          mapName: v.mapName,
          teamId: v.teamId ?? null,
        }));
    }
    return templateFor(match.format, match.team1.id, match.team2.id);
  });

  const usedMaps = useMemo(
    () => new Set(steps.map((s) => s.mapName).filter(Boolean)),
    [steps],
  );

  function loadTemplate() {
    setSteps(templateFor(match.format, match.team1.id, match.team2.id));
  }

  async function save() {
    setError("");
    const incomplete = steps.some((s) => !s.mapName);
    if (incomplete) {
      setError(t("ops.vetoFillAll"));
      return;
    }
    setSaving(true);
    try {
      const updated = await apiClient.setMatchVetos(match.slug, {
        vetos: steps.map((s, i) => ({
          ...s,
          order: i + 1,
          teamId: s.action === "leftover" ? null : s.teamId,
        })),
      });
      onSaved?.(updated);
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-3 border border-[var(--border)] bg-[#121212] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--hltv-green)]">
          {t("ops.mapVetoEdit")}
        </h2>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={loadTemplate}>
            {t("ops.vetoTemplate")} {match.format}
          </Button>
          <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-zinc-500">{t("ops.mapVetoHint")}</p>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <ul className="space-y-2">
        {steps.map((step, idx) => (
          <li
            key={step.order}
            className="grid grid-cols-1 gap-2 border border-[var(--border)] bg-[#1b1b1b] p-2 sm:grid-cols-[auto_1fr_1fr_1fr]"
          >
            <span className="px-2 py-2 font-mono text-xs text-zinc-500">#{idx + 1}</span>
            <select
              className={fieldInputClass}
              value={step.action}
              onChange={(e) => {
                const action = e.target.value as Step["action"];
                setSteps((prev) =>
                  prev.map((s, i) =>
                    i === idx
                      ? {
                          ...s,
                          action,
                          teamId:
                            action === "leftover"
                              ? null
                              : s.teamId ?? match.team1.id,
                        }
                      : s,
                  ),
                );
              }}
            >
              <option value="ban">{t("matches.vetoBan")}</option>
              <option value="pick">{t("matches.vetoPick")}</option>
              <option value="leftover">{t("matches.vetoLeftover")}</option>
            </select>
            <select
              className={fieldInputClass}
              value={step.teamId ?? ""}
              disabled={step.action === "leftover"}
              onChange={(e) =>
                setSteps((prev) =>
                  prev.map((s, i) =>
                    i === idx ? { ...s, teamId: e.target.value || null } : s,
                  ),
                )
              }
            >
              <option value="">{t("ops.vetoNoTeam")}</option>
              <option value={match.team1.id}>{match.team1.name}</option>
              <option value={match.team2.id}>{match.team2.name}</option>
            </select>
            <select
              className={fieldInputClass}
              value={step.mapName}
              onChange={(e) =>
                setSteps((prev) =>
                  prev.map((s, i) => (i === idx ? { ...s, mapName: e.target.value } : s)),
                )
              }
            >
              <option value="">{t("ops.vetoSelectMap")}</option>
              {CS2_MAP_POOL.map((m) => (
                <option
                  key={m}
                  value={m}
                  disabled={usedMaps.has(m) && step.mapName !== m}
                >
                  {m}
                </option>
              ))}
            </select>
            {step.mapName ? (
              <div className="sm:col-span-4">
                <MapThumb mapName={step.mapName} size="sm" badge={step.action} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
