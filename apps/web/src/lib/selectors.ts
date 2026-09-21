import type { Match, NewsArticle, Player, Team } from "@/types";

export function sortPlayersByRating(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.rating - a.rating);
}

export function sortTeamsByRanking(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => a.ranking - b.ranking);
}

export function filterMatchesByStatus(
  matches: Match[],
  status: Match["status"],
): Match[] {
  return matches.filter((m) => m.status === status);
}

export function sortNewsByDate(articles: NewsArticle[]): NewsArticle[] {
  return [...articles].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
