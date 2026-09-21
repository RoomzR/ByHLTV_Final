export enum UserRole {
  USER = "USER",
  EDITOR = "EDITOR",
  MODERATOR = "MODERATOR",
  TOURNAMENT_ADMIN = "TOURNAMENT_ADMIN",
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN",
}

export enum MatchStatus {
  UPCOMING = "UPCOMING",
  LIVE = "LIVE",
  FINISHED = "FINISHED",
}

export enum MatchFormat {
  BO1 = "BO1",
  BO3 = "BO3",
  BO5 = "BO5",
}

export enum EventStatus {
  UPCOMING = "UPCOMING",
  ONGOING = "ONGOING",
  FINISHED = "FINISHED",
}

export enum EventTier {
  S = "S",
  A = "A",
  B = "B",
  C = "C",
}

export enum NewsCategory {
  NEWS = "NEWS",
  INTERVIEW = "INTERVIEW",
  ANALYSIS = "ANALYSIS",
  TRANSFER = "TRANSFER",
}

export enum PlayerRole {
  AWPER = "AWPER",
  RIFLER = "RIFLER",
  IGL = "IGL",
  SUPPORT = "SUPPORT",
  LURKER = "LURKER",
}

export enum PlayerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  RETIRED = "RETIRED",
}

export enum SceneAwardKind {
  MVP = "MVP",
  EVP = "EVP",
  TOP20 = "TOP20",
  HALL_OF_FAME = "HALL_OF_FAME",
}

export enum MapName {
  Mirage = "Mirage",
  Inferno = "Inferno",
  Nuke = "Nuke",
  Ancient = "Ancient",
  Anubis = "Anubis",
  Dust2 = "Dust2",
  Vertigo = "Vertigo",
  Overpass = "Overpass",
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum OrganizerRole {
  OWNER = "OWNER",
  OPERATOR = "OPERATOR",
}

export enum SubmissionType {
  MATCH_UPDATE = "MATCH_UPDATE",
  NEWS_DRAFT = "NEWS_DRAFT",
  BRACKET = "BRACKET",
  LIVE_PACKAGE = "LIVE_PACKAGE",
}

export enum SubmissionStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  NEEDS_CHANGES = "NEEDS_CHANGES",
  APPROVED = "APPROVED",
  PUBLISHED = "PUBLISHED",
  REJECTED = "REJECTED",
}

/** Staff hierarchy excluding TOURNAMENT_ADMIN (non-linear capability). */
export const STAFF_HIERARCHY: Record<string, number> = {
  [UserRole.USER]: 1,
  [UserRole.EDITOR]: 2,
  [UserRole.MODERATOR]: 3,
  [UserRole.ADMIN]: 4,
  [UserRole.SUPERADMIN]: 5,
  [UserRole.TOURNAMENT_ADMIN]: 1,
};

/** @deprecated Prefer can() / hasStaffMinRole — kept for existing @Roles checks */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.EDITOR]: 2,
  [UserRole.MODERATOR]: 3,
  [UserRole.TOURNAMENT_ADMIN]: 1,
  [UserRole.ADMIN]: 4,
  [UserRole.SUPERADMIN]: 5,
};

export function hasStaffMinRole(userRole: UserRole | string, required: UserRole): boolean {
  const rank = STAFF_HIERARCHY[userRole] ?? 0;
  const need = STAFF_HIERARCHY[required] ?? 99;
  return rank >= need;
}

export function hasMinRole(userRole: UserRole, required: UserRole): boolean {
  if (userRole === UserRole.TOURNAMENT_ADMIN) {
    return required === UserRole.USER || required === UserRole.TOURNAMENT_ADMIN;
  }
  if (required === UserRole.TOURNAMENT_ADMIN) {
    return hasStaffMinRole(userRole, UserRole.ADMIN);
  }
  return hasStaffMinRole(userRole, required);
}

export function isTournamentAdmin(role: string): boolean {
  return role === UserRole.TOURNAMENT_ADMIN;
}

export function isStaffEditorPlus(role: string): boolean {
  return hasStaffMinRole(role, UserRole.EDITOR);
}

export function isStaffAdminPlus(role: string): boolean {
  return hasStaffMinRole(role, UserRole.ADMIN);
}

export enum ReportTargetType {
  POST = "POST",
  COMMENT = "COMMENT",
  THREAD = "THREAD",
  USER = "USER",
  NEWS = "NEWS",
}

export enum ReportStatus {
  OPEN = "OPEN",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}
