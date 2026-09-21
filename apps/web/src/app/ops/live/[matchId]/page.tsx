"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageTransition } from "@/components/effects/page-transition";
import { MapVetoEditor } from "@/components/matches/map-veto-editor";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import {
  apiClient,
  type GsiConfigDto,
  type MatchDemoDto,
  type MatchDto,
} from "@/shared/api/client";
import { cn } from "@/lib/utils";

export default function OpsLiveConsolePage() {
  const params = useParams<{ matchId: string }>();
  const slug = params.matchId;
  const { user, can } = useAuth();
  const { t } = useI18n();
  const [match, setMatch] = useState<MatchDto | null>(null);
  const [t1, setT1] = useState(0);
  const [t2, setT2] = useState(0);
  const [mapT1, setMapT1] = useState(0);
  const [mapT2, setMapT2] = useState(0);
  const [round, setRound] = useState(1);
  const [side, setSide] = useState<"CT" | "T">("CT");
  const [error, setError] = useState("");
  const [gsi, setGsi] = useState<GsiConfigDto | null>(null);
  const [host, setHost] = useState("");
  const [copied, setCopied] = useState("");
  const [demos, setDemos] = useState<MatchDemoDto[]>([]);
  const [mapName, setMapName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [streamUrl, setStreamUrl] = useState("");
  const [streamSaving, setStreamSaving] = useState(false);

  const load = useCallback(() => {
    return apiClient
      .match(slug)
      .then((m) => {
        setMatch(m);
        setT1(m.team1Score);
        setT2(m.team2Score);
        setStreamUrl(m.streamUrl ?? "");
        const active = m.maps.find((x) => !x.winnerId) ?? m.maps.at(-1);
        if (active) {
          setMapT1(active.team1Score);
          setMapT2(active.team2Score);
          setMapName(active.mapName);
        }
        setRound((m.currentRound ?? 0) + 1);
      })
      .catch((e) => setError((e as { message?: string }).message ?? t("common.error")));
  }, [slug, t]);

  const loadGsi = useCallback(() => {
    return apiClient
      .gsiConfig(slug, host || undefined)
      .then(setGsi)
      .catch(() => setGsi(null));
  }, [slug, host]);

  const loadDemos = useCallback(() => {
    return apiClient
      .listDemos(slug)
      .then(setDemos)
      .catch(() => setDemos([]));
  }, [slug]);

  useEffect(() => {
    if (!user) return;
    void load();
    void loadGsi();
    void loadDemos();
  }, [user, load, loadGsi, loadDemos]);

  async function pushLive(e: FormEvent) {
    e.preventDefault();
    if (!match) return;
    const active = match.maps.find((x) => !x.winnerId) ?? match.maps.at(-1);
    try {
      await apiClient.updateMatchLive(slug, {
        team1Score: t1,
        team2Score: t2,
        status: "LIVE",
        team1Side: side,
        currentRound: round,
        activeMapName: active?.mapName ?? match.activeMapName,
        maps: match.maps.map((m) =>
          m.mapName === active?.mapName
            ? { ...m, team1Score: mapT1, team2Score: mapT2, team1Side: side }
            : m,
        ),
      });
      await apiClient.addMatchRound(slug, {
        mapNumber: match.maps.findIndex((m) => m.mapName === active?.mapName) + 1 || 1,
        roundNumber: round,
        winnerSide: side,
        team1Score: mapT1,
        team2Score: mapT2,
      });
      await load();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    }
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setError("Clipboard failed");
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadName(file.name);
    setError("");
    try {
      await apiClient.uploadDemo(slug, file, mapName || undefined);
      await loadDemos();
      await load();
      setFileInputKey((k) => k + 1);
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    } finally {
      setUploading(false);
      setUploadName("");
    }
  }

  async function saveStream() {
    setStreamSaving(true);
    setError("");
    try {
      const updated = await apiClient.updateMatchMeta(slug, {
        streamUrl: streamUrl.trim() || null,
      });
      setMatch(updated);
      setStreamUrl(updated.streamUrl ?? "");
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    } finally {
      setStreamSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="p-10 text-center text-zinc-400">
        <Link href="/login" className="text-[var(--hltv-green)] hover:underline">
          {t("auth.signIn")}
        </Link>
      </div>
    );
  }

  if (!can("match.live_operate")) {
    return (
      <div className="p-10 text-center text-zinc-400">{t("ops.livePermission")}</div>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <Link href="/ops" className="text-sm text-zinc-400 hover:text-[var(--hltv-green)]">
        {t("ops.backStaff")}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-white">
            {t("ops.liveControl")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{t("ops.liveControlHint")}</p>
        </div>
        {match ? (
          <Link
            href={`/matches/${match.slug}`}
            className="text-xs font-semibold uppercase tracking-wide text-[var(--hltv-green)] hover:underline"
          >
            {t("ops.openPublicMatch")}
          </Link>
        ) : null}
      </div>
      {error ? <p className="text-rose-400">{error}</p> : null}

      <section className="space-y-2 border border-[var(--border)] bg-[#121212] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--hltv-green)]">
          {t("ops.gsiGuideTitle")}
        </h2>
        <ol className="space-y-2 text-[12px] leading-relaxed text-zinc-400">
          <li>{t("ops.gsiStep1")}</li>
          <li>{t("ops.gsiStep2")}</li>
          <li>{t("ops.gsiStep3")}</li>
          <li>{t("ops.gsiStep4")}</li>
          <li>{t("ops.gsiStep5")}</li>
          <li>{t("ops.gsiStep6")}</li>
          <li>{t("ops.gsiStep7")}</li>
          <li>{t("ops.gsiStep8")}</li>
        </ol>
        <p className="text-[11px] text-zinc-600">
          <Link href="/admin/matches" className="text-[var(--hltv-green)] hover:underline">
            {t("admin.matchesTitle")}
          </Link>
          {" · "}
          <Link href="/live" className="text-[var(--hltv-green)] hover:underline">
            /live
          </Link>
        </p>
      </section>

      <section className="space-y-3 border border-[var(--border)] bg-[#121212] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--hltv-green)]">
            {t("ops.gsiSetup")}
          </h2>
          <span
            className={`text-[10px] font-semibold uppercase ${
              gsi?.gsiOnline ? "text-[var(--hltv-green)]" : "text-zinc-600"
            }`}
          >
            {gsi?.gsiOnline ? t("live.gsiOnline") : t("live.gsiOffline")}
          </span>
        </div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("ops.gsiHost")}
          <span className="mt-1 block font-normal normal-case tracking-normal text-zinc-600">
            {t("ops.gsiHostHint")}
          </span>
          <input
            className="mt-1.5 w-full border border-[var(--border)] bg-[#1b1b1b] px-3 py-2 text-sm text-zinc-100"
            placeholder="192.168.1.10:4000"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void loadGsi()}>
            {t("ops.refreshGsi")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              void apiClient.gsiToken(slug, true).then(() => loadGsi())
            }
          >
            {t("ops.regenerateToken")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!gsi}
            onClick={() => void apiClient.downloadGsiCfg(slug, host || undefined)}
          >
            {t("ops.downloadCfg")}
          </Button>
          {gsi ? (
            <>
              <Button type="button" variant="secondary" onClick={() => void copyText("uri", gsi.uri)}>
                {copied === "uri" ? "OK" : t("ops.copyUri")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => void copyText("cfg", gsi.cfg)}>
                {copied === "cfg" ? "OK" : t("ops.copyCfg")}
              </Button>
            </>
          ) : null}
        </div>
        {gsi ? (
          <>
            <code className="block break-all text-[11px] text-[var(--hltv-green)]">{gsi.uri}</code>
            <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-zinc-500">
              {gsi.installHints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="space-y-3 border border-[var(--border)] bg-[#121212] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--hltv-green)]">
          {t("ops.streamTitle")}
        </h2>
        <p className="text-[11px] text-zinc-500">{t("ops.streamHint")}</p>
        <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("ops.streamUrl")}
          <input
            className="mt-1.5 w-full border border-[var(--border)] bg-[#1b1b1b] px-3 py-2 text-sm text-zinc-100"
            type="url"
            placeholder="https://twitch.tv/… · https://youtube.com/live/…"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" disabled={streamSaving} onClick={() => void saveStream()}>
            {streamSaving ? t("common.saving") : t("ops.streamSave")}
          </Button>
          {streamUrl.trim() ? (
            <a
              href={streamUrl.trim()}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[var(--hltv-green)] hover:underline"
            >
              {t("matches.watchStream")} →
            </a>
          ) : null}
        </div>
      </section>

      <section className="space-y-3 border border-[var(--border)] bg-[#121212] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--hltv-green)]">
          {t("ops.demoUpload")}
        </h2>
        <p className="text-[11px] text-zinc-500">{t("ops.demoUploadHint")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t("ops.demoMap")}
            <input
              className="mt-1.5 block w-40 border border-[var(--border)] bg-[#1b1b1b] px-3 py-2 text-sm text-zinc-100"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="Mirage"
            />
          </label>
          <div className="relative">
            <input
              key={fileInputKey}
              id="demo-file"
              type="file"
              accept=".dem"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            />
            <label
              htmlFor="demo-file"
              className={cn(
                "inline-flex h-10 cursor-pointer items-center justify-center gap-2 border px-4 text-xs font-bold uppercase tracking-wide transition-all",
                uploading
                  ? "pointer-events-none border-[var(--hltv-green)]/40 bg-[var(--hltv-green)]/15 text-[var(--hltv-green)]"
                  : "border-[var(--hltv-green)] bg-[var(--hltv-green)] text-black hover:bg-[var(--by-green-bright)]",
              )}
            >
              {uploading ? (
                <>
                  <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("ops.demoUploading")}
                </>
              ) : (
                t("ops.demoChooseFile")
              )}
            </label>
            {uploadName ? (
              <p className="mt-1 max-w-[14rem] truncate text-[10px] text-zinc-500">{uploadName}</p>
            ) : null}
          </div>
        </div>
        {demos.length > 0 ? (
          <ul className="space-y-2 text-xs text-zinc-400">
            {demos.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-[var(--border)] bg-[#1b1b1b] px-3 py-2"
              >
                <span>
                  {d.originalName}
                  {d.mapName ? ` · ${d.mapName}` : ""} ·{" "}
                  <span
                    className={
                      d.status === "READY"
                        ? "text-[var(--hltv-green)]"
                        : d.status === "FAILED"
                          ? "text-rose-400"
                          : d.status === "PROCESSING"
                            ? "animate-pulse text-amber-300"
                            : ""
                    }
                  >
                    {d.status}
                  </span>
                  {d.error ? (
                    <span className="ml-2 text-rose-400">{d.error}</span>
                  ) : null}
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    className="text-[var(--hltv-green)] hover:underline"
                    onClick={() =>
                      void apiClient.reparseDemo(slug, d.id).then(loadDemos)
                    }
                  >
                    {t("ops.reparse")}
                  </button>
                  <button
                    type="button"
                    className="text-rose-400 hover:underline"
                    onClick={() =>
                      void apiClient.deleteDemo(slug, d.id).then(loadDemos)
                    }
                  >
                    {t("common.delete")}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-zinc-600">{t("ops.noDemos")}</p>
        )}
      </section>

      {match ? (
        <MapVetoEditor match={match} onSaved={(m) => setMatch(m)} />
      ) : null}

      {match ? (
        <form onSubmit={pushLive} className="space-y-4 border border-[var(--border)] bg-[#1b1b1b] p-5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("ops.manualScoreTitle")}
            </h2>
            <div className="mt-2 text-sm text-zinc-300">
              <span className="font-semibold text-white">
                {match.team1.name} vs {match.team2.name}
              </span>
              <span className="text-zinc-500"> · {match.activeMapName ?? "active map"}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Series · {match.team1.shortName}
              <input
                type="number"
                min={0}
                className="mt-1.5 w-full border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-100"
                value={t1}
                onChange={(e) => setT1(Number(e.target.value))}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Series · {match.team2.shortName}
              <input
                type="number"
                min={0}
                className="mt-1.5 w-full border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-100"
                value={t2}
                onChange={(e) => setT2(Number(e.target.value))}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Map rounds · {match.team1.shortName}
              <input
                type="number"
                min={0}
                className="mt-1.5 w-full border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-100"
                value={mapT1}
                onChange={(e) => setMapT1(Number(e.target.value))}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Map rounds · {match.team2.shortName}
              <input
                type="number"
                min={0}
                className="mt-1.5 w-full border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-100"
                value={mapT2}
                onChange={(e) => setMapT2(Number(e.target.value))}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Current round number
              <input
                type="number"
                min={1}
                className="mt-1.5 w-full border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-100"
                value={round}
                onChange={(e) => setRound(Number(e.target.value))}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Team1 side
              <select
                className="mt-1.5 w-full border border-[var(--border)] bg-[#121212] px-3 py-2 text-sm text-zinc-100"
                value={side}
                onChange={(e) => setSide(e.target.value as "CT" | "T")}
              >
                <option value="CT">CT</option>
                <option value="T">T</option>
              </select>
            </label>
          </div>
          <Button type="submit">{t("ops.publishLive")}</Button>
        </form>
      ) : null}
    </PageTransition>
  );
}
