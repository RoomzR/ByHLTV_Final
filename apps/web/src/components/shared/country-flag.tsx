const FLAG: Record<string, string> = {
  BY: "🇧🇾",
  RU: "🇷🇺",
  UA: "🇺🇦",
  PL: "🇵🇱",
  LT: "🇱🇹",
  LV: "🇱🇻",
  EE: "🇪🇪",
  KZ: "🇰🇿",
  US: "🇺🇸",
  DK: "🇩🇰",
  SE: "🇸🇪",
  FI: "🇫🇮",
  DE: "🇩🇪",
  FR: "🇫🇷",
  GB: "🇬🇧",
  BR: "🇧🇷",
  CN: "🇨🇳",
};

export function CountryFlag({
  code,
  className,
}: {
  code?: string | null;
  className?: string;
}) {
  if (!code) return null;
  const emoji = FLAG[code.toUpperCase()] ?? "🏳️";
  return (
    <span className={className} title={code.toUpperCase()} aria-label={code}>
      {emoji}
    </span>
  );
}
