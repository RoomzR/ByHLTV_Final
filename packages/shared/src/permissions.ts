import {
  UserRole,
  STAFF_HIERARCHY,
  hasStaffMinRole,
  isTournamentAdmin,
} from "./enums";

export type Capability =
  | "apply.tournament_admin"
  | "review.tournament_applications"
  | "event.manage_own"
  | "event.manage"
  | "submission.create"
  | "submission.review"
  | "match.live_operate"
  | "match.publish"
  | "news.publish"
  | "admin.panel"
  | "player.manage"
  | "team.manage"
  | "awards.manage"
  | "gallery.manage"
  | "ads.manage"
  | "ranking.manage"
  | "comment.create"
  | "comment.moderate"
  | "forum.moderate"
  | "report.create"
  | "report.review"
  | "user.ban_limited"
  | "user.ban"
  | "media.upload";

/** EDITOR and ADMIN+ — not MODERATOR (who is community-only). */
export function isContentStaff(role: string): boolean {
  return role === UserRole.EDITOR || hasStaffMinRole(role, UserRole.ADMIN);
}

const CAPABILITY_RULES: Record<Capability, (role: string) => boolean> = {
  "apply.tournament_admin": (role) =>
    role === UserRole.USER || role === UserRole.TOURNAMENT_ADMIN,
  "review.tournament_applications": (role) => hasStaffMinRole(role, UserRole.ADMIN),
  "event.manage_own": (role) =>
    isTournamentAdmin(role) || hasStaffMinRole(role, UserRole.ADMIN),
  "event.manage": (role) => isContentStaff(role),
  "submission.create": (role) => isTournamentAdmin(role) || isContentStaff(role),
  "submission.review": (role) => isContentStaff(role),
  "match.live_operate": (role) => isTournamentAdmin(role) || isContentStaff(role),
  "match.publish": (role) => isContentStaff(role),
  "news.publish": (role) => isContentStaff(role),
  "admin.panel": (role) => hasStaffMinRole(role, UserRole.ADMIN),
  "player.manage": (role) => isContentStaff(role),
  "team.manage": (role) => hasStaffMinRole(role, UserRole.ADMIN),
  "awards.manage": (role) => isContentStaff(role),
  "gallery.manage": (role) => isContentStaff(role),
  "ads.manage": (role) => hasStaffMinRole(role, UserRole.ADMIN),
  "ranking.manage": (role) => hasStaffMinRole(role, UserRole.ADMIN),
  "comment.create": (role) => Boolean(role),
  "comment.moderate": (role) =>
    role === UserRole.MODERATOR || isContentStaff(role),
  "forum.moderate": (role) =>
    role === UserRole.MODERATOR || isContentStaff(role),
  "report.create": (role) => Boolean(role),
  "report.review": (role) =>
    role === UserRole.MODERATOR || hasStaffMinRole(role, UserRole.ADMIN),
  "user.ban_limited": (role) =>
    role === UserRole.MODERATOR || hasStaffMinRole(role, UserRole.ADMIN),
  "user.ban": (role) => hasStaffMinRole(role, UserRole.ADMIN),
  "media.upload": (role) => Boolean(role),
};

export function can(role: string | undefined | null, capability: Capability): boolean {
  if (!role) return false;
  return CAPABILITY_RULES[capability]?.(role) ?? false;
}

/** MOD may only temp-ban USER; ADMIN+ may ban strictly lower-ranked staff (not peers). */
export function canBanTarget(
  actorRole: string | undefined | null,
  targetRole: string,
  mode: "limited" | "full" = "limited",
): boolean {
  if (!actorRole) return false;
  if (targetRole === UserRole.SUPERADMIN) return false;
  if (mode === "full") {
    if (!can(actorRole, "user.ban")) return false;
    const actorRank = STAFF_HIERARCHY[actorRole] ?? 0;
    const targetRank = STAFF_HIERARCHY[targetRole] ?? 0;
    return actorRank > targetRank;
  }
  if (!can(actorRole, "user.ban_limited")) return false;
  if (actorRole === UserRole.MODERATOR) {
    return targetRole === UserRole.USER;
  }
  const actorRank = STAFF_HIERARCHY[actorRole] ?? 0;
  const targetRank = STAFF_HIERARCHY[targetRole] ?? 0;
  return actorRank > targetRank;
}

/** Permanent or active temporary ban. */
export function isEffectivelyBanned(user: {
  isBanned?: boolean | null;
  bannedUntil?: Date | string | null;
}): boolean {
  if (user.isBanned) return true;
  if (!user.bannedUntil) return false;
  return new Date(user.bannedUntil).getTime() > Date.now();
}

/**
 * Role assignment rules:
 * - only ADMIN+ may assign
 * - only SUPERADMIN may assign SUPERADMIN or touch SUPERADMIN accounts
 * - cannot assign a role at or above your own staff rank
 * - cannot change your own role
 */
export function canAssignRole(
  actor: { id: string; role: string },
  target: { id: string; role: string },
  nextRole: string,
): boolean {
  if (!hasStaffMinRole(actor.role, UserRole.ADMIN)) return false;
  if (actor.id === target.id) return false;
  if (!Object.values(UserRole).includes(nextRole as UserRole)) return false;
  if (target.role === UserRole.SUPERADMIN && actor.role !== UserRole.SUPERADMIN) return false;
  if (nextRole === UserRole.SUPERADMIN && actor.role !== UserRole.SUPERADMIN) return false;

  const actorRank = STAFF_HIERARCHY[actor.role] ?? 0;
  const nextRank = STAFF_HIERARCHY[nextRole] ?? 99;

  if (actor.role === UserRole.SUPERADMIN) {
    return true;
  }
  // Must assign strictly below actor rank; cannot demote/promote peers
  const targetRank = STAFF_HIERARCHY[target.role] ?? 0;
  if (targetRank >= actorRank) return false;
  return nextRank < actorRank;
}
