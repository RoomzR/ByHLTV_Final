import type { Capability } from "@byhltv/shared";
import {
  ClipboardList,
  FileText,
  Gavel,
  Images,
  LayoutDashboard,
  Medal,
  Megaphone,
  Newspaper,
  Shield,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { TranslationKey } from "@/i18n/get-dictionary";

export type StaffDeskTone = "green" | "cyan" | "amber" | "rose";

export type StaffDeskGroupId =
  | "system"
  | "moderation"
  | "live"
  | "content"
  | "ranking"
  | "access";

export type StaffDeskItem = {
  id: string;
  href: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  icon: LucideIcon;
  tone: StaffDeskTone;
  group: StaffDeskGroupId;
};

export type StaffDeskGroup = {
  id: StaffDeskGroupId;
  titleKey: TranslationKey;
  hintKey: TranslationKey;
  whoKey: TranslationKey;
  items: StaffDeskItem[];
};

type CanFn = (capability: Capability) => boolean;

const GROUP_ORDER: StaffDeskGroupId[] = [
  "system",
  "moderation",
  "live",
  "content",
  "ranking",
  "access",
];

const GROUP_META: Record<
  StaffDeskGroupId,
  { titleKey: TranslationKey; hintKey: TranslationKey; whoKey: TranslationKey }
> = {
  system: {
    titleKey: "cabinets.groupSystem",
    hintKey: "cabinets.groupSystemHint",
    whoKey: "cabinets.whoAdmin",
  },
  moderation: {
    titleKey: "cabinets.groupModeration",
    hintKey: "cabinets.groupModerationHint",
    whoKey: "cabinets.whoMod",
  },
  live: {
    titleKey: "cabinets.groupLive",
    hintKey: "cabinets.groupLiveHint",
    whoKey: "cabinets.whoLive",
  },
  content: {
    titleKey: "cabinets.groupContent",
    hintKey: "cabinets.groupContentHint",
    whoKey: "cabinets.whoEditor",
  },
  ranking: {
    titleKey: "cabinets.groupRanking",
    hintKey: "cabinets.groupRankingHint",
    whoKey: "cabinets.whoAdmin",
  },
  access: {
    titleKey: "cabinets.groupAccess",
    hintKey: "cabinets.groupAccessHint",
    whoKey: "cabinets.whoUser",
  },
};

/** Single source of staff/CMS desk entries for account menu + profile cabinets. */
export function getStaffDeskItems(can: CanFn, role: string): StaffDeskItem[] {
  const catalog: Array<StaffDeskItem & { show: boolean }> = [
    {
      id: "admin",
      href: "/admin",
      titleKey: "cabinets.adminTitle",
      descKey: "cabinets.adminDesc",
      icon: LayoutDashboard,
      tone: "amber",
      group: "system",
      show: can("admin.panel"),
    },
    {
      id: "users",
      href: "/admin/users",
      titleKey: "cabinets.usersTitle",
      descKey: "cabinets.usersDesc",
      icon: Users,
      tone: "amber",
      group: "system",
      show: can("admin.panel"),
    },
    {
      id: "applications",
      href: "/admin/applications",
      titleKey: "cabinets.appsTitle",
      descKey: "cabinets.appsDesc",
      icon: ClipboardList,
      tone: "amber",
      group: "system",
      show: can("review.tournament_applications"),
    },
    {
      id: "ads",
      href: "/admin/ads",
      titleKey: "cabinets.adsTitle",
      descKey: "cabinets.adsDesc",
      icon: Megaphone,
      tone: "amber",
      group: "system",
      show: can("ads.manage"),
    },
    {
      id: "mod",
      href: "/mod",
      titleKey: "cabinets.modTitle",
      descKey: "cabinets.modDesc",
      icon: Gavel,
      tone: "rose",
      group: "moderation",
      show: can("report.review"),
    },
    {
      id: "ops",
      href: "/ops",
      titleKey: "cabinets.opsTitle",
      descKey: "cabinets.opsDesc",
      icon: Trophy,
      tone: "green",
      group: "live",
      show: can("submission.create") || can("submission.review"),
    },
    {
      id: "matches",
      href: "/admin/matches",
      titleKey: "cabinets.matchesTitle",
      descKey: "cabinets.matchesDesc",
      icon: Trophy,
      tone: "cyan",
      group: "live",
      show: can("match.publish") || can("match.live_operate"),
    },
    {
      id: "news",
      href: "/admin/news",
      titleKey: "cabinets.newsTitle",
      descKey: "cabinets.newsDesc",
      icon: Newspaper,
      tone: "cyan",
      group: "content",
      show: can("news.publish"),
    },
    {
      id: "players",
      href: "/admin/players",
      titleKey: "cabinets.playersTitle",
      descKey: "cabinets.playersDesc",
      icon: Users,
      tone: "cyan",
      group: "content",
      show: can("player.manage"),
    },
    {
      id: "awards",
      href: "/admin/awards",
      titleKey: "cabinets.awardsTitle",
      descKey: "cabinets.awardsDesc",
      icon: Medal,
      tone: "cyan",
      group: "content",
      show: can("awards.manage"),
    },
    {
      id: "gallery",
      href: "/admin/gallery",
      titleKey: "cabinets.galleryTitle",
      descKey: "cabinets.galleryDesc",
      icon: Images,
      tone: "cyan",
      group: "content",
      show: can("gallery.manage"),
    },
    {
      id: "events",
      href: "/admin/events",
      titleKey: "cabinets.eventsTitle",
      descKey: "cabinets.eventsDesc",
      icon: FileText,
      tone: "green",
      group: "content",
      show: can("event.manage") || can("event.manage_own"),
    },
    {
      id: "teams",
      href: "/admin/teams",
      titleKey: "cabinets.teamsTitle",
      descKey: "cabinets.teamsDesc",
      icon: Shield,
      tone: "amber",
      group: "ranking",
      show: can("team.manage"),
    },
    {
      id: "ranking",
      href: "/admin/ranking",
      titleKey: "cabinets.rankingTitle",
      descKey: "cabinets.rankingDesc",
      icon: Trophy,
      tone: "amber",
      group: "ranking",
      show: can("ranking.manage"),
    },
    {
      id: "apply",
      href: "/apply/tournament-admin",
      titleKey: "cabinets.applyTitle",
      descKey: "cabinets.applyDesc",
      icon: Trophy,
      tone: "green",
      group: "access",
      show: can("apply.tournament_admin") && role === "USER",
    },
  ];

  return catalog.filter((item) => item.show).map(({ show: _show, ...item }) => item);
}

/** Grouped desk for profile UI — only non-empty sections. */
export function getStaffDeskGroups(can: CanFn, role: string): StaffDeskGroup[] {
  const items = getStaffDeskItems(can, role);
  return GROUP_ORDER.map((id) => {
    const meta = GROUP_META[id];
    return {
      id,
      titleKey: meta.titleKey,
      hintKey: meta.hintKey,
      whoKey: meta.whoKey,
      items: items.filter((item) => item.group === id),
    };
  }).filter((group) => group.items.length > 0);
}

/** Compact hub links for header / account dropdown (full list stays on /profile). */
const MENU_HUB_IDS = new Set(["admin", "mod", "ops", "apply"]);

export function getStaffDeskMenuItems(can: CanFn, role: string): StaffDeskItem[] {
  const full = getStaffDeskItems(can, role);
  const hubs = full.filter((item) => MENU_HUB_IDS.has(item.id));
  const hasMore = full.some((item) => !MENU_HUB_IDS.has(item.id));
  if (hasMore) {
    hubs.push({
      id: "all-cabinets",
      href: "/profile",
      titleKey: "account.allCabinets",
      descKey: "cabinets.subtitle",
      icon: LayoutDashboard,
      tone: "cyan",
      group: "content",
    });
  }
  return hubs;
}

export const STAFF_DESK_TONE: Record<StaffDeskTone, string> = {
  green: "border-[var(--hltv-green)]/35 bg-[var(--hltv-green)]/8 hover:border-[var(--hltv-green)]/60",
  cyan: "border-cyan-500/30 bg-cyan-500/8 hover:border-cyan-400/50",
  amber: "border-amber-500/30 bg-amber-500/8 hover:border-amber-400/50",
  rose: "border-rose-500/30 bg-rose-500/8 hover:border-rose-400/50",
};

export const STAFF_DESK_ICON_TONE: Record<StaffDeskTone, string> = {
  green: "text-[var(--hltv-green)]",
  cyan: "text-cyan-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
};
