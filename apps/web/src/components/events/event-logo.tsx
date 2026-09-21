import { isImageLogo, mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, string> = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-20 w-20 sm:h-24 sm:w-24",
};

/** Event / tournament logo — always shows the full image (object-contain). */
export function EventLogo({
  logo,
  name,
  size = "md",
  className,
}: {
  logo?: string | null;
  name: string;
  size?: Size;
  className?: string;
}) {
  const src = isImageLogo(logo) ? mediaUrl(logo) : undefined;
  const letter = (logo && !isImageLogo(logo) ? logo : name)?.[0] ?? "E";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[#121212] p-1",
        SIZE[size],
        className,
      )}
      title={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="font-display text-sm font-bold uppercase text-[var(--hltv-green)] sm:text-base">
          {letter}
        </span>
      )}
    </div>
  );
}
