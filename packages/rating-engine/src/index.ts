/**
 * ByHLTV rating approximations (NOT official HLTV formulas).
 *
 * Rating 2.1-approx uses publicly documented components + a known
 * community regression against HLTV Rating 2.0-era outputs.
 * Rating 3.0-lite adds a simplified Round Swing heuristic.
 */

export type RoundContribution = {
  kill: boolean;
  assist: boolean;
  survived: boolean;
  traded: boolean;
  wonRound: boolean;
  openingKill?: boolean;
  multiKills?: number;
  damage?: number;
  flashAssist?: boolean;
};

export type MatchPlayerInput = {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  roundsPlayed: number;
  /** Rounds with K/A/survive(won)/traded */
  kastRounds: number;
  openingKills?: number;
  multiKillScore?: number;
  headshots?: number;
  flashAssists?: number;
  /** Sum of approximate round swing values (-1..1 scale per kill credit) */
  roundSwingSum?: number;
};

export type RatingResult = {
  kpr: number;
  dpr: number;
  adr: number;
  kast: number;
  impact: number;
  rating21: number;
  rating30: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function computeKastPercent(kastRounds: number, roundsPlayed: number): number {
  if (roundsPlayed <= 0) return 0;
  return (kastRounds / roundsPlayed) * 100;
}

/**
 * Impact approx from multi-kills / openers (Rating 2.x style stand-in).
 * Community-style: ~2.13*KPR + 0.42*APR - 0.41
 */
export function computeImpactApprox(input: MatchPlayerInput): number {
  const rounds = Math.max(1, input.roundsPlayed);
  const kpr = input.kills / rounds;
  const apr = input.assists / rounds;
  const openerBonus = (input.openingKills ?? 0) * 0.05;
  const multiBonus = (input.multiKillScore ?? 0) * 0.02;
  return clamp(2.13 * kpr + 0.42 * apr - 0.41 + openerBonus + multiBonus, 0.2, 2.5);
}

/**
 * Rating 2.1-approx via documented regression-style weights:
 * 0.0073*KAST + 0.3591*KPR - 0.5329*DPR + 0.2372*Impact + 0.0032*ADR + 0.1587
 */
export function computeRating21(input: MatchPlayerInput): RatingResult {
  const rounds = Math.max(1, input.roundsPlayed);
  const kpr = input.kills / rounds;
  const dpr = input.deaths / rounds;
  const adr = input.damage / rounds;
  const kast = computeKastPercent(input.kastRounds, input.roundsPlayed);
  const impact = computeImpactApprox(input);

  const rating21 = clamp(
    0.0073 * kast + 0.3591 * kpr - 0.5329 * dpr + 0.2372 * impact + 0.0032 * adr + 0.1587,
    0.2,
    2.8,
  );

  const swingAvg =
    input.roundsPlayed > 0 ? (input.roundSwingSum ?? 0) / input.roundsPlayed : 0;
  // 3.0-lite: blend 2.1 with swing (eco/alive heuristic later filled by GSI)
  const rating30 = clamp(rating21 * 0.85 + (1 + swingAvg) * 0.15, 0.2, 2.8);

  return { kpr, dpr, adr, kast, impact, rating21, rating30 };
}

export function computeFromBasicStats(params: {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  roundsPlayed: number;
  kast?: number;
  openingKills?: number;
}): RatingResult {
  const rounds = Math.max(1, params.roundsPlayed);
  const kastPct = params.kast ?? clamp(55 + params.kills * 1.2 - params.deaths * 0.8, 40, 95);
  const kastRounds = Math.round((kastPct / 100) * rounds);
  return computeRating21({
    kills: params.kills,
    deaths: params.deaths,
    assists: params.assists,
    damage: Math.round(params.adr * rounds),
    roundsPlayed: rounds,
    kastRounds,
    openingKills: params.openingKills ?? 0,
    multiKillScore: Math.max(0, params.kills - rounds),
    roundSwingSum: (params.kills - params.deaths) * 0.08,
  });
}

/** Aggregate career averages from match lines */
export function aggregateCareer(
  lines: Array<{
    kills: number;
    deaths: number;
    assists: number;
    adr: number;
    rating21: number;
    rating30: number;
    kast: number;
    impact: number;
    roundsPlayed: number;
  }>,
) {
  if (!lines.length) {
    return {
      rating: 1,
      rating21: 1,
      rating30: 1,
      kd: 1,
      adr: 70,
      kast: 70,
      impact: 1,
      mapsPlayed: 0,
    };
  }
  let kills = 0;
  let deaths = 0;
  let rounds = 0;
  let adrSum = 0;
  let r21 = 0;
  let r30 = 0;
  let kast = 0;
  let impact = 0;
  for (const l of lines) {
    kills += l.kills;
    deaths += l.deaths;
    const rp = Math.max(1, l.roundsPlayed);
    rounds += rp;
    adrSum += l.adr * rp;
    r21 += l.rating21;
    r30 += l.rating30;
    kast += l.kast;
    impact += l.impact;
  }
  const n = lines.length;
  return {
    rating: r30 / n,
    rating21: r21 / n,
    rating30: r30 / n,
    kd: deaths === 0 ? kills : kills / deaths,
    adr: adrSum / Math.max(1, rounds),
    kast: kast / n,
    impact: impact / n,
    mapsPlayed: n,
  };
}

/**
 * Simplified Round Swing: Δ win-prob heuristic from alive counts / bomb / side.
 * Returns value roughly in [-0.35, 0.45] per kill credit.
 */
export function estimateRoundSwing(params: {
  killersAliveBefore: number;
  victimsAliveBefore: number;
  bombPlanted: boolean;
  killerSide: "CT" | "T";
}): number {
  const { killersAliveBefore, victimsAliveBefore, bombPlanted, killerSide } = params;
  const manAdvantage = killersAliveBefore - victimsAliveBefore;
  let base = 0.12 + Math.max(0, 5 - victimsAliveBefore) * 0.04 - Math.max(0, manAdvantage) * 0.02;
  if (bombPlanted && killerSide === "T") base *= 0.85;
  if (bombPlanted && killerSide === "CT") base *= 1.15;
  if (victimsAliveBefore === 1) base += 0.08;
  return clamp(base, -0.35, 0.45);
}
