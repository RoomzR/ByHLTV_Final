import { SectionShell, type SectionNavItem } from "@/components/shared/section-sidebar";

const EVENTS_NAV: SectionNavItem[] = [
  { href: "/events", labelKey: "eventsNav.all", exact: true },
  { href: "/events/ongoing", labelKey: "eventsNav.ongoing" },
  { href: "/events/archive", labelKey: "eventsNav.archive" },
  { href: "/events/calendar", labelKey: "eventsNav.calendar" },
];

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell titleKey="eventsNav.title" items={EVENTS_NAV}>
      {children}
    </SectionShell>
  );
}
