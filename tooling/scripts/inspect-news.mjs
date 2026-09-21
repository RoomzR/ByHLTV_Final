import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(root, "packages/database/package.json"));
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const articles = await p.newsArticle.findMany({ include: { translations: true } });
for (const a of articles) {
  console.log("---", a.slug);
  for (const t of a.translations) {
    console.log(t.locale, "|", t.title.slice(0, 60), "|", t.excerpt.slice(0, 50));
  }
}
await p.$disconnect();
