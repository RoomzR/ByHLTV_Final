import { z } from "zod";
import { UserRole } from "./enums";

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  displayName: z.string().min(2).max(64).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20).max(4096).optional(),
});

export const favoriteCreateSchema = z
  .object({
    matchId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    playerId: z.string().uuid().optional(),
  })
  .refine(
    (v) => [v.matchId, v.teamId, v.playerId].filter(Boolean).length === 1,
    "Provide exactly one of matchId, teamId, or playerId",
  );

export const banLimitedSchema = z.object({
  until: z.string().datetime(),
  reason: z.string().max(500).optional(),
});

export const banFullSchema = z.object({
  banned: z.boolean(),
});

/** Absolute http(s) URL or local /uploads path from the media API. */
export const mediaUrlSchema = z
  .string()
  .max(512)
  .refine(
    (v) => v.startsWith("/uploads/") || /^https?:\/\//i.test(v),
    "Must be an http(s) URL or /uploads/… path",
  );

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(64).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: mediaUrlSchema.optional().nullable(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2).max(80),
  shortName: z.string().min(2).max(8),
  country: z.string().min(2).max(8).default("BY"),
  region: z.string().min(2).max(64).default("Belarus"),
  logo: z.string().max(512).optional(),
});

export const updateTeamRankingSchema = z.object({
  ranking: z.number().int().min(1).max(999),
  points: z.number().min(0).max(1_000_000),
});

export const updatePlayerRankingSchema = z.object({
  ranking: z.number().int().min(1).max(999),
  rankingPoints: z.number().int().min(0).max(1_000_000),
});

export const createPlayerSchema = z.object({
  nickname: z.string().min(2).max(40),
  realName: z.string().min(2).max(80),
  country: z.string().min(2).max(8).default("BY"),
  teamId: z.string().uuid().nullable().optional(),
  role: z.enum(["AWPER", "RIFLER", "IGL", "SUPPORT", "LURKER"]),
  photo: z.string().max(8).optional(),
  photoUrl: mediaUrlSchema.optional().nullable(),
  steamId: z.string().min(5).max(32).nullable().optional(),
  birthDate: z.string().datetime().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "RETIRED"]).optional(),
  socials: z.record(z.string()).optional(),
});

export const createSceneAwardSchema = z
  .object({
    kind: z.enum(["MVP", "EVP", "TOP20", "HALL_OF_FAME"]),
    playerId: z.string().uuid(),
    eventId: z.string().uuid().nullable().optional(),
    year: z.number().int().min(2000).max(2100).nullable().optional(),
    rank: z.number().int().min(1).max(100).nullable().optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "MVP" || data.kind === "EVP") {
      if (!data.eventId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "eventId is required for MVP/EVP",
          path: ["eventId"],
        });
      }
    }
    if (data.kind === "EVP") {
      if (data.rank == null || data.rank < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "rank is required for EVP",
          path: ["rank"],
        });
      }
    }
    if (data.kind === "TOP20") {
      if (data.year == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "year is required for TOP20",
          path: ["year"],
        });
      }
      if (data.rank == null || data.rank < 1 || data.rank > 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "rank 1-20 is required for TOP20",
          path: ["rank"],
        });
      }
      if (data.eventId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "TOP20 must not have eventId",
          path: ["eventId"],
        });
      }
    }
    if (data.kind === "HALL_OF_FAME" && data.eventId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hall of Fame must not have eventId",
        path: ["eventId"],
      });
    }
  });

export const updateSceneAwardSchema = z
  .object({
    kind: z.enum(["MVP", "EVP", "TOP20", "HALL_OF_FAME"]).optional(),
    playerId: z.string().uuid().optional(),
    eventId: z.string().uuid().nullable().optional(),
    year: z.number().int().min(2000).max(2100).nullable().optional(),
    rank: z.number().int().min(1).max(100).nullable().optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.kind) return;
    if ((data.kind === "MVP" || data.kind === "EVP") && data.eventId === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "eventId is required for MVP/EVP",
        path: ["eventId"],
      });
    }
    if (data.kind === "TOP20" && data.rank != null && (data.rank < 1 || data.rank > 20)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "rank 1-20 for TOP20",
        path: ["rank"],
      });
    }
  });

export const updatePlayerSchema = createPlayerSchema.partial().extend({
  teamId: z.string().uuid().nullable().optional(),
});

export const playerHistorySchema = z.object({
  teamId: z.string().uuid(),
  joinedAt: z.string().datetime().optional(),
  leftAt: z.string().datetime().nullable().optional(),
});

export const createNewsSchema = z.object({
  slug: z.string().min(3).max(120),
  category: z.enum(["NEWS", "INTERVIEW", "ANALYSIS", "TRANSFER"]),
  featured: z.boolean().optional(),
  coverImage: mediaUrlSchema.optional().nullable(),
  galleryImages: z.array(mediaUrlSchema).max(24).optional(),
  tags: z.array(z.string()).default([]),
  translations: z
    .array(
      z.object({
        locale: z.enum(["be", "ru", "en"]),
        title: z.string().min(3),
        excerpt: z.string().min(3),
        content: z.string().min(3),
      }),
    )
    .min(3)
    .refine(
      (rows) => new Set(rows.map((r) => r.locale)).size === rows.length,
      "Each locale (be/ru/en) must appear once",
    )
    .refine(
      (rows) => ["be", "ru", "en"].every((l) => rows.some((r) => r.locale === l)),
      "Translations for be, ru and en are required",
    ),
});

export const roleUpdateSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const tournamentApplicationSchema = z.object({
  message: z.string().min(20).max(2000),
  orgName: z.string().min(2).max(120).optional(),
  experience: z.string().max(2000).optional(),
});

export const applicationReviewSchema = z.object({
  reviewNote: z.string().max(1000).optional(),
});

export const eventSubmissionSchema = z.object({
  title: z.string().min(3).max(200),
  type: z.enum(["MATCH_UPDATE", "NEWS_DRAFT", "BRACKET", "LIVE_PACKAGE"]),
  eventId: z.string().uuid().nullable().optional(),
  payload: z.record(z.unknown()).default({}),
  notes: z.string().max(2000).optional(),
});

export const staffMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const matchLiveUpdateSchema = z.object({
  team1Score: z.number().int().min(0).optional(),
  team2Score: z.number().int().min(0).optional(),
  status: z.enum(["UPCOMING", "LIVE", "FINISHED"]).optional(),
  team1Side: z.enum(["CT", "T"]).nullable().optional(),
  currentRound: z.number().int().min(0).optional(),
  roundTimeSec: z.number().int().min(0).max(200).optional(),
  activeMapName: z.string().max(32).nullable().optional(),
  maps: z
    .array(
      z.object({
        mapName: z.string(),
        team1Score: z.number().int().min(0),
        team2Score: z.number().int().min(0),
        winnerId: z.string().optional(),
        team1Side: z.enum(["CT", "T"]).optional(),
      }),
    )
    .optional(),
});

export const matchRoundSchema = z.object({
  mapNumber: z.number().int().min(1).default(1),
  roundNumber: z.number().int().min(1),
  winnerSide: z.enum(["CT", "T"]),
  team1Score: z.number().int().min(0),
  team2Score: z.number().int().min(0),
  bombPlanted: z.boolean().optional(),
  isEco: z.boolean().optional(),
  note: z.string().max(200).optional(),
});

export const matchStatsBatchSchema = z.object({
  stats: z.array(
    z.object({
      playerId: z.string().uuid(),
      mapName: z.string().optional(),
      kills: z.number().int().min(0),
      deaths: z.number().int().min(0),
      assists: z.number().int().min(0),
      adr: z.number().min(0),
      rating: z.number().min(0),
    }),
  ),
});

export const createMatchSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, hyphens")
    .optional(),
  team1Id: z.string().uuid(),
  team2Id: z.string().uuid(),
  eventId: z.string().uuid(),
  format: z.enum(["BO1", "BO3", "BO5"]).default("BO3"),
  scheduledAt: z.string().datetime(),
  stars: z.number().int().min(0).max(5).default(0),
  streamUrl: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.string().url().nullable().optional(),
  ),
  maps: z.array(z.string().min(1).max(32)).max(7).optional(),
  status: z.enum(["UPCOMING", "LIVE", "FINISHED"]).default("UPCOMING"),
});

export const updateMatchMetaSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  format: z.enum(["BO1", "BO3", "BO5"]).optional(),
  stars: z.number().int().min(0).max(5).optional(),
  streamUrl: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.string().url().nullable().optional(),
  ),
  status: z.enum(["UPCOMING", "LIVE", "FINISHED"]).optional(),
  maps: z
    .array(
      z.object({
        mapName: z.string().min(1).max(32),
        team1Score: z.number().int().min(0).optional(),
        team2Score: z.number().int().min(0).optional(),
        winnerId: z.string().uuid().nullable().optional(),
      }),
    )
    .max(7)
    .optional(),
});

export const matchVetoStepSchema = z.object({
  action: z.enum(["ban", "pick", "leftover"]),
  mapName: z.string().min(1).max(32),
  teamId: z.string().uuid().nullable().optional(),
  order: z.number().int().min(1),
});

export const matchVetosSchema = z.object({
  vetos: z.array(matchVetoStepSchema).max(20),
});

export const galleryMediaUrlSchema = z
  .string()
  .max(512)
  .refine(
    (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
    "Must be a site path or http(s) URL",
  );

export const createGalleryAlbumSchema = z.object({
  title: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  coverUrl: galleryMediaUrlSchema.nullable().optional(),
  eventId: z.string().uuid().nullable().optional(),
  teamId: z.string().uuid().nullable().optional(),
  images: z
    .array(
      z.object({
        url: galleryMediaUrlSchema,
        caption: z.string().max(200).nullable().optional(),
      }),
    )
    .max(48)
    .optional(),
});

export const updateGalleryAlbumSchema = createGalleryAlbumSchema.partial();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamRankingInput = z.infer<typeof updateTeamRankingSchema>;
export type UpdatePlayerRankingInput = z.infer<typeof updatePlayerRankingSchema>;
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type CreateSceneAwardInput = z.infer<typeof createSceneAwardSchema>;
export type UpdateSceneAwardInput = z.infer<typeof updateSceneAwardSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type TournamentApplicationInput = z.infer<typeof tournamentApplicationSchema>;
export type EventSubmissionInput = z.infer<typeof eventSubmissionSchema>;
export type MatchLiveUpdateInput = z.infer<typeof matchLiveUpdateSchema>;
export type MatchRoundInput = z.infer<typeof matchRoundSchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchMetaInput = z.infer<typeof updateMatchMetaSchema>;
export type MatchVetosInput = z.infer<typeof matchVetosSchema>;
export type MatchVetoStepInput = z.infer<typeof matchVetoStepSchema>;
export const AD_FORMATS = ["BANNER", "SPONSORED_ARTICLE", "TEASER"] as const;
export const AD_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "EXPIRED"] as const;
export const AD_SLOTS = [
  "HOME_TOP",
  "HOME_SIDEBAR",
  "HOME_FEED",
  "NEWS_SIDEBAR",
  "NEWS_INFEED",
  "LIVE_SIDEBAR",
  "MATCH_SIDEBAR",
  "GLOBAL_FOOTER",
] as const;

export const createAdSchema = z.object({
  title: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .nullable()
    .optional(),
  format: z.enum(AD_FORMATS),
  status: z.enum(AD_STATUSES).default("DRAFT"),
  imageUrl: galleryMediaUrlSchema.nullable().optional(),
  href: z.string().min(1).max(1024),
  excerpt: z.string().max(500).nullable().optional(),
  body: z.string().max(20_000).nullable().optional(),
  sponsorLabel: z.string().min(1).max(40).optional(),
  weight: z.number().int().min(1).max(100).default(1),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  slots: z.array(z.enum(AD_SLOTS)).min(1).max(8),
});

export const updateAdSchema = createAdSchema.partial().extend({
  slots: z.array(z.enum(AD_SLOTS)).min(1).max(8).optional(),
});

export type CreateGalleryAlbumInput = z.infer<typeof createGalleryAlbumSchema>;
export type UpdateGalleryAlbumInput = z.infer<typeof updateGalleryAlbumSchema>;
export type CreateAdInput = z.infer<typeof createAdSchema>;
export type UpdateAdInput = z.infer<typeof updateAdSchema>;
export type AdFormat = (typeof AD_FORMATS)[number];
export type AdStatus = (typeof AD_STATUSES)[number];
export type AdPlacementSlot = (typeof AD_SLOTS)[number];
