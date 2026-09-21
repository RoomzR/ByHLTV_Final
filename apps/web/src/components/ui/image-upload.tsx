"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { apiClient } from "@/shared/api/client";

type Fit = "contain" | "cover";
type Variant = "avatar" | "cover" | "square";

const VARIANT: Record<Variant, string> = {
  avatar: "h-28 w-28",
  cover: "h-32 w-full max-w-md",
  square: "h-24 w-24",
};

export function ImageUpload({
  value,
  onChange,
  label,
  hint,
  className,
  previewClassName,
  fit = "contain",
  variant = "square",
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  className?: string;
  previewClassName?: string;
  /** contain = full image visible (logos); cover = fill frame (covers) */
  fit?: Fit;
  variant?: Variant;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = mediaUrl(value);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiClient.uploadImage(file);
      onChange(res.url);
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</div>
      ) : null}
      <div className={cn("flex flex-wrap items-start gap-3", variant === "cover" && "flex-col")}>
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[#0d0d0d]",
            VARIANT[variant],
            fit === "contain" && "p-2",
            previewClassName,
          )}
          style={
            fit === "contain"
              ? {
                  backgroundImage:
                    "linear-gradient(45deg,#1a1a1a 25%,transparent 25%),linear-gradient(-45deg,#1a1a1a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1a1a1a 75%),linear-gradient(-45deg,transparent 75%,#1a1a1a 75%)",
                  backgroundSize: "12px 12px",
                  backgroundPosition: "0 0,0 6px,6px -6px,-6px 0",
                }
              : undefined
          }
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className={cn(
                "max-h-full max-w-full",
                fit === "cover" ? "h-full w-full object-cover" : "object-contain",
              )}
            />
          ) : (
            <ImagePlus className="size-7 text-zinc-600" />
          )}
          {busy ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55">
              <Loader2 className="size-5 animate-spin text-[var(--hltv-green)]" />
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? t("upload.uploading") : t("upload.choose")}
            </Button>
            {value ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => onChange(null)}
                className="text-rose-400 hover:text-rose-300"
              >
                <X className="mr-1 size-3.5" />
                {t("upload.remove")}
              </Button>
            ) : null}
          </div>
          {hint ? <p className="text-[11px] leading-relaxed text-zinc-600">{hint}</p> : null}
          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
