import { SectionShell, type SectionNavItem } from "@/components/shared/section-sidebar";

const BETTING_NAV: SectionNavItem[] = [
  { href: "/betting", labelKey: "bettingPage.odds", exact: true },
  { href: "/betting/guides", labelKey: "bettingPage.guides" },
];

export default function BettingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell titleKey="bettingPage.title" items={BETTING_NAV}>
      {children}
    </SectionShell>
  );
}
