export type MatchStatus = "upcoming" | "live" | "finished";
export type MapName =
  | "Mirage"
  | "Inferno"
  | "Nuke"
  | "Ancient"
  | "Anubis"
  | "Dust2"
  | "Vertigo";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  country: "BY" | "EU" | "INT";
  ranking: number;
  region: string;
}

export interface Player {
  id: string;
  nickname: string;
  realName: string;
  teamId: string | null;
  country: "BY" | "RU" | "UA" | "PL" | "EU";
  rating: number;
  mapsPlayed: number;
  kd: number;
  adr: number;
  impact: number;
  photo: string;
  role: "AWPer" | "Rifler" | "IGL" | "Support" | "Lurker";
}

export interface MapScore {
  map: MapName;
  team1Score: number;
  team2Score: number;
  winnerId?: string;
}

export interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  eventId: string;
  status: MatchStatus;
  format: "bo1" | "bo3" | "bo5";
  scheduledAt: string;
  team1Score: number;
  team2Score: number;
  maps: MapScore[];
  stars: 0 | 1 | 2 | 3 | 4 | 5;
  streamUrl?: string;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  prizePool: number;
  tier: "S" | "A" | "B" | "C";
  logo: string;
  teamsCount: number;
  status: "upcoming" | "ongoing" | "finished";
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: { be: string; ru: string; en: string };
  excerpt: { be: string; ru: string; en: string };
  content: { be: string; ru: string; en: string };
  coverImage: string;
  category: "news" | "interview" | "analysis" | "transfer";
  author: { be: string; ru: string; en: string };
  publishedAt: string;
  featured: boolean;
  tags: { be: string; ru: string; en: string }[];
}

export interface LiveTickerItem {
  id: string;
  text: string;
  type: "score" | "news" | "transfer" | "event";
}
