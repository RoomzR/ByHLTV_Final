"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { apiClient } from "@/shared/api/client";

export function MultiImageUpload({
  values,
  onChange,
  label,
  hint,
  max = 12,
  className,
}: {
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  hint?: string;
  max?: number;
  className?: string;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const remaining = max - values.length;
    if (remaining <= 0) {
      setError(t("upload.maxReached"));
      return;
    }
    const files = [...fileList].slice(0, remaining);
    setBusy(true);
    setError("");
    const next = [...values];
    try {
      for (const file of files) {
        const res = await apiClient.uploadImage(file);
        next.push(res.url);
      }
      onChange(next);
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {values.map((url, idx) => {
          const src = mediaUrl(url);
          return (
            <div
              key={`${url}-${idx}`}
              className="group relative h-20 w-28 overflow-hidden border border-[var(--border)] bg-[#121212]"
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : null}
              <button
                type="button"
                className="absolute right-1 top-1 bg-black/70 p-0.5 text-rose-300 opacity-0 transition group-hover:opacity-100"
                onClick={() => removeAt(idx)}
                aria-label={t("upload.remove")}
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
        {values.length < max ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-28 flex-col items-center justify-center gap-1 border border-dashed border-[var(--border)] bg-[#121212] text-zinc-500 transition hover:border-[var(--hltv-green)] hover:text-[var(--hltv-green)]"
          >
            {busy ? (
              <Loader2 className="size-5 animate-spin text-[var(--hltv-green)]" />
            ) : (
              <>
                <ImagePlus className="size-5" />
                <span className="text-[9px] font-bold uppercase tracking-wide">
                  {t("upload.addMore")}
                </span>
              </>
            )}
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || values.length >= max}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? t("upload.uploading") : t("upload.chooseMultiple")}
        </Button>
      </div>
      {hint ? <p className="text-[11px] leading-relaxed text-zinc-600">{hint}</p> : null}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}
