import { SectionShell, type SectionNavItem } from "@/components/shared/section-sidebar";

const PLAYERS_NAV: SectionNavItem[] = [
  { href: "/players", labelKey: "playersNav.players", exact: true },
  { href: "/players/retired", labelKey: "playersNav.retired" },
  { href: "/players/transfers", labelKey: "playersNav.transfers" },
  { href: "/players/mvps", labelKey: "playersNav.mvps" },
  { href: "/players/evps", labelKey: "playersNav.evps" },
  { href: "/players/top20", labelKey: "playersNav.top20" },
  { href: "/players/hall-of-fame", labelKey: "playersNav.hallOfFame" },
];

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell titleKey="playersNav.title" items={PLAYERS_NAV}>
      {children}
    </SectionShell>
  );
}
