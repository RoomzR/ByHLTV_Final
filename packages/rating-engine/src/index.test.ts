import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeFromBasicStats, computeRating21, estimateRoundSwing } from "./index.js";

describe("rating-engine", () => {
  it("computes rating21 around 1.0 for average line", () => {
    const r = computeFromBasicStats({
      kills: 16,
      deaths: 16,
      assists: 4,
      adr: 75,
      roundsPlayed: 24,
      kast: 70,
    });
    assert.ok(r.rating21 > 0.7 && r.rating21 < 1.4, `got ${r.rating21}`);
    assert.ok(r.rating30 > 0.7 && r.rating30 < 1.5);
  });

  it("rewards high impact fraggers", () => {
    const low = computeRating21({
      kills: 10,
      deaths: 20,
      assists: 2,
      damage: 1400,
      roundsPlayed: 24,
      kastRounds: 12,
    });
    const high = computeRating21({
      kills: 28,
      deaths: 12,
      assists: 5,
      damage: 2400,
      roundsPlayed: 24,
      kastRounds: 20,
      openingKills: 6,
      multiKillScore: 8,
      roundSwingSum: 2.5,
    });
    assert.ok(high.rating21 > low.rating21);
    assert.ok(high.rating30 > low.rating30);
  });

  it("estimates clutch swing higher", () => {
    const mid = estimateRoundSwing({
      killersAliveBefore: 3,
      victimsAliveBefore: 3,
      bombPlanted: false,
      killerSide: "CT",
    });
    const clutch = estimateRoundSwing({
      killersAliveBefore: 1,
      victimsAliveBefore: 1,
      bombPlanted: true,
      killerSide: "CT",
    });
    assert.ok(clutch > mid);
  });
});
