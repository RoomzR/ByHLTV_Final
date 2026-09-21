import { cn } from "@/lib/utils";

/** Brand mark: acid-green diamond + BY monogram. */
export function BrandLogo({
  className,
  size = 28,
  title = "ByHLTV",
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={cn("shrink-0 text-white", className)}
    >
      <title>{title}</title>
      <rect width="64" height="64" rx="4" fill="#121212" />
      <path
        d="M32 6 L58 32 L32 58 L6 32 Z"
        stroke="#8BB41A"
        strokeWidth="3"
        strokeLinejoin="miter"
      />
      <path d="M32 14 L50 32 L32 50 L14 32 Z" fill="#8BB41A" fillOpacity="0.14" />
      {/* B */}
      <path
        fill="currentColor"
        d="M17 18h12.2c4.6 0 7.6 2.5 7.6 6.2 0 2.6-1.5 4.6-3.9 5.5 3 0.8 5.1 3.1 5.1 6.4 0 4.2-3.4 7.1-8.4 7.1H17V18zm5.2 4.4v6.4h6.4c2.1 0 3.3-1.1 3.3-2.9s-1.2-3.5-3.4-3.5h-6.3zm0 10.6v7.2h7c2.5 0 4-1.4 4-3.6s-1.5-3.6-4-3.6h-7z"
      />
      {/* Y */}
      <path
        fill="currentColor"
        d="M40.2 18h5.4l5.1 11.6L55.8 18H61l-8.2 18.2V46h-5.2V36.2L40.2 18z"
      />
      <circle cx="51.5" cy="13.5" r="2.8" fill="#C41E3A" />
    </svg>
  );
}
