export type LivePlayerSnapshot = {
  steamId: string;
  name: string;
  team: "CT" | "T" | string;
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
};

export type LiveMatchSnapshot = {
  matchId: string;
  slug: string;
  updatedAt: string;
  mapName: string;
  round: number;
  roundPhase: string;
  bombState: string | null;
  scoreCt: number;
  scoreT: number;
  team1Side: "CT" | "T";
  players: LivePlayerSnapshot[];
};

/** Process-local live GSI snapshots (lost on restart; DB remains source of truth). */
export class GsiLiveStore {
  private snapshots = new Map<string, LiveMatchSnapshot>();
  private blockedUntil = new Map<string, number>();

  set(matchId: string, snap: LiveMatchSnapshot) {
    this.snapshots.set(matchId, snap);
  }

  get(matchId: string): LiveMatchSnapshot | undefined {
    return this.snapshots.get(matchId);
  }

  clear(matchId: string) {
    this.snapshots.delete(matchId);
  }

  block(matchId: string, minutes = 5) {
    this.blockedUntil.set(matchId, Date.now() + minutes * 60_000);
    this.snapshots.delete(matchId);
  }

  resume(matchId: string) {
    this.blockedUntil.delete(matchId);
  }

  isBlocked(matchId: string): boolean {
    const until = this.blockedUntil.get(matchId);
    if (!until) return false;
    if (Date.now() >= until) {
      this.blockedUntil.delete(matchId);
      return false;
    }
    return true;
  }
}

export const gsiLiveStore = new GsiLiveStore();
