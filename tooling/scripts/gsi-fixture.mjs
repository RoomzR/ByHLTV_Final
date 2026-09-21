/**
 * POST a mock CS2 GSI payload to the live match token.
 * Usage: node tooling/scripts/gsi-fixture.mjs [token]
 * Default token: demo-gsi-token-mlive1 (from seed)
 */
const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const token = process.argv[2] ?? "demo-gsi-token-mlive1";

const payload = {
  map: {
    name: "de_nuke",
    phase: "live",
    round: 19,
    team_ct: { score: 10, name: "Nemiga" },
    team_t: { score: 9, name: "MTW" },
  },
  round: { phase: "live", bomb: "" },
  phase_countdowns: { phase: "live", phase_ends_in: "64.2" },
  allplayers: {
    "1": {
      steamid: "76561198000000001",
      name: "lolli",
      team: "CT",
      match_stats: { kills: 19, assists: 3, deaths: 12 },
      state: { health: 100, money: 4500 },
    },
    "2": {
      steamid: "76561198000000002",
      name: "mds",
      team: "CT",
      match_stats: { kills: 12, assists: 6, deaths: 13 },
      state: { health: 78, money: 3200 },
    },
    "3": {
      steamid: "76561198000000004",
      name: "xan1",
      team: "T",
      match_stats: { kills: 16, assists: 2, deaths: 14 },
      state: { health: 100, money: 5100 },
    },
  },
};

const res = await fetch(`${API}/gsi/${token}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
const text = await res.text();
console.log(res.status, text);
if (!res.ok) process.exit(1);
console.log("GSI fixture OK");
