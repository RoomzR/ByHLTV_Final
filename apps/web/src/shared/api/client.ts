const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type ApiError = { message: string; status: number };

/** One-time cleanup of legacy localStorage tokens. */
export function clearLegacyTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("byhltv_access");
  localStorage.removeItem("byhltv_refresh");
  localStorage.removeItem("byhltv_user");
}

/** @deprecated No-op kept for brief compatibility during migration. */
export function clearTokens() {
  clearLegacyTokens();
}

export async function api<T>(
  path: string,
  options: RequestInit & { auth?: boolean; formData?: boolean } = {},
): Promise<T> {
  const { auth, formData, ...init } = options;
  const headers = new Headers(init.headers);
  if (!formData && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw {
      message: "Failed to fetch — API offline (start npm run dev:api on :4000)",
      status: 0,
    } satisfies ApiError;
  }
  if (res.status === 401 && auth !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retry = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
        credentials: "include",
      });
      if (!retry.ok) throw await toError(retry);
      return retry.json() as Promise<T>;
    }
  }
  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      credentials: "include",
    });
    return res.ok;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function toError(res: Response): Promise<ApiError> {
  let message = res.statusText;
  try {
    const body = await res.json();
    message = body.message ?? JSON.stringify(body);
  } catch {
    /* ignore */
  }
  return { message: Array.isArray(message) ? message.join(", ") : String(message), status: res.status };
}

export const apiClient = {
  health: () => api<{ status: string }>("/health", { auth: false }),
  login: (email: string, password: string) =>
    api<{ user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    }),
  register: (payload: { email: string; username: string; password: string; displayName?: string }) =>
    api<{ user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    }),
  me: () => api<AuthUser>("/auth/me"),
  logout: () =>
    api<{ ok: boolean }>("/auth/logout", {
      method: "POST",
      body: "{}",
      auth: false,
    }),
  teams: () => api<TeamDto[]>("/teams", { auth: false }),
  team: (slug: string) => api<TeamDto>(`/teams/${slug}`, { auth: false }),
  players: (status?: string) =>
    api<PlayerDto[]>(`/players${status ? `?status=${encodeURIComponent(status)}` : ""}`, {
      auth: false,
    }),
  player: (slug: string) => api<PlayerDto>(`/players/${slug}`, { auth: false }),
  playerTransfers: () => api<TransferHistoryDto[]>("/players/transfers/recent", { auth: false }),
  adminPlayers: () => api<PlayerDto[]>("/players/admin/all"),
  createPlayer: (body: Record<string, unknown>) =>
    api<PlayerDto>("/players", { method: "POST", body: JSON.stringify(body) }),
  updatePlayer: (id: string, body: Record<string, unknown>) =>
    api<PlayerDto>(`/players/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePlayer: (id: string) => api(`/players/${id}`, { method: "DELETE" }),
  recomputePlayer: (id: string) => api(`/players/${id}/recompute`, { method: "POST" }),
  awards: (kind?: string, year?: number, eventId?: string, playerId?: string) => {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (year) params.set("year", String(year));
    if (eventId) params.set("eventId", eventId);
    if (playerId) params.set("playerId", playerId);
    const q = params.toString();
    return api<SceneAwardDto[]>(`/awards${q ? `?${q}` : ""}`, { auth: false });
  },
  createAward: (body: Record<string, unknown>) =>
    api<SceneAwardDto>("/awards", { method: "POST", body: JSON.stringify(body) }),
  updateAward: (id: string, body: Record<string, unknown>) =>
    api<SceneAwardDto>(`/awards/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteAward: (id: string) => api(`/awards/${id}`, { method: "DELETE" }),
  updateTeamRanking: (id: string, body: { ranking: number; points: number }) =>
    api<TeamDto>(`/rankings/teams/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  updatePlayerRanking: (id: string, body: { ranking: number; rankingPoints: number }) =>
    api<PlayerDto>(`/rankings/players/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  snapshotTeamRankings: () => api<{ ok: boolean }>("/rankings/snapshot/teams", { method: "POST", body: "{}" }),
  snapshotPlayerRankings: () =>
    api<{ ok: boolean }>("/rankings/snapshot/players", { method: "POST", body: "{}" }),
  syncPlayerRankingsFromRating: () =>
    api<{ ok: boolean }>("/rankings/sync/players-from-rating", { method: "POST", body: "{}" }),
  gsiToken: (slug: string, regenerate = false) =>
    api<{ token: string; slug: string; matchId: string }>(
      `/gsi/match/${slug}/token${regenerate ? "?regenerate=1" : ""}`,
      { method: "POST" },
    ),
  gsiConfig: (slug: string, host?: string) =>
    api<GsiConfigDto>(
      `/gsi/match/${slug}/config${host ? `?host=${encodeURIComponent(host)}` : ""}`,
    ),
  downloadGsiCfg: async (slug: string, host?: string) => {
    const q = host ? `?host=${encodeURIComponent(host)}` : "";
    const res = await fetch(`${API_URL}/gsi/match/${slug}/config/download${q}`, {
      credentials: "include",
    });
    if (!res.ok) throw await toError(res);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gamestate_integration_byhltv.cfg";
    a.click();
    URL.revokeObjectURL(url);
  },
  listDemos: (slug: string) => api<MatchDemoDto[]>(`/matches/${slug}/demos`),
  uploadDemo: (slug: string, file: File, mapName?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    const q = mapName ? `?mapName=${encodeURIComponent(mapName)}` : "";
    return api<MatchDemoDto>(`/matches/${slug}/demos${q}`, {
      method: "POST",
      body: fd,
      formData: true,
    });
  },
  reparseDemo: (slug: string, id: string) =>
    api<{ ok: boolean }>(`/matches/${slug}/demos/${id}/reparse`, { method: "POST" }),
  deleteDemo: (slug: string, id: string) =>
    api<{ ok: boolean }>(`/matches/${slug}/demos/${id}`, { method: "DELETE" }),
  matches: (status?: string) =>
    api<MatchDto[]>(`/matches${status ? `?status=${status}` : ""}`, { auth: false }),
  match: (slug: string) => api<MatchDto>(`/matches/${slug}`, { auth: false }),
  createMatch: (body: Record<string, unknown>) =>
    api<MatchDto>("/matches", { method: "POST", body: JSON.stringify(body) }),
  updateMatchMeta: (slug: string, body: Record<string, unknown>) =>
    api<MatchDto>(`/matches/${slug}/meta`, { method: "PATCH", body: JSON.stringify(body) }),
  setMatchVetos: (
    slug: string,
    body: {
      vetos: Array<{
        action: "ban" | "pick" | "leftover";
        mapName: string;
        teamId?: string | null;
        order: number;
      }>;
    },
  ) => api<MatchDto>(`/matches/${slug}/vetos`, { method: "PUT", body: JSON.stringify(body) }),
  events: (status?: string) =>
    api<EventDto[]>(`/events${status ? `?status=${encodeURIComponent(status)}` : ""}`, {
      auth: false,
    }),
  event: (slug: string) => api<EventDto>(`/events/${slug}`, { auth: false }),
  eventBrackets: (slug: string) => api<unknown[]>(`/events/${slug}/brackets`, { auth: false }),
  news: (locale = "be", category?: string) => {
    const params = new URLSearchParams({ locale });
    if (category) params.set("category", category);
    return api<NewsDto[]>(`/news?${params.toString()}`, { auth: false });
  },
  newsArticle: (slug: string, locale = "be") =>
    api<NewsDto>(`/news/${slug}?locale=${locale}`, { auth: false }),
  rankingsTeams: () => api<TeamDto[]>("/rankings/teams", { auth: false }),
  rankingsPlayers: () => api<PlayerDto[]>("/rankings/players", { auth: false }),
  statsOverview: () => api<Record<string, number>>("/stats/overview", { auth: false }),
  statsLeaderboards: (metric = "rating") =>
    api<PlayerDto[]>(`/stats/leaderboards?metric=${metric}`, { auth: false }),
  forumsCategories: () => api<ForumCategoryDto[]>("/forums/categories", { auth: false }),
  forumCategory: (slug: string) => api<ForumCategoryDto>(`/forums/categories/${slug}`, { auth: false }),
  forumThread: (id: string) => api<ForumThreadDto>(`/forums/threads/${id}`, { auth: false }),
  createForumThread: (body: { categorySlug: string; title: string; body: string }) =>
    api<ForumThreadDto>("/forums/threads", { method: "POST", body: JSON.stringify(body) }),
  replyForumThread: (id: string, body: string) =>
    api(`/forums/threads/${id}/posts`, { method: "POST", body: JSON.stringify({ body }) }),
  gallery: () => api<GalleryAlbumDto[]>("/gallery", { auth: false }),
  galleryAlbum: (slug: string) => api<GalleryAlbumDto>(`/gallery/${slug}`, { auth: false }),
  createGalleryAlbum: (body: Record<string, unknown>) =>
    api<GalleryAlbumDto>("/gallery", { method: "POST", body: JSON.stringify(body) }),
  updateGalleryAlbum: (id: string, body: Record<string, unknown>) =>
    api<GalleryAlbumDto>(`/gallery/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteGalleryAlbum: (id: string) => api(`/gallery/${id}`, { method: "DELETE" }),
  streams: () => api<StreamDto[]>("/streams", { auth: false }),
  search: (q: string) => api<SearchResultDto>(`/search?q=${encodeURIComponent(q)}`, { auth: false }),
  fantasyLeagues: () => api<FantasyLeagueDto[]>("/fantasy", { auth: false }),
  fantasyEvent: (slug: string) => api<FantasyEventDto>(`/fantasy/${slug}`, { auth: false }),
  fantasyLeaderboard: (slug: string) =>
    api<
      Array<{
        id: string;
        name: string;
        points: number;
        user?: { username: string; displayName: string };
      }>
    >(`/fantasy/${slug}/leaderboard`, { auth: false }),
  fantasyDraft: (slug: string, payload: { name: string; playerIds: string[] }) =>
    api(`/fantasy/${slug}/draft`, { method: "POST", body: JSON.stringify(payload) }),
  bettingOdds: () => api<BettingOddDto[]>("/betting/odds", { auth: false }),
  bettingGuides: () => api<BettingGuideDto[]>("/betting/guides", { auth: false }),
  adsServe: (slot: string) =>
    api<AdServeDto[]>(`/ads/serve?slot=${encodeURIComponent(slot)}`, { auth: false }),
  adsImpression: (id: string) =>
    api<{ ok: boolean; counted: boolean }>(`/ads/${id}/impression`, {
      method: "POST",
      body: "{}",
      auth: false,
    }),
  adsClick: (id: string) =>
    api<{ ok: boolean; counted: boolean; href: string }>(`/ads/${id}/click`, {
      method: "POST",
      body: "{}",
      auth: false,
    }),
  adminAds: (status?: string, format?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (format) params.set("format", format);
    const q = params.toString();
    return api<AdDto[]>(`/ads${q ? `?${q}` : ""}`);
  },
  adminAd: (id: string) => api<AdDto>(`/ads/${id}`),
  createAd: (body: Record<string, unknown>) =>
    api<AdDto>("/ads", { method: "POST", body: JSON.stringify(body) }),
  updateAd: (id: string, body: Record<string, unknown>) =>
    api<AdDto>(`/ads/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteAd: (id: string) => api(`/ads/${id}`, { method: "DELETE" }),
  adsStats: (from?: string, to?: string, adId?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (adId) params.set("adId", adId);
    const q = params.toString();
    return api<AdsStatsDto>(`/ads/stats${q ? `?${q}` : ""}`);
  },
  adsStatsOverview: () => api<AdsOverviewDto>("/ads/stats/overview"),
  adminOverview: () => api<AdminOverviewDto>("/admin/overview"),
  adminUsers: () => api<AuthUser[]>("/admin/users"),
  adminFlags: () => api<FeatureFlagDto[]>("/admin/flags"),
  adminAudit: () => api<unknown[]>("/admin/audit"),

  applyTournamentAdmin: (payload: { message: string; orgName?: string; experience?: string }) =>
    api("/tournament-applications", { method: "POST", body: JSON.stringify(payload) }),
  myTournamentApplications: () => api<TournamentApplicationDto[]>("/tournament-applications/me"),
  listTournamentApplications: (status?: string) =>
    api<TournamentApplicationDto[]>(
      `/tournament-applications${status ? `?status=${status}` : ""}`,
    ),
  approveTournamentApplication: (id: string, reviewNote?: string) =>
    api(`/tournament-applications/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ reviewNote }),
    }),
  rejectTournamentApplication: (id: string, reviewNote?: string) =>
    api(`/tournament-applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reviewNote }),
    }),
  messageTournamentApplication: (id: string, body: string) =>
    api(`/tournament-applications/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  createSubmission: (payload: {
    title: string;
    type: string;
    eventId?: string | null;
    payload?: Record<string, unknown>;
    notes?: string;
  }) => api("/submissions", { method: "POST", body: JSON.stringify(payload) }),
  mySubmissions: () => api<SubmissionDto[]>("/submissions/mine"),
  myOrganizerEvents: () => api<OrganizerEventDto[]>("/submissions/my-events"),
  submissionsQueue: (status?: string) =>
    api<SubmissionDto[]>(`/submissions/queue${status ? `?status=${status}` : ""}`),
  submission: (id: string) => api<SubmissionDto>(`/submissions/${id}`),
  submitSubmission: (id: string) => api(`/submissions/${id}/submit`, { method: "POST", body: "{}" }),
  approveSubmission: (id: string, reviewNote?: string) =>
    api(`/submissions/${id}/approve`, { method: "POST", body: JSON.stringify({ reviewNote }) }),
  rejectSubmission: (id: string, reviewNote?: string) =>
    api(`/submissions/${id}/reject`, { method: "POST", body: JSON.stringify({ reviewNote }) }),
  requestSubmissionChanges: (id: string, reviewNote?: string) =>
    api(`/submissions/${id}/request-changes`, {
      method: "POST",
      body: JSON.stringify({ reviewNote }),
    }),
  publishSubmission: (id: string, reviewNote?: string) =>
    api(`/submissions/${id}/publish`, { method: "POST", body: JSON.stringify({ reviewNote }) }),
  messageSubmission: (id: string, body: string) =>
    api<StaffMessageDto>(`/submissions/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  updateMatchLive: (slug: string, body: Record<string, unknown>) =>
    api<MatchDto>(`/matches/${slug}/live`, { method: "PATCH", body: JSON.stringify(body) }),
  updateMatchStats: (slug: string, stats: unknown[]) =>
    api<MatchDto>(`/matches/${slug}/stats`, { method: "PUT", body: JSON.stringify({ stats }) }),
  addMatchRound: (slug: string, body: Record<string, unknown>) =>
    api<MatchDto>(`/matches/${slug}/rounds`, { method: "POST", body: JSON.stringify(body) }),

  comments: (query: string) =>
    api<CommentDto[]>(`/comments?${query}`, { auth: false }),
  createComment: (body: {
    target: "NEWS" | "MATCH";
    newsId?: string;
    matchId?: string;
    body: string;
  }) => api<CommentDto>("/comments", { method: "POST", body: JSON.stringify(body) }),
  hideComment: (id: string) => api(`/comments/${id}/hide`, { method: "PATCH", body: "{}" }),
  deleteComment: (id: string) => api(`/comments/${id}`, { method: "DELETE" }),

  notifications: () => api<NotificationDto[]>("/notifications"),
  notificationsUnread: () => api<{ count: number }>("/notifications/unread-count"),
  markNotificationRead: (id: string) =>
    api(`/notifications/${id}/read`, { method: "PATCH", body: "{}" }),
  markAllNotificationsRead: () =>
    api("/notifications/read-all", { method: "PATCH", body: "{}" }),
  favorites: () => api<FavoriteDto[]>("/notifications/favorites"),
  addFavorite: (body: { matchId?: string; teamId?: string; playerId?: string }) =>
    api<FavoriteDto>("/notifications/favorites", { method: "POST", body: JSON.stringify(body) }),
  removeFavorite: (id: string) =>
    api(`/notifications/favorites/${id}`, { method: "DELETE" }),
  getProfile: () => api<AuthUser>("/users/profile"),
  updateProfile: (body: { displayName?: string; bio?: string; avatarUrl?: string | null }) =>
    api<AuthUser>("/users/profile", { method: "PATCH", body: JSON.stringify(body) }),
  publicUser: (username: string) =>
    api<PublicUserDto>(`/users/${username}`, { auth: false }),
  uploadImage: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return api<{ url: string; filename: string; size: number; mimeType: string }>("/uploads", {
      method: "POST",
      body,
      formData: true,
    });
  },

  reports: (status?: string) =>
    api<ReportDto[]>(`/reports${status ? `?status=${status}` : ""}`),
  createReport: (body: { targetType: string; targetId: string; reason: string }) =>
    api("/reports", { method: "POST", body: JSON.stringify(body) }),
  reviewReport: (id: string, body: { status: "RESOLVED" | "DISMISSED"; note?: string }) =>
    api(`/reports/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  banUserLimited: (id: string, body: { until: string; reason?: string }) =>
    api(`/users/${id}/ban-limited`, { method: "PATCH", body: JSON.stringify(body) }),
  setUserRole: (id: string, role: string) =>
    api(`/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  adminBanUser: (id: string, banned: boolean) =>
    api(`/admin/users/${id}/ban`, { method: "PATCH", body: JSON.stringify({ banned }) }),
  adminSetFlag: (key: string, enabled: boolean) =>
    api(`/admin/flags/${key}`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
  adminSystem: () => api<Record<string, unknown>>("/admin/system"),

  adminNews: () => api<unknown[]>("/news/admin/all"),
  createNews: (body: Record<string, unknown>) =>
    api("/news", { method: "POST", body: JSON.stringify(body) }),
  updateNews: (id: string, body: Record<string, unknown>) =>
    api(`/news/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteNews: (id: string) => api(`/news/${id}`, { method: "DELETE" }),

  adminEvents: () => api<EventDto[]>("/events/admin/all"),
  createEvent: (body: Record<string, unknown>) =>
    api("/events", { method: "POST", body: JSON.stringify(body) }),
  updateEvent: (id: string, body: Record<string, unknown>) =>
    api(`/events/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  createTeam: (body: Record<string, unknown>) =>
    api("/teams", { method: "POST", body: JSON.stringify(body) }),
  updateTeam: (id: string, body: Record<string, unknown>) =>
    api(`/teams/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  assignOrganizer: (body: { eventId: string; userId: string; role?: string }) =>
    api("/submissions/assign-organizer", { method: "POST", body: JSON.stringify(body) }),

  forumHidePost: (id: string) => api(`/forums/posts/${id}/hide`, { method: "POST", body: "{}" }),
  forumLockThread: (id: string, locked: boolean) =>
    api(`/forums/threads/${id}/lock`, { method: "PATCH", body: JSON.stringify({ locked }) }),
  forumPinThread: (id: string, pinned: boolean) =>
    api(`/forums/threads/${id}/pin`, { method: "PATCH", body: JSON.stringify({ pinned }) }),
};

export interface AuthUser {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface PublicUserDto {
  id: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role: string;
  createdAt: string;
}

export interface TeamDto {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  logo: string;
  country: string;
  region: string;
  ranking: number;
  points: number;
  players?: PlayerDto[];
  matches?: MatchDto[];
  _count?: { players: number };
}

export interface PlayerDto {
  id: string;
  slug: string;
  nickname: string;
  realName: string;
  country: string;
  role: string;
  photo: string;
  photoUrl?: string | null;
  steamId?: string | null;
  status?: string;
  ranking?: number;
  rankingPoints?: number;
  rating: number;
  rating21?: number;
  rating30?: number;
  kd: number;
  adr: number;
  kast?: number;
  impact: number;
  mapsPlayed: number;
  team?: TeamDto | null;
  teamId?: string | null;
  history?: Array<{
    id: string;
    joinedAt: string;
    leftAt?: string | null;
    team: TeamDto;
  }>;
  matchStats?: Array<{
    kills: number;
    deaths: number;
    assists: number;
    adr: number;
    rating: number;
    rating30?: number;
    mapName?: string | null;
    match?: MatchDto;
  }>;
  mapStats?: Array<{
    mapName: string;
    maps: number;
    kd: number;
    adr: number;
    rating: number;
  }>;
}

export interface SceneAwardDto {
  id: string;
  kind: "MVP" | "EVP" | "TOP20" | "HALL_OF_FAME";
  year?: number | null;
  rank?: number | null;
  note?: string | null;
  playerId: string;
  eventId?: string | null;
  createdAt?: string;
  player?: PlayerDto | null;
  event?: EventDto | null;
}

export interface TransferHistoryDto {
  id: string;
  joinedAt: string;
  leftAt?: string | null;
  player?: PlayerDto | null;
  team?: TeamDto | null;
}

export interface LivePlayerDto {
  steamId: string;
  name: string;
  team: string;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  health: number;
  armor: number;
  money: number;
  hasHelmet: boolean;
  damage: number;
  alive: boolean;
  weapon: string | null;
  playerId?: string | null;
}

export interface GsiConfigDto {
  token: string;
  matchId: string;
  slug: string;
  uri: string;
  cfg: string;
  fileName: string;
  installHints: string[];
  gsiLastAt?: string | null;
  gsiOnline: boolean;
}

export interface MatchDemoDto {
  id: string;
  mapName?: string | null;
  originalName: string;
  sizeBytes: number;
  status: string;
  error?: string | null;
  createdAt?: string;
  processedAt?: string | null;
}

export interface MatchDto {
  id: string;
  slug: string;
  status: string;
  format: string;
  scheduledAt: string;
  team1Score: number;
  team2Score: number;
  stars: number;
  streamUrl?: string | null;
  team1Side?: string | null;
  currentRound?: number;
  roundTimeSec?: number;
  activeMapName?: string | null;
  gsiOnline?: boolean;
  gsiLastAt?: string | null;
  bombState?: string | null;
  roundPhase?: string | null;
  livePlayers?: LivePlayerDto[];
  team1: TeamDto;
  team2: TeamDto;
  event: EventDto;
  maps: Array<{
    mapName: string;
    team1Score: number;
    team2Score: number;
    winnerId?: string | null;
    team1Side?: string | null;
  }>;
  vetos?: Array<{ action: string; mapName: string; teamId?: string | null; order: number }>;
  playerStats?: Array<{
    player: PlayerDto;
    kills: number;
    deaths: number;
    assists: number;
    rating: number;
    adr: number;
    kast?: number;
    headshots?: number;
    mapName?: string | null;
  }>;
  rounds?: Array<{
    mapNumber: number;
    roundNumber: number;
    winnerSide: string;
    team1Score: number;
    team2Score: number;
    bombPlanted: boolean;
    isEco: boolean;
    note?: string | null;
  }>;
  odds?: BettingOddDto[];
  bracket?: { id: string; round: string; position: number } | null;
}

export interface StaffMessageDto {
  id: string;
  body: string;
  createdAt: string;
  fromUser: { id: string; username: string; displayName: string; role: string };
}

export interface TournamentApplicationDto {
  id: string;
  message: string;
  orgName?: string | null;
  experience?: string | null;
  status: string;
  reviewNote?: string | null;
  createdAt: string;
  user?: AuthUser;
  messages?: StaffMessageDto[];
}

export interface SubmissionDto {
  id: string;
  title: string;
  type: string;
  status: string;
  notes?: string | null;
  payload?: Record<string, unknown> | string;
  createdAt: string;
  updatedAt: string;
  author?: AuthUser;
  event?: { id: string; name: string; slug: string } | null;
  messages?: StaffMessageDto[];
}

export interface OrganizerEventDto {
  id: string;
  role: string;
  event: EventDto;
}

export interface EventDto {
  id: string;
  slug: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  prizePool: number;
  tier: string;
  logo: string;
  coverImage?: string | null;
  teamsCount: number;
  status: string;
  mapPool?: string;
  formatNote?: string | null;
  teams?: Array<{ seed?: number | null; team: TeamDto }>;
  matches?: MatchDto[];
}

export interface NewsDto {
  id: string;
  slug: string;
  category: string;
  featured: boolean;
  coverImage?: string | null;
  galleryImages?: string[];
  publishedAt?: string | null;
  tags: string[] | string;
  title: string;
  excerpt: string;
  content: string;
  locale?: string;
  availableLocales?: string[];
  author: { id: string; displayName: string; username: string };
  comments?: CommentDto[];
}

export interface CommentDto {
  id: string;
  body: string;
  createdAt: string;
  user: { username: string; displayName: string };
}

export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  href?: string | null;
  read: boolean;
  createdAt: string;
}

export interface FavoriteDto {
  id: string;
  matchId?: string | null;
  teamId?: string | null;
  playerId?: string | null;
  match?: MatchDto | null;
  team?: TeamDto | null;
  player?: PlayerDto | null;
}

export interface ReportDto {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  note?: string | null;
  createdAt: string;
  reporter?: AuthUser;
  resolver?: AuthUser | null;
}

export interface ForumCategoryDto {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  threads?: ForumThreadDto[];
  _count?: { threads: number };
}

export interface ForumThreadDto {
  id: string;
  title: string;
  locked?: boolean;
  pinned?: boolean;
  createdAt?: string;
  updatedAt?: string;
  author: { username: string; displayName: string; role?: string };
  category?: { id: string; slug: string; name: string };
  posts?: Array<{
    id: string;
    body: string;
    author: { username: string; displayName: string; role?: string };
    createdAt: string;
  }>;
  _count?: { posts: number };
}

export interface GalleryAlbumDto {
  id: string;
  slug: string;
  title: string;
  coverUrl?: string | null;
  images?: Array<{ id: string; url: string; caption?: string | null }>;
  event?: { id: string; slug: string; name: string } | null;
  team?: { id: string; slug: string; name: string } | null;
  _count?: { images: number };
}

export interface StreamDto {
  id: string;
  title: string;
  platform: string;
  url: string;
  viewers: number;
  isLive: boolean;
  language: string;
}

export interface SearchResultDto {
  teams: TeamDto[];
  players: PlayerDto[];
  news: unknown[];
  events: EventDto[];
  matches: MatchDto[];
}

export interface FantasyLeagueDto {
  id: string;
  name: string;
  budget: number;
  event: EventDto;
  _count?: { teams: number };
}

export interface FantasyEventDto {
  league: FantasyLeagueDto;
  players: Array<PlayerDto & { cost: number }>;
}

export interface BettingOddDto {
  id: string;
  bookmaker: string;
  team1Odd: number;
  team2Odd: number;
  match: MatchDto;
}

export interface BettingGuideDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  locale: string;
}

export type AdFormat = "BANNER" | "SPONSORED_ARTICLE" | "TEASER";
export type AdStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED";
export type AdPlacementSlot =
  | "HOME_TOP"
  | "HOME_SIDEBAR"
  | "HOME_FEED"
  | "NEWS_SIDEBAR"
  | "NEWS_INFEED"
  | "LIVE_SIDEBAR"
  | "MATCH_SIDEBAR"
  | "GLOBAL_FOOTER";

export interface AdServeDto {
  id: string;
  title: string;
  slug?: string | null;
  format: AdFormat;
  imageUrl?: string | null;
  href: string;
  excerpt?: string | null;
  body?: string | null;
  sponsorLabel: string;
  weight: number;
}

export interface AdDto extends AdServeDto {
  status: AdStatus;
  startAt?: string | null;
  endAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  placements?: Array<{ id: string; slot: AdPlacementSlot }>;
  stats?: Array<{ date: string; impressions: number; clicks: number }>;
  createdBy?: { id: string; username: string; displayName: string } | null;
}

export interface AdsOverviewDto {
  today: { impressions: number; clicks: number; ctr: number };
  yesterday?: { impressions: number; clicks: number; ctr: number };
  week?: { impressions: number; clicks: number; ctr: number };
  active: number;
  paused?: number;
  draft?: number;
  total: number;
}

export interface AdsStatsDto {
  from: string;
  to: string;
  previous?: { from: string; to: string };
  totals: { impressions: number; clicks: number; ctr: number };
  previousTotals?: { impressions: number; clicks: number; ctr: number };
  deltas?: { impressions: number; clicks: number; ctr: number };
  daily: Array<{ date: string; impressions: number; clicks: number; ctr: number }>;
  ads: Array<{
    adId: string;
    title: string;
    format: string;
    status?: string;
    slots?: string[];
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  byFormat?: Array<{ format: string; impressions: number; clicks: number; ctr: number }>;
  bySlot?: Array<{ slot: string; impressions: number; clicks: number; ctr: number }>;
  byStatus?: Array<{
    status: string;
    count: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}

export interface FeatureFlagDto {
  id: string;
  key: string;
  enabled: boolean;
  note?: string | null;
}

export interface AdminOverviewDto {
  users: number;
  matches: number;
  news: number;
  threads: number;
  flags: FeatureFlagDto[];
}
