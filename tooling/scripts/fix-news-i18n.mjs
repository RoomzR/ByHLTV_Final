import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(root, "packages/database/package.json"));
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const FIX = {
  "nemiga-minsk-cup-final": {
    be: {
      title: "Nemiga выходзіць у фінал Minsk Cup Summer",
      excerpt: "Беларускі флагман перамог Vitebsk Five 2:0 і забраў пуцёўку ў фінал.",
      content:
        "Nemiga Gaming упэўнена прайшла паўфінал Minsk Cup Summer, перамогшы Vitebsk Five з лікам 2:0. Каманда выходзіць у фінал турніру.",
    },
    ru: {
      title: "Nemiga выходит в финал Minsk Cup Summer",
      excerpt: "Белорусский флагман обыграл Vitebsk Five 2:0 и взял путёвку в финал.",
      content:
        "Nemiga Gaming уверенно прошла полуфинал Minsk Cup Summer, обыграв Vitebsk Five со счётом 2:0. Команда выходит в финал турнира.",
    },
    en: {
      title: "Nemiga advances to Minsk Cup Summer final",
      excerpt: "The Belarusian flagship beat Vitebsk Five 2-0 to reach the final.",
      content:
        "Nemiga Gaming confidently cleared the Minsk Cup Summer semifinal, beating Vitebsk Five 2-0 to reach the final.",
    },
  },
  "frostyby-transfer-rumors": {
    be: {
      title: "frostyBY можа перайсці ў Nemiga",
      excerpt: "Перамовы пацверджаны крыніцамі ByHLTV.",
      content: "Minsk Force і Nemiga абмяркоўваюць трансфер frostyBY. Крыніцы ByHLTV пацвярджаюць перамовы.",
    },
    ru: {
      title: "frostyBY может перейти в Nemiga",
      excerpt: "Переговоры подтверждены источниками ByHLTV.",
      content: "Minsk Force и Nemiga обсуждают трансфер frostyBY. Источники ByHLTV подтверждают переговоры.",
    },
    en: {
      title: "frostyBY linked with Nemiga move",
      excerpt: "Talks confirmed by ByHLTV sources.",
      content: "Minsk Force and Nemiga are discussing a frostyBY transfer. ByHLTV sources confirm the talks.",
    },
  },
};

for (const [slug, locales] of Object.entries(FIX)) {
  const article = await p.newsArticle.findUnique({ where: { slug } });
  if (!article) {
    console.log("skip missing", slug);
    continue;
  }
  for (const [locale, text] of Object.entries(locales)) {
    await p.newsTranslation.upsert({
      where: { articleId_locale: { articleId: article.id, locale } },
      create: { articleId: article.id, locale, ...text },
      update: text,
    });
  }
  console.log("fixed", slug);
}

await p.$disconnect();
