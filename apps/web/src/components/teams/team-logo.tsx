import { isImageLogo, mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

const palette: Record<string, string> = {
  nemiga: "bg-[#1a4a6e]",
  mtw: "bg-[#4a1a6e]",
  "minsk-force": "bg-[#1a5a3a]",
  "vitebsk-five": "bg-[#6e4a1a]",
  "grodno-core": "bg-[#6e1a1a]",
  "brest-unite": "bg-[#1a3a6e]",
};

interface TeamLogoProps {
  team: { id: string; name: string; logo: string; slug?: string };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TeamLogo({ team, size = "md", className }: TeamLogoProps) {
  const sizeClass =
    size === "sm" ? "h-5 w-5 text-[9px]" : size === "lg" ? "h-12 w-12 text-base" : "h-8 w-8 text-xs";
  const src = isImageLogo(team.logo) ? mediaUrl(team.logo) : undefined;
  const slug = "slug" in team && typeof team.slug === "string" ? team.slug : "";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={team.name}
        title={team.name}
        className={cn("shrink-0 object-cover", sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-display font-bold text-white",
        sizeClass,
        palette[slug] ?? palette[team.id] ?? "bg-[#333]",
        className,
      )}
      title={team.name}
    >
      {team.logo}
    </div>
  );
}
