"use client";

import Link from "next/link";

import { PageTransition } from "@/components/effects/page-transition";
import { getLegal, type LegalDoc } from "@/content/legal";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/privacy", key: "privacy" as const },
  { href: "/terms", key: "terms" as const },
  { href: "/cookies", key: "cookies" as const },
];

export function LegalDocument({ kind }: { kind: "privacy" | "terms" | "cookies" }) {
  const { locale, t } = useI18n();
  const pack = getLegal(locale);
  const doc: LegalDoc = pack[kind];

  return (
    <PageTransition className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(139,180,26,0.12),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-5xl gap-8 px-3 py-10 sm:px-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-5">
        <aside className="h-fit border border-[var(--border)] bg-[#151515] p-3 lg:sticky lg:top-16">
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--hltv-green)]">
            {t("footer.legal")}
          </div>
          <nav className="space-y-0.5">
            {LINKS.map((link) => {
              const active = link.key === kind;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block px-2 py-2 text-sm transition-colors",
                    active
                      ? "bg-[var(--hltv-green)]/15 font-semibold text-[var(--hltv-green)]"
                      : "text-zinc-400 hover:bg-[#1c1c1c] hover:text-white",
                  )}
                >
                  {t(`footer.${link.key}`)}
                </Link>
              );
            })}
          </nav>
        </aside>

        <article className="border border-[var(--border)] bg-[#151515]">
          <header className="border-b border-[var(--border)] bg-gradient-to-br from-[rgba(139,180,26,0.12)] via-[#161616] to-[#121212] px-5 py-6 sm:px-8">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--hltv-green)]">
              ByHLTV
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl">
              {doc.title}
            </h1>
            <p className="mt-2 text-xs text-zinc-500">{doc.updated}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">{doc.intro}</p>
          </header>

          <div className="space-y-8 px-5 py-8 sm:px-8">
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                  {section.heading}
                </h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((p) => (
                    <p key={p.slice(0, 40)} className="text-sm leading-relaxed text-zinc-400">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </PageTransition>
  );
}
