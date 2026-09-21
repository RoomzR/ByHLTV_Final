/**
 * ByHLTV demo seed — Belarusian Esports League Season 2
 * Sources: belcs2.by (rosters + media), Onliner Tech (S2 final), t.me/bel_cs2_demos
 * Champion S2: UG_HUB 2:0 SKYNET · Prize pool 10 000 BYN
 * Media: run `node tooling/scripts/sync-belcs2-media.mjs` before seed.
 */
import {
  PrismaClient,
  UserRole,
  MatchStatus,
  MatchFormat,
  EventStatus,
  EventTier,
  NewsCategory,
  PlayerRole,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

const MAP_POOL = ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Dust2", "Train"];

const BEL_MANIFEST_PATH = join(__dirname, "../../../apps/api/uploads/bel/manifest.json");

type BelManifest = {
  gallery: string[];
  covers: Record<string, string>;
  seedMap: Record<
    string,
    {
      name: string;
      shortName: string;
      region: string;
      logo: string;
      players: Array<{ nickname: string; photoUrl: string }>;
    }
  >;
};

function loadBelManifest(): BelManifest {
  if (!existsSync(BEL_MANIFEST_PATH)) {
    throw new Error(
      `Missing BEL media manifest at ${BEL_MANIFEST_PATH}. Run: node tooling/scripts/sync-belcs2-media.mjs`,
    );
  }
  return JSON.parse(readFileSync(BEL_MANIFEST_PATH, "utf8")) as BelManifest;
}

type TeamSeed = {
  slug: string;
  name: string;
  shortName: string;
  logo: string;
  ranking: number;
  points: number;
  region: string;
};

type PlayerSeed = {
  slug: string;
  nickname: string;
  realName: string;
  team: string;
  role: PlayerRole;
  rating: number;
  kd: number;
  adr: number;
  impact: number;
  mapsPlayed: number;
  photoUrl: string;
};

async function main() {
  await prisma.adStatDaily.deleteMany();
  await prisma.adPlacement.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.staffMessage.deleteMany();
  await prisma.eventSubmission.deleteMany();
  await prisma.eventOrganizer.deleteMany();
  await prisma.tournamentAdminApplication.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.bettingOdd.deleteMany();
  await prisma.bettingGuide.deleteMany();
  await prisma.fantasyPick.deleteMany();
  await prisma.fantasyTeam.deleteMany();
  await prisma.fantasyLeague.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.galleryAlbum.deleteMany();
  await prisma.stream.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.forumThread.deleteMany();
  await prisma.forumCategory.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.newsTranslation.deleteMany();
  await prisma.newsArticle.deleteMany();
  await prisma.rankingSnapshot.deleteMany();
  await prisma.sceneAward.deleteMany();
  await prisma.matchDemo.deleteMany();
  await prisma.playerMatchStat.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.matchRound.deleteMany();
  await prisma.mapVeto.deleteMany();
  await prisma.matchMap.deleteMany();
  await prisma.bracketNode.deleteMany();
  await prisma.match.deleteMany();
  await prisma.eventTeam.deleteMany();
  await prisma.event.deleteMany();
  await prisma.playerTeamHistory.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.session.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const bel = loadBelManifest();
  const belCover = bel.covers["bel-hero"] ?? bel.covers["bel-overview"] ?? bel.gallery[0] ?? null;
  const belLogo = bel.covers["bel-logo-full-light"] ?? belCover;
  const belOverview = bel.covers["bel-overview"] ?? belCover;

  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@byhltv.local",
      username: "superadmin",
      displayName: "Super Admin",
      passwordHash,
      role: UserRole.SUPERADMIN,
      avatarUrl: belLogo,
    },
  });

  const editor = await prisma.user.create({
    data: {
      email: "editor@byhltv.local",
      username: "editor",
      displayName: "Кацярына Літвін",
      passwordHash: await bcrypt.hash("Editor123!", 10),
      role: UserRole.EDITOR,
      avatarUrl: bel.gallery[0] ?? belLogo,
    },
  });

  await prisma.user.create({
    data: {
      email: "user@byhltv.local",
      username: "fanby",
      displayName: "BY Fan",
      passwordHash: await bcrypt.hash("User1234!", 10),
      role: UserRole.USER,
      avatarUrl: bel.gallery[1] ?? belLogo,
    },
  });

  const toAdmin = await prisma.user.create({
    data: {
      email: "to@byhltv.local",
      username: "toadmin",
      displayName: "BEL Desk",
      passwordHash: await bcrypt.hash("ToAdmin123!", 10),
      role: UserRole.TOURNAMENT_ADMIN,
      avatarUrl: belLogo,
    },
  });

  await prisma.user.create({
    data: {
      email: "mod@byhltv.local",
      username: "moderator",
      displayName: "Site Moderator",
      passwordHash: await bcrypt.hash("Mod1234!", 10),
      role: UserRole.MODERATOR,
      avatarUrl: bel.gallery[2] ?? belLogo,
    },
  });

  const pendingUser = await prisma.user.create({
    data: {
      email: "applicant@byhltv.local",
      username: "applicant",
      displayName: "TO Applicant",
      passwordHash: await bcrypt.hash("Apply1234!", 10),
      role: UserRole.USER,
      avatarUrl: bel.gallery[3] ?? belLogo,
    },
  });

  await prisma.tournamentAdminApplication.create({
    data: {
      userId: pendingUser.id,
      message: "Want to help feed BEL Swiss scores and LAN finals into ByHLTV.",
      orgName: "BEL Media Crew",
      experience: "Covered BEL Season 1 LAN at Meta Arena",
      status: "PENDING",
    },
  });

  // Rosters + photos from belcs2.by (apps/api/uploads/bel/manifest.json)
  const rankingPoints = [1000, 920, 860, 840, 720, 680, 640, 610, 540, 500, 420, 390, 360, 330, 300, 270];
  const teamsData: TeamSeed[] = Object.entries(bel.seedMap).map(([slug, t], i) => ({
    slug,
    name: t.name,
    shortName: t.shortName,
    logo: t.logo,
    ranking: i + 1,
    points: rankingPoints[i] ?? Math.max(200, 1000 - i * 50),
    region: t.region,
  }));

  const teams = {} as Record<string, string>;
  for (const t of teamsData) {
    const created = await prisma.team.create({
      data: { ...t, country: "BY" },
    });
    teams[t.slug] = created.id;
  }

  const rolesCycle = [PlayerRole.IGL, PlayerRole.AWPER, PlayerRole.RIFLER, PlayerRole.SUPPORT, PlayerRole.LURKER];

  const ratingByRank = (rank: number, seat: number) =>
    Math.round((1.32 - (rank - 1) * 0.018 - seat * 0.012 + (seat === 1 ? 0.04 : 0)) * 100) / 100;

  const playersData: PlayerSeed[] = [];
  for (const t of teamsData) {
    const roster = bel.seedMap[t.slug]?.players ?? [];
    roster.forEach((p, seat) => {
      const rating = ratingByRank(t.ranking, seat);
      playersData.push({
        slug: `${t.slug}-${p.nickname}`.toLowerCase(),
        nickname: p.nickname,
        realName: `${p.nickname} · ${t.region}`,
        team: t.slug,
        role: rolesCycle[seat],
        rating,
        kd: Math.round((rating + 0.02) * 100) / 100,
        adr: Math.round(70 + rating * 14),
        impact: Math.round((rating + 0.05) * 100) / 100,
        mapsPlayed: 40 + (17 - t.ranking) * 4 + seat * 2,
        photoUrl: p.photoUrl,
      });
    });
  }

  const players = {} as Record<string, string>;
  let steamIdx = 1;
  for (const p of playersData) {
    const created = await prisma.player.create({
      data: {
        slug: p.slug,
        nickname: p.nickname,
        realName: p.realName,
        teamId: teams[p.team],
        role: p.role,
        rating: p.rating,
        rating21: p.rating,
        rating30: p.rating,
        kd: p.kd,
        adr: p.adr,
        kast: 68 + (p.rating - 1) * 25,
        impact: p.impact,
        mapsPlayed: p.mapsPlayed,
        photo: p.nickname.slice(0, 1).toUpperCase(),
        photoUrl: p.photoUrl,
        steamId: `76561198${String(100000000 + steamIdx).padStart(8, "0")}`,
        country: "BY",
        status: "ACTIVE",
        ranking: steamIdx,
        rankingPoints: Math.round(p.rating * 100),
      },
    });
    players[p.slug] = created.id;
    steamIdx += 1;
    await prisma.playerTeamHistory.create({
      data: {
        playerId: created.id,
        teamId: teams[p.team],
        joinedAt: new Date("2026-05-01T12:00:00+03:00"),
      },
    });
  }

  // Sample roster moves so Transfers page is not empty
  const transferMoves: Array<{ playerSlug: string; from: string; to: string; left: string; joined: string }> = [
    { playerSlug: "meta-arena-roomz", from: "vibe", to: "meta-arena", left: "2026-05-20", joined: "2026-05-21" },
    { playerSlug: "meta-arena-phoenix", from: "vibe", to: "meta-arena", left: "2026-05-20", joined: "2026-05-21" },
    { playerSlug: "meta-arena-ch1psik", from: "vibe", to: "meta-arena", left: "2026-05-18", joined: "2026-05-19" },
    { playerSlug: "cyberloga-lollipop21k", from: "meta-arena", to: "cyberloga", left: "2026-04-10", joined: "2026-04-12" },
    { playerSlug: "ug-hub-pavlysha666", from: "cyberxata", to: "ug-hub", left: "2026-03-01", joined: "2026-03-05" },
    { playerSlug: "skynet-barsuk", from: "tron", to: "skynet", left: "2026-02-15", joined: "2026-02-18" },
    { playerSlug: "pixel-nikola", from: "click", to: "pixel", left: "2026-01-20", joined: "2026-01-22" },
    { playerSlug: "plazma-em0", from: "bastion", to: "plazma", left: "2026-04-01", joined: "2026-04-03" },
  ];
  for (const move of transferMoves) {
    const playerId = players[move.playerSlug];
    const fromId = teams[move.from];
    const toId = teams[move.to];
    if (!playerId || !fromId || !toId) continue;
    await prisma.playerTeamHistory.create({
      data: {
        playerId,
        teamId: fromId,
        joinedAt: new Date("2025-09-01T12:00:00+03:00"),
        leftAt: new Date(`${move.left}T20:00:00+03:00`),
      },
    });
    await prisma.playerTeamHistory.updateMany({
      where: { playerId, teamId: toId, leftAt: null },
      data: { joinedAt: new Date(`${move.joined}T12:00:00+03:00`) },
    });
  }

  const belS1 = await prisma.event.create({
    data: {
      slug: "bel-season-1",
      name: "BEL Season 1",
      location: "Мінск · Meta Arena",
      startDate: new Date("2026-02-09T12:00:00+03:00"),
      endDate: new Date("2026-03-15T22:00:00+03:00"),
      prizePool: 10000,
      tier: EventTier.A,
      logo: belLogo ?? "B1",
      coverImage: belOverview,
      teamsCount: 16,
      status: EventStatus.FINISHED,
      mapPool: JSON.stringify(MAP_POOL),
      formatNote: "Swiss online · Single-elim LAN finals · Champion: Cyberloga",
    },
  });

  const belS2 = await prisma.event.create({
    data: {
      slug: "bel-season-2",
      name: "BEL Season 2",
      location: "Belarus · Online + Meta Arena (Мінск)",
      startDate: new Date("2026-06-22T12:00:00+03:00"),
      endDate: new Date("2026-07-25T22:00:00+03:00"),
      prizePool: 10000,
      tier: EventTier.A,
      logo: belLogo ?? "B2",
      coverImage: belCover,
      teamsCount: 16,
      status: EventStatus.FINISHED,
      mapPool: JSON.stringify(MAP_POOL),
      formatNote:
        "Swiss BO3 online (play from home club) · Top-8 LAN single-elim at Meta Arena · Grand Final BO3 · Prize 10 000 BYN",
    },
  });

  const belS3 = await prisma.event.create({
    data: {
      slug: "bel-season-3",
      name: "BEL Season 3",
      location: "Belarus · TBA",
      startDate: new Date("2026-09-15T12:00:00+03:00"),
      endDate: new Date("2026-10-25T22:00:00+03:00"),
      prizePool: 10000,
      tier: EventTier.A,
      logo: belLogo ?? "B3",
      coverImage: belOverview,
      teamsCount: 16,
      status: EventStatus.UPCOMING,
      mapPool: JSON.stringify(MAP_POOL),
      formatNote: "Announcement window — clubs & calendar TBA on belcs2.by",
    },
  });

  for (const [i, slug] of Object.keys(teams).entries()) {
    await prisma.eventTeam.create({ data: { eventId: belS2.id, teamId: teams[slug], seed: i + 1 } });
    if (i < 8) {
      await prisma.eventTeam.create({ data: { eventId: belS1.id, teamId: teams[slug], seed: i + 1 } });
    }
    await prisma.eventTeam.create({ data: { eventId: belS3.id, teamId: teams[slug], seed: i + 1 } });
  }

  await prisma.eventOrganizer.create({
    data: { eventId: belS2.id, userId: toAdmin.id, role: "OWNER" },
  });

  // --- Swiss sample results (online stage) ---
  const swissPairs: Array<{
    slug: string;
    t1: string;
    t2: string;
    s1: number;
    s2: number;
    day: string;
    maps: Array<{ map: string; a: number; b: number }>;
  }> = [
    {
      slug: "bel-s2-swiss-ugh-cgs",
      t1: "ug-hub",
      t2: "cybergamesport",
      s1: 2,
      s2: 0,
      day: "2026-06-24T18:00:00+03:00",
      maps: [
        { map: "Mirage", a: 13, b: 7 },
        { map: "Nuke", a: 13, b: 9 },
      ],
    },
    {
      slug: "bel-s2-swiss-sky-vibe",
      t1: "skynet",
      t2: "vibe",
      s1: 2,
      s2: 1,
      day: "2026-06-25T19:00:00+03:00",
      maps: [
        { map: "Inferno", a: 13, b: 11 },
        { map: "Ancient", a: 10, b: 13 },
        { map: "Dust2", a: 13, b: 8 },
      ],
    },
    {
      slug: "bel-s2-swiss-meta-area",
      t1: "meta-arena",
      t2: "arearegion",
      s1: 2,
      s2: 0,
      day: "2026-06-26T18:30:00+03:00",
      maps: [
        { map: "Anubis", a: 13, b: 6 },
        { map: "Mirage", a: 13, b: 10 },
      ],
    },
    {
      slug: "bel-s2-swiss-clg-cxa",
      t1: "cyberloga",
      t2: "cyberxata",
      s1: 2,
      s2: 1,
      day: "2026-06-27T20:00:00+03:00",
      maps: [
        { map: "Nuke", a: 13, b: 11 },
        { map: "Train", a: 9, b: 13 },
        { map: "Inferno", a: 13, b: 7 },
      ],
    },
    {
      slug: "bel-s2-swiss-pxl-bas",
      t1: "pixel",
      t2: "bastion",
      s1: 2,
      s2: 0,
      day: "2026-06-28T17:00:00+03:00",
      maps: [
        { map: "Dust2", a: 13, b: 8 },
        { map: "Ancient", a: 13, b: 11 },
      ],
    },
    {
      slug: "bel-s2-swiss-plz-cbr",
      t1: "plazma",
      t2: "cyberbar",
      s1: 2,
      s2: 0,
      day: "2026-06-29T18:00:00+03:00",
      maps: [
        { map: "Mirage", a: 13, b: 9 },
        { map: "Nuke", a: 13, b: 5 },
      ],
    },
    {
      slug: "bel-s2-swiss-pdy-ap",
      t1: "playday",
      t2: "actionpoint",
      s1: 2,
      s2: 1,
      day: "2026-06-30T19:30:00+03:00",
      maps: [
        { map: "Inferno", a: 11, b: 13 },
        { map: "Anubis", a: 13, b: 10 },
        { map: "Train", a: 13, b: 9 },
      ],
    },
    {
      slug: "bel-s2-swiss-ugh-sky",
      t1: "ug-hub",
      t2: "skynet",
      s1: 2,
      s2: 1,
      day: "2026-07-05T20:00:00+03:00",
      maps: [
        { map: "Mirage", a: 13, b: 11 },
        { map: "Nuke", a: 9, b: 13 },
        { map: "Ancient", a: 13, b: 7 },
      ],
    },
    {
      slug: "bel-s2-swiss-tron-clk",
      t1: "tron",
      t2: "click",
      s1: 2,
      s2: 1,
      day: "2026-07-02T18:00:00+03:00",
      maps: [
        { map: "Mirage", a: 13, b: 10 },
        { map: "Inferno", a: 9, b: 13 },
        { map: "Nuke", a: 13, b: 8 },
      ],
    },
  ];

  const matchIds = {} as Record<string, string>;

  for (const m of swissPairs) {
    const created = await prisma.match.create({
      data: {
        slug: m.slug,
        team1Id: teams[m.t1],
        team2Id: teams[m.t2],
        eventId: belS2.id,
        status: MatchStatus.FINISHED,
        format: MatchFormat.BO3,
        scheduledAt: new Date(m.day),
        team1Score: m.s1,
        team2Score: m.s2,
        stars: m.t1 === "ug-hub" && m.t2 === "skynet" ? 5 : 3,
        streamUrl: "https://www.twitch.tv/bel_cs2",
        maps: {
          create: m.maps.map((mp, i) => ({
            mapName: mp.map,
            team1Score: mp.a,
            team2Score: mp.b,
            winnerId: mp.a > mp.b ? teams[m.t1] : teams[m.t2],
            order: i + 1,
          })),
        },
      },
    });
    matchIds[m.slug] = created.id;
  }

  // --- LAN playoffs Meta Arena 24–25 Jul (Onliner: final UG_HUB 2:0 SKYNET) ---
  const qf = [
    {
      slug: "bel-s2-qf-ugh-pdy",
      t1: "ug-hub",
      t2: "playday",
      s1: 2,
      s2: 0,
      at: "2026-07-24T14:00:00+03:00",
      maps: [
        { map: "Mirage", a: 13, b: 6 },
        { map: "Inferno", a: 13, b: 9 },
      ],
    },
    {
      slug: "bel-s2-qf-sky-cgs",
      t1: "skynet",
      t2: "cybergamesport",
      s1: 2,
      s2: 1,
      at: "2026-07-24T17:00:00+03:00",
      maps: [
        { map: "Nuke", a: 13, b: 11 },
        { map: "Dust2", a: 10, b: 13 },
        { map: "Ancient", a: 13, b: 8 },
      ],
    },
    {
      slug: "bel-s2-qf-meta-pxl",
      t1: "meta-arena",
      t2: "pixel",
      s1: 2,
      s2: 0,
      at: "2026-07-24T20:00:00+03:00",
      maps: [
        { map: "Anubis", a: 13, b: 7 },
        { map: "Train", a: 13, b: 10 },
      ],
    },
    {
      slug: "bel-s2-qf-clg-plz",
      t1: "cyberloga",
      t2: "plazma",
      s1: 2,
      s2: 1,
      at: "2026-07-24T22:30:00+03:00",
      maps: [
        { map: "Mirage", a: 13, b: 11 },
        { map: "Inferno", a: 9, b: 13 },
        { map: "Nuke", a: 13, b: 9 },
      ],
    },
  ];

  for (const m of qf) {
    const created = await prisma.match.create({
      data: {
        slug: m.slug,
        team1Id: teams[m.t1],
        team2Id: teams[m.t2],
        eventId: belS2.id,
        status: MatchStatus.FINISHED,
        format: MatchFormat.BO3,
        scheduledAt: new Date(m.at),
        team1Score: m.s1,
        team2Score: m.s2,
        stars: 4,
        streamUrl: "https://www.twitch.tv/bel_cs2",
        maps: {
          create: m.maps.map((mp, i) => ({
            mapName: mp.map,
            team1Score: mp.a,
            team2Score: mp.b,
            winnerId: mp.a > mp.b ? teams[m.t1] : teams[m.t2],
            order: i + 1,
          })),
        },
      },
    });
    matchIds[m.slug] = created.id;
  }

  const sf1 = await prisma.match.create({
    data: {
      slug: "bel-s2-sf-ugh-meta",
      team1Id: teams["ug-hub"],
      team2Id: teams["meta-arena"],
      eventId: belS2.id,
      status: MatchStatus.FINISHED,
      format: MatchFormat.BO3,
      scheduledAt: new Date("2026-07-25T14:00:00+03:00"),
      team1Score: 2,
      team2Score: 1,
      stars: 5,
      streamUrl: "https://www.twitch.tv/bel_cs2",
      maps: {
        create: [
          { mapName: "Mirage", team1Score: 13, team2Score: 11, winnerId: teams["ug-hub"], order: 1 },
          { mapName: "Nuke", team1Score: 10, team2Score: 13, winnerId: teams["meta-arena"], order: 2 },
          { mapName: "Ancient", team1Score: 13, team2Score: 7, winnerId: teams["ug-hub"], order: 3 },
        ],
      },
    },
  });
  matchIds[sf1.slug] = sf1.id;

  const sf2 = await prisma.match.create({
    data: {
      slug: "bel-s2-sf-sky-clg",
      team1Id: teams.skynet,
      team2Id: teams.cyberloga,
      eventId: belS2.id,
      status: MatchStatus.FINISHED,
      format: MatchFormat.BO3,
      scheduledAt: new Date("2026-07-25T17:00:00+03:00"),
      team1Score: 2,
      team2Score: 0,
      stars: 5,
      streamUrl: "https://www.twitch.tv/bel_cs2",
      maps: {
        create: [
          { mapName: "Inferno", team1Score: 13, team2Score: 9, winnerId: teams.skynet, order: 1 },
          { mapName: "Dust2", team1Score: 13, team2Score: 11, winnerId: teams.skynet, order: 2 },
        ],
      },
    },
  });
  matchIds[sf2.slug] = sf2.id;

  const grandFinal = await prisma.match.create({
    data: {
      slug: "bel-s2-grand-final",
      team1Id: teams["ug-hub"],
      team2Id: teams.skynet,
      eventId: belS2.id,
      status: MatchStatus.FINISHED,
      format: MatchFormat.BO3,
      scheduledAt: new Date("2026-07-25T20:00:00+03:00"),
      team1Score: 2,
      team2Score: 0,
      stars: 5,
      streamUrl: "https://www.twitch.tv/bel_cs2",
      maps: {
        create: [
          { mapName: "Mirage", team1Score: 13, team2Score: 8, winnerId: teams["ug-hub"], order: 1 },
          { mapName: "Nuke", team1Score: 13, team2Score: 10, winnerId: teams["ug-hub"], order: 2 },
        ],
      },
      vetos: {
        create: [
          { action: "ban", mapName: "Train", teamId: teams["ug-hub"], order: 1 },
          { action: "ban", mapName: "Anubis", teamId: teams.skynet, order: 2 },
          { action: "pick", mapName: "Mirage", teamId: teams["ug-hub"], order: 3 },
          { action: "pick", mapName: "Nuke", teamId: teams.skynet, order: 4 },
          { action: "decider", mapName: "Ancient", order: 5 },
        ],
      },
    },
  });
  matchIds[grandFinal.slug] = grandFinal.id;

  // S1 final archive
  await prisma.match.create({
    data: {
      slug: "bel-s1-grand-final",
      team1Id: teams.cyberloga,
      team2Id: teams.vibe,
      eventId: belS1.id,
      status: MatchStatus.FINISHED,
      format: MatchFormat.BO3,
      scheduledAt: new Date("2026-03-15T19:00:00+03:00"),
      team1Score: 2,
      team2Score: 1,
      stars: 5,
      maps: {
        create: [
          { mapName: "Mirage", team1Score: 13, team2Score: 11, winnerId: teams.cyberloga, order: 1 },
          { mapName: "Inferno", team1Score: 10, team2Score: 13, winnerId: teams.vibe, order: 2 },
          { mapName: "Nuke", team1Score: 13, team2Score: 7, winnerId: teams.cyberloga, order: 3 },
        ],
      },
    },
  });

  // Upcoming S3 teaser + live showmatch for demo boards
  const now = Date.now();
  await prisma.match.create({
    data: {
      slug: "bel-s3-open-ugh-clg",
      team1Id: teams["ug-hub"],
      team2Id: teams.cyberloga,
      eventId: belS3.id,
      status: MatchStatus.UPCOMING,
      format: MatchFormat.BO3,
      scheduledAt: new Date(now + 5 * 86400_000),
      stars: 4,
      streamUrl: "https://www.twitch.tv/bel_cs2",
    },
  });

  const liveShow = await prisma.match.create({
    data: {
      slug: "bel-showmatch-ugh-sky",
      team1Id: teams["ug-hub"],
      team2Id: teams.skynet,
      eventId: belS2.id,
      status: MatchStatus.LIVE,
      format: MatchFormat.BO3,
      scheduledAt: new Date(now - 35 * 60_000),
      team1Score: 1,
      team2Score: 0,
      stars: 5,
      streamUrl: "https://www.twitch.tv/bel_cs2",
      team1Side: "CT",
      currentRound: 16,
      roundTimeSec: 82,
      activeMapName: "Mirage",
      gsiToken: "bel-demo-gsi-showmatch",
      maps: {
        create: [
          { mapName: "Nuke", team1Score: 13, team2Score: 9, winnerId: teams["ug-hub"], order: 1 },
          { mapName: "Mirage", team1Score: 8, team2Score: 7, order: 2, team1Side: "CT" },
        ],
      },
    },
  });

  await prisma.matchRound.createMany({
    data: [
      { matchId: liveShow.id, mapNumber: 2, roundNumber: 14, winnerSide: "CT", team1Score: 7, team2Score: 7 },
      { matchId: liveShow.id, mapNumber: 2, roundNumber: 15, winnerSide: "CT", team1Score: 8, team2Score: 7 },
      {
        matchId: liveShow.id,
        mapNumber: 2,
        roundNumber: 16,
        winnerSide: "T",
        team1Score: 8,
        team2Score: 7,
        bombPlanted: true,
      },
    ],
  });

  /** Per-map line for every roster seat — fills Recent matches / Maps / match boards. */
  function synthLine(p: PlayerSeed, seat: number, won: boolean, rounds: number, salt: number) {
    const winBoost = won ? 0.11 : -0.09;
    const wobble = ((salt % 9) - 4) * 0.012;
    const rating =
      Math.round(Math.max(0.55, (p.rating + winBoost - seat * 0.035 + wobble) * 100)) / 100;
    const kills = Math.max(2, Math.round(rounds * (0.55 + rating * 0.28) - seat * 1.2 + (salt % 3)));
    const deaths = Math.max(2, Math.round(rounds * (0.78 - (won ? 0.08 : 0) + seat * 0.04) + (salt % 2)));
    const assists = Math.max(0, Math.round(1.5 + seat * 0.8 + (salt % 4)));
    const adr =
      Math.round(Math.max(40, 52 + rating * 30 + (won ? 5 : -4) - seat * 2.5 + (salt % 5)) * 10) / 10;
    const kast =
      Math.round(Math.max(45, 60 + rating * 16 + (won ? 4 : -3) - seat * 1.2) * 10) / 10;
    const impact = Math.round((rating + 0.04 - seat * 0.01) * 100) / 100;
    return {
      kills,
      deaths,
      assists,
      adr,
      rating,
      rating21: Math.round((rating - 0.02) * 100) / 100,
      rating30: rating,
      kast,
      impact,
      roundsPlayed: rounds,
      damage: Math.round(adr * rounds),
      headshots: Math.max(0, Math.round(kills * (0.38 + (salt % 5) * 0.02))),
      openingKills: Math.max(0, Math.min(4, 3 - seat + (salt % 2))),
      flashAssists: Math.max(0, (seat + salt) % 3),
    };
  }

  const rosterByTeam = new Map<string, PlayerSeed[]>();
  for (const p of playersData) {
    const list = rosterByTeam.get(p.team) ?? [];
    list.push(p);
    rosterByTeam.set(p.team, list);
  }
  const teamSlugById = Object.fromEntries(
    Object.entries(teams).map(([slug, id]) => [id, slug]),
  ) as Record<string, string>;

  const matchesForStats = await prisma.match.findMany({
    where: { status: { in: [MatchStatus.FINISHED, MatchStatus.LIVE] } },
    include: { maps: { orderBy: { order: "asc" } } },
  });

  const matchStatRows: Array<{
    matchId: string;
    playerId: string;
    mapName: string;
    kills: number;
    deaths: number;
    assists: number;
    adr: number;
    rating: number;
    rating21: number;
    rating30: number;
    kast: number;
    impact: number;
    roundsPlayed: number;
    damage: number;
    headshots: number;
    openingKills: number;
    flashAssists: number;
  }> = [];

  let salt = 1;
  for (const match of matchesForStats) {
    for (const map of match.maps) {
      const rounds = Math.max(16, (map.team1Score ?? 0) + (map.team2Score ?? 0));
      const t1Won = (map.team1Score ?? 0) > (map.team2Score ?? 0);
      for (const side of [
        { teamId: match.team1Id, won: t1Won },
        { teamId: match.team2Id, won: !t1Won },
      ]) {
        const teamSlug = teamSlugById[side.teamId];
        const roster = rosterByTeam.get(teamSlug) ?? [];
        roster.forEach((p, seat) => {
          salt += 1;
          matchStatRows.push({
            matchId: match.id,
            playerId: players[p.slug],
            mapName: map.mapName,
            ...synthLine(p, seat, side.won, rounds, salt),
          });
        });
      }
    }
  }

  // Chunk createMany — SQLite bind limits
  const CHUNK = 80;
  for (let i = 0; i < matchStatRows.length; i += CHUNK) {
    await prisma.playerMatchStat.createMany({ data: matchStatRows.slice(i, i + CHUNK) });
  }

  // Align career aggregates with generated map lines
  for (const p of playersData) {
    const lines = matchStatRows.filter((r) => r.playerId === players[p.slug]);
    if (!lines.length) continue;
    const mapsPlayed = lines.length;
    const kills = lines.reduce((a, s) => a + s.kills, 0);
    const deaths = lines.reduce((a, s) => a + s.deaths, 0);
    const adr = lines.reduce((a, s) => a + s.adr, 0) / mapsPlayed;
    const rating30 = lines.reduce((a, s) => a + s.rating30, 0) / mapsPlayed;
    const rating21 = lines.reduce((a, s) => a + s.rating21, 0) / mapsPlayed;
    const kast = lines.reduce((a, s) => a + s.kast, 0) / mapsPlayed;
    const impact = lines.reduce((a, s) => a + s.impact, 0) / mapsPlayed;
    const kd = deaths === 0 ? kills : kills / deaths;
    await prisma.player.update({
      where: { id: players[p.slug] },
      data: {
        mapsPlayed,
        kd: Math.round(kd * 100) / 100,
        adr: Math.round(adr * 10) / 10,
        rating: Math.round(rating30 * 100) / 100,
        rating21: Math.round(rating21 * 100) / 100,
        rating30: Math.round(rating30 * 100) / 100,
        kast: Math.round(kast * 10) / 10,
        impact: Math.round(impact * 100) / 100,
        rankingPoints: Math.round(rating30 * 100),
      },
    });
    p.rating = Math.round(rating30 * 100) / 100;
    p.kd = Math.round(kd * 100) / 100;
    p.adr = Math.round(adr * 10) / 10;
    p.impact = Math.round(impact * 100) / 100;
    p.mapsPlayed = mapsPlayed;
  }

  await prisma.bracketNode.createMany({
    data: [
      { eventId: belS2.id, round: "Quarterfinal", position: 1, matchId: matchIds["bel-s2-qf-ugh-pdy"] },
      { eventId: belS2.id, round: "Quarterfinal", position: 2, matchId: matchIds["bel-s2-qf-sky-cgs"] },
      { eventId: belS2.id, round: "Quarterfinal", position: 3, matchId: matchIds["bel-s2-qf-meta-pxl"] },
      { eventId: belS2.id, round: "Quarterfinal", position: 4, matchId: matchIds["bel-s2-qf-clg-plz"] },
      { eventId: belS2.id, round: "Semifinal", position: 1, matchId: sf1.id },
      { eventId: belS2.id, round: "Semifinal", position: 2, matchId: sf2.id },
      { eventId: belS2.id, round: "Grand Final", position: 1, matchId: grandFinal.id },
    ],
  });

  // Demo stubs → Telegram channel for parse pipeline demo
  for (const [mapName, path] of [
    ["Mirage", "t.me/bel_cs2_demos/ug-hub-skynet-mirage"],
    ["Nuke", "t.me/bel_cs2_demos/ug-hub-skynet-nuke"],
  ] as const) {
    await prisma.matchDemo.create({
      data: {
        matchId: grandFinal.id,
        mapName,
        originalName: `BEL_S2_GF_${mapName}.dem`,
        storagePath: path,
        sizeBytes: 180_000_000,
        status: "PENDING",
        uploadedById: toAdmin.id,
      },
    });
  }

  for (const [i, t] of teamsData.entries()) {
    await prisma.rankingSnapshot.create({
      data: { kind: "team", teamId: teams[t.slug], rank: i + 1, points: t.points },
    });
  }
  const rankedPlayers = [...playersData].sort((a, b) => b.rating - a.rating);
  for (const [i, p] of rankedPlayers.entries()) {
    await prisma.player.update({
      where: { id: players[p.slug] },
      data: { ranking: i + 1, rankingPoints: Math.round(p.rating * 100) },
    });
    await prisma.rankingSnapshot.create({
      data: {
        kind: "player",
        playerId: players[p.slug],
        rank: i + 1,
        points: p.rating * 100,
        rating: p.rating,
      },
    });
  }

  const mvpSlug = "ug-hub-faizer";
  await prisma.sceneAward.createMany({
    data: [
      {
        kind: "MVP",
        year: 2026,
        rank: 1,
        note: "BEL Season 2 Grand Final MVP · Meta Arena",
        playerId: players[mvpSlug],
        eventId: belS2.id,
      },
      {
        kind: "EVP",
        year: 2026,
        rank: 1,
        note: "BEL Season 2 playoffs EVP",
        playerId: players["skynet-pogwasst"],
        eventId: belS2.id,
      },
      ...rankedPlayers.slice(0, 20).map((p, i) => ({
        kind: "TOP20" as const,
        year: 2026,
        rank: i + 1,
        note: "BEL Season 2 player ranking",
        playerId: players[p.slug],
        eventId: belS2.id,
      })),
      {
        kind: "HALL_OF_FAME",
        year: 2026,
        rank: 1,
        note: "BEL Season 2 champions — UG_HUB",
        playerId: players[mvpSlug],
        eventId: belS2.id,
      },
    ],
  });

  function tri(be: { title: string; excerpt: string; content: string }, ru: typeof be, en: typeof be) {
    return {
      create: [
        { locale: "be", ...be },
        { locale: "ru", ...ru },
        { locale: "en", ...en },
      ],
    };
  }

  const newsArticles = [
    {
      slug: "bel-s2-ug-hub-champions",
      category: NewsCategory.NEWS,
      featured: true,
      hoursAgo: 24 * 14,
      tags: ["BEL", "Season 2", "UG_HUB", "SKYNET"],
      tr: tri(
        {
          title: "UG_HUB — чэмпіён BEL Season 2",
          excerpt: "У фінале на Meta Arena віцебскі клуб перамог SKYNET 2:0 і забраў 4000 BYN.",
          content:
            "24–25 ліпеня ў кіберклубе Meta Arena (Мінск, Якуба Коласа, 37) прайшоў LAN-фінал другога сезона Belarusian Esports League.\n\nУ гранд-фінале сустрэліся UG_HUB і SKYNET. Матч скончыўся з лікам 2:0 на карысць UG_HUB. Чэмпіёны атрымалі 4000 BYN, срэбра — 2000 BYN. Агульны прызавы фонд сезона — 10 000 BYN.\n\nУ плей-офф выходзілі Cyberloga, META ARENA, PIXEL, UG_HUB, PLAZMA, CyberGameSport, Playday і SKYNET. Пераходны кубак лігі, які ў сезоне 1 трымала Cyberloga, цяпер у Vitebsk.\n\nДэмкі матчаў — у канале t.me/bel_cs2_demos. Афіцыйны хаб лігі: belcs2.by.",
        },
        {
          title: "UG_HUB — чемпион BEL Season 2",
          excerpt: "В финале на Meta Arena витебский клуб обыграл SKYNET 2:0 и забрал 4000 BYN.",
          content:
            "24–25 июля в киберклубе Meta Arena (Минск, Якуба Коласа, 37) прошёл LAN-финал второго сезона Belarusian Esports League.\n\nВ гранд-финале встретились UG_HUB и SKYNET. Матч закончился со счётом 2:0 в пользу UG_HUB. Чемпионы получили 4000 BYN, серебро — 2000 BYN. Общий призовой фонд сезона — 10 000 BYN.\n\nВ плей-офф вышли Cyberloga, META ARENA, PIXEL, UG_HUB, PLAZMA, CyberGameSport, Playday и SKYNET. Переходящий кубок лиги, который в сезоне 1 держала Cyberloga, теперь у Vitebsk.\n\nДемки матчей — в канале t.me/bel_cs2_demos. Официальный хаб лиги: belcs2.by.",
        },
        {
          title: "UG_HUB crowned BEL Season 2 champions",
          excerpt: "At Meta Arena the Vitebsk club beat SKYNET 2-0 and took home 4000 BYN.",
          content:
            "On 24–25 July the Belarusian Esports League Season 2 LAN finals were held at Meta Arena in Minsk.\n\nUG_HUB defeated SKYNET 2-0 in the grand final. Champions earned 4000 BYN; runners-up 2000 BYN. Season prize pool: 10 000 BYN.\n\nPlayoff eight: Cyberloga, META ARENA, PIXEL, UG_HUB, PLAZMA, CyberGameSport, Playday and SKYNET. The travelling cup moves from Season 1 winners Cyberloga to UG_HUB.\n\nMatch demos: t.me/bel_cs2_demos. League hub: belcs2.by.",
        },
      ),
    },
    {
      slug: "bel-s2-kickoff",
      category: NewsCategory.NEWS,
      featured: true,
      hoursAgo: 24 * 45,
      tags: ["BEL", "Season 2", "announcement"],
      tr: tri(
        {
          title: "BEL Season 2 стартаваў: 16 клубаў, 10 000 BYN",
          excerpt: "З 22 чэрвеня па 25 ліпеня — Swiss online і LAN-фінал на META ARENA.",
          content:
            "Другі сезон Belarusian Esports League афіцыйна стартуе 22 чэрвеня. 16 каманд ад камп'ютарных клубаў Беларусі змагаюцца за тытул і прызавы фонд 10 000 BYN.\n\nФармат: швейцарская сетка BO3 у онлайн-фармаце (кожная каманда гуляе са свайго клуба), топ-8 выходзяць у афлайн-фінал 24–25 ліпеня на META ARENA ў Мінску.\n\nРасклад, табліца і навіны — на belcs2.by, у Telegram і Instagram лігі.",
        },
        {
          title: "Стартовал BEL Season 2: 16 клубов, 10 000 BYN",
          excerpt: "С 22 июня по 25 июля — Swiss online и LAN-финал на META ARENA.",
          content:
            "Второй сезон Belarusian Esports League официально стартует 22 июня. 16 команд от компьютерных клубов Беларуси борются за титул и призовой фонд 10 000 BYN.\n\nФормат: швейцарская сетка BO3 в онлайне (каждая команда играет из своего клуба), топ-8 выходят в офлайн-финал 24–25 июля на META ARENA в Минске.\n\nРасписание, таблица и новости — на belcs2.by, в Telegram и Instagram лиги.",
        },
        {
          title: "BEL Season 2 is live: 16 clubs, 10 000 BYN",
          excerpt: "22 June – 25 July: Swiss online, then LAN finals at META ARENA.",
          content:
            "Belarusian Esports League Season 2 kicks off on 22 June. Sixteen club teams compete for the title and a 10 000 BYN prize pool.\n\nFormat: Swiss BO3 online (teams play from their home clubs), top 8 advance to the 24–25 July LAN finals at META ARENA in Minsk.\n\nSchedule and standings: belcs2.by plus the league Telegram and Instagram.",
        },
      ),
    },
    {
      slug: "bel-s2-playoff-eight",
      category: NewsCategory.NEWS,
      featured: true,
      hoursAgo: 24 * 20,
      tags: ["BEL", "playoffs", "Meta Arena"],
      tr: tri(
        {
          title: "Плей-офф BEL S2: восемь клубаў на Meta Arena",
          excerpt: "Cyberloga, META ARENA, PIXEL, UG_HUB, PLAZMA, CyberGameSport, Playday, SKYNET.",
          content:
            "Онлайн Swiss Season 2 завершаны. У LAN-плей-офф выходзяць восемь клубаў: Cyberloga, META ARENA, PIXEL, UG_HUB, PLAZMA, CyberGameSport, Playday і SKYNET.\n\nМатчы 24–25 ліпеня — на Meta Arena. Гледачы змогуць паглядзець сетку, фан-зону і сустрэць склад клубаў. Трансляцыі — на Twitch BEL.",
        },
        {
          title: "Плей-офф BEL S2: восемь клубов на Meta Arena",
          excerpt: "Cyberloga, META ARENA, PIXEL, UG_HUB, PLAZMA, CyberGameSport, Playday, SKYNET.",
          content:
            "Онлайн Swiss Season 2 завершён. В LAN-плей-офф выходят восемь клубов: Cyberloga, META ARENA, PIXEL, UG_HUB, PLAZMA, CyberGameSport, Playday и SKYNET.\n\nМатчи 24–25 июля — на Meta Arena. Зрители смогут увидеть сетку, фан-зону и составы. Трансляции — на Twitch BEL.",
        },
        {
          title: "BEL S2 playoffs: eight clubs at Meta Arena",
          excerpt: "Cyberloga, META ARENA, PIXEL, UG_HUB, PLAZMA, CyberGameSport, Playday, SKYNET.",
          content:
            "The Season 2 Swiss stage is done. LAN playoffs feature Cyberloga, META ARENA, PIXEL, UG_HUB, PLAZMA, CyberGameSport, Playday and SKYNET.\n\nMatches run 24–25 July at Meta Arena with a fan zone and Twitch BEL coverage.",
        },
      ),
    },
    {
      slug: "bel-format-club-league",
      category: NewsCategory.ANALYSIS,
      featured: false,
      hoursAgo: 24 * 40,
      tags: ["BEL", "format", "analysis"],
      tr: tri(
        {
          title: "Чаму BEL — клубная ліга, а не «зборныя горада»",
          excerpt: "Каманды прывязаны да канкрэтных кіберклубаў — гэта ядро мадэлі лігі.",
          content:
            "Belarusian Esports League будuje сцэну вакол клубаў: склад гуляе з арэны спонсара, фанаты маюць лакальную ідэнтычнасць, а арганізатары атрымліваюць устойлівую сетку пляцовак па краіне.\n\nСезон 2 пацвердзіў фармат: Swiss online → топ-8 LAN у Мінску. Прызавая лесвіца: 4000 / 2000 / 1000 / 500 BYN.\n\nДля ByHLTV гэта значыць: матчы, дэмкі, рэйтынг і навіны круцяцца вакол аднаго флагманскага турніру — BEL.",
        },
        {
          title: "Почему BEL — клубная лига, а не «сборные города»",
          excerpt: "Команды привязаны к конкретным киберклубам — это ядро модели лиги.",
          content:
            "Belarusian Esports League строит сцену вокруг клубов: состав играет с арены спонсора, у фанатов есть локальная идентичность, а организаторы получают устойчивую сеть площадок по стране.\n\nСезон 2 подтвердил формат: Swiss online → топ-8 LAN в Минске. Призовая лестница: 4000 / 2000 / 1000 / 500 BYN.\n\nДля ByHLTV это значит: матчи, демки, рейтинг и новости крутятся вокруг одного флагманского турнира — BEL.",
        },
        {
          title: "Why BEL is a club league, not city all-stars",
          excerpt: "Rosters are tied to real PC clubs — that is the league’s core model.",
          content:
            "Belarusian Esports League builds the scene around clubs: line-ups play from their sponsor venue, fans get local identity, and organizers gain a stable venue network.\n\nSeason 2 locked the format: Swiss online → top-8 LAN in Minsk. Prize steps: 4000 / 2000 / 1000 / 500 BYN.\n\nFor ByHLTV that means matches, demos, rankings and news orbit one flagship: BEL.",
        },
      ),
    },
    {
      slug: "bel-s1-cyberloga-retrospective",
      category: NewsCategory.NEWS,
      featured: false,
      hoursAgo: 24 * 120,
      tags: ["BEL", "Season 1", "Cyberloga"],
      tr: tri(
        {
          title: "Сезон 1: Cyberloga забірае першы пераходны кубак",
          excerpt: "У фінале мінскі клуб перамог VIBE. 3–4 месцы — META ARENA і CYBERXATA.",
          content:
            "Фінал першага сезона BEL прайшоў 14–15 сакавіка на Meta Arena. Cyberloga перамагла VIBE і атрымала 4000 BYN. Срэбра — VIBE (Гродна), 3–4 — META ARENA і CYBERXATA.\n\nМенавіта тады з’явіўся пераходны кубак лігі — сімвал, які ў сезоне 2 перайшоў да UG_HUB.",
        },
        {
          title: "Сезон 1: Cyberloga забирает первый переходящий кубок",
          excerpt: "В финале минский клуб обыграл VIBE. 3–4 места — META ARENA и CYBERXATA.",
          content:
            "Финал первого сезона BEL прошёл 14–15 марта на Meta Arena. Cyberloga обыграла VIBE и получила 4000 BYN. Серебро — VIBE (Гродно), 3–4 — META ARENA и CYBERXATA.\n\nИменно тогда появился переходящий кубок лиги — символ, который в сезоне 2 перешёл к UG_HUB.",
        },
        {
          title: "Season 1 flashback: Cyberloga lifts the first cup",
          excerpt: "The Minsk club beat VIBE in the final. 3rd–4th: META ARENA and CYBERXATA.",
          content:
            "BEL Season 1 finals ran 14–15 March at Meta Arena. Cyberloga beat VIBE for 4000 BYN. Silver went to VIBE; 3rd–4th META ARENA and CYBERXATA.\n\nThat event introduced the travelling cup — claimed by UG_HUB in Season 2.",
        },
      ),
    },
    {
      slug: "bel-demos-stats-pipeline",
      category: NewsCategory.ANALYSIS,
      featured: false,
      hoursAgo: 24 * 10,
      tags: ["demos", "stats", "BEL"],
      tr: tri(
        {
          title: "Дэмкі BEL: як ByHLTV парсіць статы з t.me/bel_cs2_demos",
          excerpt: "Канал з дэмкамі каманд — крыніца для K/D, ADR і рэйтынгаў сезона.",
          content:
            "Афіцыйны канал дэмак: https://t.me/bel_cs2_demos.\n\nПасля LAN-фіналу Season 2 мы падключылі матчы гранд-фіналу UG_HUB — SKYNET да чаргі парсінгу. Статус дэмак відаць у картцы матча (PENDING → PROCESSED).\n\nГэта дэмо-пайплайн для працадаўцы: загрузка → парсінг → PlayerMatchStat → рэйтынг і MVP.",
        },
        {
          title: "Демки BEL: как ByHLTV парсит стату из t.me/bel_cs2_demos",
          excerpt: "Канал с демками команд — источник для K/D, ADR и рейтингов сезона.",
          content:
            "Официальный канал демок: https://t.me/bel_cs2_demos.\n\nПосле LAN-финала Season 2 мы подключили матчи гранд-финала UG_HUB — SKYNET к очереди парсинга. Статус демок виден в карточке матча (PENDING → PROCESSED).\n\nЭто демо-пайплайн для работодателя: загрузка → парсинг → PlayerMatchStat → рейтинг и MVP.",
        },
        {
          title: "BEL demos: parsing stats from t.me/bel_cs2_demos",
          excerpt: "The team demos channel feeds K/D, ADR and season ratings.",
          content:
            "Official demos channel: https://t.me/bel_cs2_demos.\n\nAfter the Season 2 LAN final we queued UG_HUB vs SKYNET demos. Match cards show parse status (PENDING → PROCESSED).\n\nEmployer demo pipeline: upload → parse → PlayerMatchStat → ranking & MVP.",
        },
      ),
    },
    {
      slug: "bel-interview-ug-hub",
      category: NewsCategory.INTERVIEW,
      featured: true,
      hoursAgo: 24 * 12,
      tags: ["UG_HUB", "interview", "BEL"],
      tr: tri(
        {
          title: "IGL UG_HUB: «Кубак павінен быць у Віцебску»",
          excerpt: "Кароткі разбор фіналу супраць SKYNET і планаў на Season 3.",
          content:
            "«Фінал на Meta Arena — гэта ціск. Мы разобралі Nuke SKYNET яшчэ пасля Swiss і ведалі, што Mirage — наш map. Галоўнае было не аддаць тэмп пасля пісталетаў.»\n\n«Сезон 2 даказаў, што клуб з Віцебска можа забраць нацыянальны тытул. Season 3 хочам закрыць яшчэ мацней — і каб дэмкі з канала лігі траплялі ў статы ByHLTV у той жа дзень.»",
        },
        {
          title: "IGL UG_HUB: «Кубок должен быть в Витебске»",
          excerpt: "Короткий разбор финала против SKYNET и планов на Season 3.",
          content:
            "«Финал на Meta Arena — это давление. Мы разобрали Nuke SKYNET ещё после Swiss и знали, что Mirage — наша карта. Главное было не отдать темп после пистолетов.»\n\n«Сезон 2 доказал, что клуб из Витебска может взять национальный титул. Season 3 хотим закрыть ещё сильнее — и чтобы демки из канала лиги попадали в статы ByHLTV в тот же день.»",
        },
        {
          title: "UG_HUB IGL: “The cup belongs in Vitebsk”",
          excerpt: "A short read on the SKYNET final and Season 3 plans.",
          content:
            "“A Meta Arena final is pressure. We broke SKYNET’s Nuke after Swiss and knew Mirage was our map. The key was not giving tempo away after pistols.”\n\n“Season 2 proved a Vitebsk club can take the national title. For Season 3 we want to go harder — and have league demos land in ByHLTV stats the same day.”",
        },
      ),
    },
    {
      slug: "bel-prize-pool-breakdown",
      category: NewsCategory.NEWS,
      featured: false,
      hoursAgo: 24 * 42,
      tags: ["BEL", "prize"],
      tr: tri(
        {
          title: "Прызавы фонд Season 2: як дзеляцца 10 000 BYN",
          excerpt: "1 месца — 4000, 2 — 2000, 3–4 — па 1000, 5–8 — па 500.",
          content:
            "Афіцыйная лесвіца BEL Season 2 (belcs2.by):\n\n• 1 месца — 4000 BYN\n• 2 месца — 2000 BYN\n• 3–4 месцы — па 1000 BYN\n• 5–8 месцы — па 500 BYN\n• Разам — 10 000 BYN\n\nПасля фіналу UG_HUB забралі золата, SKYNET — срэбра.",
        },
        {
          title: "Призовой фонд Season 2: как делятся 10 000 BYN",
          excerpt: "1 место — 4000, 2 — 2000, 3–4 — по 1000, 5–8 — по 500.",
          content:
            "Официальная лестница BEL Season 2 (belcs2.by):\n\n• 1 место — 4000 BYN\n• 2 место — 2000 BYN\n• 3–4 места — по 1000 BYN\n• 5–8 места — по 500 BYN\n• Итого — 10 000 BYN\n\nПосле финала UG_HUB забрали золото, SKYNET — серебро.",
        },
        {
          title: "Season 2 prize pool: how 10 000 BYN splits",
          excerpt: "1st 4000 · 2nd 2000 · 3rd–4th 1000 · 5th–8th 500 each.",
          content:
            "Official BEL Season 2 ladder (belcs2.by):\n\n• 1st — 4000 BYN\n• 2nd — 2000 BYN\n• 3rd–4th — 1000 BYN each\n• 5th–8th — 500 BYN each\n• Total — 10 000 BYN\n\nAfter the final UG_HUB took gold, SKYNET silver.",
        },
      ),
    },
    {
      slug: "bel-roster-moves-meta",
      category: NewsCategory.TRANSFER,
      featured: true,
      hoursAgo: 24 * 90,
      tags: ["transfer", "META ARENA", "VIBE"],
      tr: tri(
        {
          title: "META ARENA ўзмацняецца ігракамі з VIBE",
          excerpt: "Roomz, Phoenix і ch1psik перайшлі ў мінскі клуб перад Season 2.",
          content:
            "Перад стартам Belarusian Esports League Season 2 META ARENA абвясціла пра ўзмацненне складу.\n\nЗ VIBE (Гродна) ў Мінск перайшлі Roomz, Phoenix і ch1psik. Клуб заявіў, што мэта — стабільны топ-4 на LAN Meta Arena.\n\nПадрабязнасці трансфераў — у Players / Transfers на ByHLTV.",
        },
        {
          title: "META ARENA усиливается игроками из VIBE",
          excerpt: "Roomz, Phoenix и ch1psik перешли в минский клуб перед Season 2.",
          content:
            "Перед стартом Belarusian Esports League Season 2 META ARENA объявила об усилении состава.\n\nИз VIBE (Гродно) в Минск перешли Roomz, Phoenix и ch1psik. Клуб заявил, что цель — стабильный топ-4 на LAN Meta Arena.\n\nДетали трансферов — в Players / Transfers на ByHLTV.",
        },
        {
          title: "META ARENA adds VIBE players ahead of Season 2",
          excerpt: "Roomz, Phoenix and ch1psik join the Minsk club.",
          content:
            "Before Belarusian Esports League Season 2, META ARENA announced roster upgrades.\n\nRoomz, Phoenix and ch1psik moved from VIBE (Hrodna) to Minsk. The club aims for a stable top-4 at the Meta Arena LAN.\n\nTransfer details live under Players / Transfers on ByHLTV.",
        },
      ),
    },
  ];

  let news1Id = "";
  const newsCovers = [
    belCover,
    belOverview,
    bel.gallery[0],
    bel.gallery[1],
    bel.gallery[2],
    bel.gallery[3],
    belLogo,
  ].filter(Boolean) as string[];
  for (const [i, n] of newsArticles.entries()) {
    const created = await prisma.newsArticle.create({
      data: {
        slug: n.slug,
        category: n.category,
        featured: n.featured,
        published: true,
        publishedAt: new Date(now - n.hoursAgo * 3600_000),
        authorId: editor.id,
        tags: JSON.stringify(n.tags),
        coverImage: newsCovers[i % newsCovers.length] ?? belCover,
        galleryImages: JSON.stringify(bel.gallery.slice(0, 4)),
        translations: n.tr,
      },
    });
    if (n.slug === "bel-s2-ug-hub-champions") news1Id = created.id;
  }

  const general = await prisma.forumCategory.create({
    data: { slug: "general", name: "General", description: "Belarus CS / BEL discussion", order: 1 },
  });
  await prisma.forumCategory.create({
    data: { slug: "bel-season-2", name: "BEL Season 2", description: "Swiss, playoffs, demos", order: 2 },
  });
  const thread = await prisma.forumThread.create({
    data: {
      categoryId: general.id,
      authorId: superAdmin.id,
      title: "BEL Season 2 — обсуждение финала UG_HUB vs SKYNET",
      posts: {
        create: [
          {
            authorId: superAdmin.id,
            body: "Чемпионы сезона — UG_HUB. Демки: t.me/bel_cs2_demos. Сайт лиги: belcs2.by",
          },
        ],
      },
    },
  });

  const album = await prisma.galleryAlbum.create({
    data: {
      slug: "bel-s2-meta-arena",
      title: "BEL Season 2 · Meta Arena Finals",
      eventId: belS2.id,
      coverUrl: belCover ?? bel.gallery[0] ?? null,
      images: {
        create: bel.gallery.map((url, i) => ({
          url,
          caption:
            i === 0
              ? "BEL Season 2 · Meta Arena"
              : i === 1
                ? "Grand Final UG_HUB vs SKYNET"
                : i === 2
                  ? "LAN finals atmosphere"
                  : "BEL gallery",
          order: i + 1,
        })),
      },
    },
  });

  await prisma.stream.createMany({
    data: [
      {
        title: "BEL Main · Twitch",
        platform: "Twitch",
        url: "https://www.twitch.tv/bel_cs2",
        viewers: 2100,
        isLive: true,
        language: "ru",
      },
      {
        title: "ByHLTV BEL Desk",
        platform: "YouTube",
        url: "https://www.youtube.com/@byhltv",
        viewers: 480,
        isLive: true,
        language: "be",
      },
    ],
  });

  const league = await prisma.fantasyLeague.create({
    data: { eventId: belS2.id, name: "BEL Season 2 Fantasy", budget: 100, isActive: true },
  });

  await prisma.bettingOdd.create({
    data: { matchId: liveShow.id, bookmaker: "DemoBook", team1Odd: 1.55, team2Odd: 2.35 },
  });

  await prisma.bettingGuide.create({
    data: {
      slug: "bel-s2-how-to-read-lines",
      title: "How to read BEL derby lines",
      excerpt: "Club-league markets vs international odds.",
      content: "UG_HUB vs SKYNET on LAN priced UG_HUB as favorite after Swiss head-to-head.",
      locale: "en",
    },
  });

  await prisma.featureFlag.createMany({
    data: [
      { key: "fantasy", enabled: true },
      { key: "betting", enabled: true },
      { key: "forums", enabled: true },
      { key: "live_ws", enabled: true },
    ],
  });

  const fan = await prisma.user.findUnique({ where: { email: "user@byhltv.local" } });
  const mod = await prisma.user.findUnique({ where: { email: "mod@byhltv.local" } });

  if (fan) {
    await prisma.comment.create({
      data: {
        userId: fan.id,
        target: "NEWS",
        newsId: news1Id,
        body: "UG_HUB заслужено. Vitebsk takes the cup!",
      },
    });
    await prisma.comment.create({
      data: {
        userId: fan.id,
        target: "MATCH",
        matchId: grandFinal.id,
        body: "2:0 clean. Mirage was a clinic.",
      },
    });
    await prisma.notification.create({
      data: {
        userId: fan.id,
        title: "BEL Season 2 complete",
        body: "UG_HUB are champions. Read the final report.",
        href: "/news/bel-s2-ug-hub-champions",
      },
    });
    await prisma.favorite.create({
      data: { userId: fan.id, matchId: grandFinal.id },
    });
  }

  if (fan && mod) {
    await prisma.report.create({
      data: {
        reporterId: fan.id,
        targetType: "POST",
        targetId: (await prisma.forumPost.findFirst({ where: { threadId: thread.id } }))!.id,
        reason: "Spam test report for moderator queue",
        status: "OPEN",
      },
    });
    await prisma.report.create({
      data: {
        reporterId: fan.id,
        targetType: "COMMENT",
        targetId: (await prisma.comment.findFirst({ where: { userId: fan.id } }))!.id,
        reason: "Off-topic comment sample",
        status: "OPEN",
      },
    });
  }

  await prisma.eventSubmission.create({
    data: {
      eventId: belS2.id,
      authorId: toAdmin.id,
      title: "Live package: BEL S2 showmatch UG_HUB vs SKYNET",
      type: "LIVE_PACKAGE",
      status: "SUBMITTED",
      payload: JSON.stringify({
        matchSlug: "bel-showmatch-ugh-sky",
        demos: "https://t.me/bel_cs2_demos",
        note: "Map 2 Mirage underway — publish round log",
      }),
    },
  });

  const banner = await prisma.ad.create({
    data: {
      title: "BEL Season 2 — official hub",
      slug: "bel-home-banner",
      format: "BANNER",
      status: "ACTIVE",
      href: "https://www.belcs2.by/#overview",
      imageUrl: belCover,
      sponsorLabel: "BEL",
      weight: 10,
      createdById: superAdmin.id,
      placements: { create: [{ slot: "HOME_TOP" }, { slot: "GLOBAL_FOOTER" }] },
    },
  });

  const teaser = await prisma.ad.create({
    data: {
      title: "BEL demos channel",
      slug: "bel-demos-teaser",
      format: "TEASER",
      status: "ACTIVE",
      href: "https://t.me/bel_cs2_demos",
      imageUrl: bel.gallery[0] ?? belOverview,
      excerpt: "Match demos for parsing stats — UG_HUB, SKYNET and more.",
      sponsorLabel: "BEL",
      weight: 8,
      createdById: superAdmin.id,
      placements: {
        create: [
          { slot: "HOME_SIDEBAR" },
          { slot: "NEWS_SIDEBAR" },
          { slot: "LIVE_SIDEBAR" },
          { slot: "MATCH_SIDEBAR" },
        ],
      },
    },
  });

  const sponsored = await prisma.ad.create({
    data: {
      title: "Sponsored: BEL Season 2 recap",
      slug: "bel-feed-sponsored",
      format: "SPONSORED_ARTICLE",
      status: "ACTIVE",
      href: "/news/bel-s2-ug-hub-champions",
      imageUrl: bel.gallery[1] ?? belCover,
      excerpt: "Partner recap — Swiss, LAN finals, prize ladder.",
      body: "Full BEL Season 2 story for the Belarus club scene.",
      sponsorLabel: "Реклама",
      weight: 3,
      createdById: superAdmin.id,
      placements: { create: [{ slot: "HOME_FEED" }, { slot: "NEWS_INFEED" }] },
    },
  });

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    for (const { ad, baseImp, baseClk } of [
      { ad: banner, baseImp: 520, baseClk: 28 },
      { ad: teaser, baseImp: 340, baseClk: 31 },
      { ad: sponsored, baseImp: 210, baseClk: 14 },
    ]) {
      const wave = 0.7 + ((13 - i) % 5) * 0.12 + (i % 3) * 0.05;
      await prisma.adStatDaily.create({
        data: {
          adId: ad.id,
          date,
          impressions: Math.round(baseImp * wave),
          clicks: Math.round(baseClk * wave),
        },
      });
    }
  }

  console.log("Seed OK — BEL Season 2", {
    champion: "UG_HUB",
    runnerUp: "SKYNET",
    events: ["bel-season-1", "bel-season-2", "bel-season-3"],
    teams: teamsData.length,
    players: playersData.length,
    news: newsArticles.length,
    demosChannel: "https://t.me/bel_cs2_demos",
    leagueHub: "https://www.belcs2.by/#overview",
    accounts: {
      admin: "admin@byhltv.local / Admin123!",
      editor: "editor@byhltv.local / Editor123!",
    },
    album: album.slug,
    fantasy: league.name,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
