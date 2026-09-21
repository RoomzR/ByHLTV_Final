import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(root, "packages/database/package.json"));
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const m = await p.match.findUnique({ where: { slug: "m-fin-1" } });
  if (!m) {
    console.log("no match");
    return;
  }
  const count = await p.mapVeto.count({ where: { matchId: m.id } });
  if (count === 0) {
    await p.mapVeto.createMany({
      data: [
        { matchId: m.id, order: 1, action: "ban", mapName: "Nuke", teamId: m.team1Id },
        { matchId: m.id, order: 2, action: "ban", mapName: "Inferno", teamId: m.team2Id },
        { matchId: m.id, order: 3, action: "pick", mapName: "Dust2", teamId: m.team1Id },
        { matchId: m.id, order: 4, action: "pick", mapName: "Anubis", teamId: m.team2Id },
        { matchId: m.id, order: 5, action: "ban", mapName: "Cache", teamId: m.team1Id },
        { matchId: m.id, order: 6, action: "ban", mapName: "Ancient", teamId: m.team2Id },
        { matchId: m.id, order: 7, action: "leftover", mapName: "Mirage", teamId: null },
      ],
    });
    const maps = await p.matchMap.findMany({ where: { matchId: m.id } });
    if (!maps.some((x) => x.mapName === "Mirage")) {
      await p.matchMap.create({
        data: { matchId: m.id, mapName: "Mirage", order: 3, team1Score: 0, team2Score: 0 },
      });
    }
    console.log("vetos seeded");
  } else {
    console.log("vetos exist", count);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
