import type { NewsArticle } from "@/types";

export const news: NewsArticle[] = [
  {
    id: "n1",
    slug: "nemiga-minsk-cup-final",
    title: {
      be: "Nemiga выходзіць у фінал Minsk Cup Summer",
      ru: "Nemiga выходит в финал Minsk Cup Summer",
      en: "Nemiga advances to the Minsk Cup Summer final",
    },
    excerpt: {
      be: "Беларускі флагман перамог Vitebsk Five 2:0 і забраў пуцёўку ў фінал хатняга турніру.",
      ru: "Белорусский флагман обыграл Vitebsk Five 2:0 и взял путёвку в финал домашнего турнира.",
      en: "The Belarusian flagship beat Vitebsk Five 2-0 and booked a spot in the home tournament final.",
    },
    content: {
      be: "Nemiga Gaming упэўнена прайшла паўфінал Minsk Cup Summer. На Dust2 і Anubis каманда не дала суперніку шансу — асабліва вылучыўся lolli з рэйтынгам 1.45.\n\nФінал супраць MTW Esports запланаваны на нядзелю. Гэта будзе пятае дэрбі года паміж двума топ-камандамі Беларусі.",
      ru: "Nemiga Gaming уверенно прошла полуфинал Minsk Cup Summer. На Dust2 и Anubis команда не дала сопернику шанса — особенно выделился lolli с рейтингом 1.45.\n\nФинал против MTW Esports запланирован на воскресенье. Это будет пятое дерби года между двумя топ-командами Беларуси.",
      en: "Nemiga Gaming confidently cleared the Minsk Cup Summer semi-final. On Dust2 and Anubis they left Vitebsk Five no chance — lolli stood out with a 1.45 rating.\n\nThe final vs MTW Esports is set for Sunday. It will be the fifth derby of the year between Belarus' two top sides.",
    },
    coverImage: "/news/nemiga-final.jpg",
    category: "news",
    author: {
      be: "Кацярына Літвін",
      ru: "Екатерина Литвин",
      en: "Katsiaryna Litvin",
    },
    publishedAt: "2026-07-29T11:00:00+03:00",
    featured: true,
    tags: [
      { be: "Nemiga", ru: "Nemiga", en: "Nemiga" },
      { be: "Minsk Cup", ru: "Minsk Cup", en: "Minsk Cup" },
      { be: "CS2", ru: "CS2", en: "CS2" },
    ],
  },
  {
    id: "n2",
    slug: "frostyby-transfer-rumors",
    title: {
      be: "frostyBY можа перайсці ў Nemiga — што вядома",
      ru: "frostyBY может перейти в Nemiga — что известно",
      en: "frostyBY linked with Nemiga — what we know",
    },
    excerpt: {
      be: "Крыніцы ByHLTV пацвярджаюць перамовы паміж AWP-шчыком Minsk Force і чэмпіёнамі рэгіёна.",
      ru: "Источники ByHLTV подтверждают переговоры между AWP Minsk Force и чемпионами региона.",
      en: "ByHLTV sources confirm talks between Minsk Force's AWPer and the regional champions.",
    },
    content: {
      be: "Паводле інфармацыі ByHLTV, Minsk Force і Nemiga абмяркоўваюць трансфер frostyBY. Гулец паказвае рэйтынг 1.21 у апошніх 3 месяцах і з'яўляецца адным з самых гарачых талентаў сцэны.\n\nАфіцыйнага каментара каманды пакуль не далі.",
      ru: "По информации ByHLTV, Minsk Force и Nemiga обсуждают трансфер frostyBY. Игрок показывает рейтинг 1.21 за последние 3 месяца и входит в число самых горячих талантов сцены.\n\nОфициального комментария команды пока нет.",
      en: "According to ByHLTV, Minsk Force and Nemiga are discussing a frostyBY move. He holds a 1.21 rating over the last 3 months and ranks among the scene's hottest talents.\n\nNeither side has commented officially yet.",
    },
    coverImage: "/news/transfer.jpg",
    category: "transfer",
    author: {
      be: "Андрэй Мельнік",
      ru: "Андрей Мельник",
      en: "Andrei Melnik",
    },
    publishedAt: "2026-07-29T05:00:00+03:00",
    featured: true,
    tags: [
      { be: "Трансфер", ru: "Трансфер", en: "Transfer" },
      { be: "frostyBY", ru: "frostyBY", en: "frostyBY" },
      { be: "Nemiga", ru: "Nemiga", en: "Nemiga" },
    ],
  },
  {
    id: "n3",
    slug: "belarus-open-2026-announced",
    title: {
      be: "Belarus Open 2026: $50,000 і 16 каманд у Мінску",
      ru: "Belarus Open 2026: $50,000 и 16 команд в Минске",
      en: "Belarus Open 2026: $50,000 and 16 teams in Minsk",
    },
    excerpt: {
      be: "Найбуйнейшы LAN-турнір краіны вернецца ў жніўні з рэкордным прызавым фондам.",
      ru: "Крупнейший LAN-турнир страны вернётся в августе с рекордным призовым фондом.",
      en: "The country's biggest LAN returns in August with a record prize pool.",
    },
    content: {
      be: "Арганізатары абвясцілі даты Belarus Open 2026 — з 12 па 18 жніўня ў Мінску. Удзельнічаюць 16 каманд, прызавы фонд — $50,000.\n\nКваліфікацыі стартуюць у ліпені. ByHLTV будзе вядучым медыя-партнёрам турніру.",
      ru: "Организаторы объявили даты Belarus Open 2026 — с 12 по 18 августа в Минске. Участвуют 16 команд, призовой фонд — $50,000.\n\nКвалификации стартуют в июле. ByHLTV станет главным медиа-партнёром турнира.",
      en: "Organizers announced Belarus Open 2026 dates — August 12–18 in Minsk. Sixteen teams will compete for a $50,000 prize pool.\n\nQualifiers begin in July. ByHLTV will be the tournament's lead media partner.",
    },
    coverImage: "/news/by-open.jpg",
    category: "news",
    author: {
      be: "Рэдакцыя ByHLTV",
      ru: "Редакция ByHLTV",
      en: "ByHLTV Editorial",
    },
    publishedAt: "2026-07-28T11:00:00+03:00",
    featured: false,
    tags: [
      { be: "Belarus Open", ru: "Belarus Open", en: "Belarus Open" },
      { be: "LAN", ru: "LAN", en: "LAN" },
      { be: "Мінск", ru: "Минск", en: "Minsk" },
    ],
  },
  {
    id: "n4",
    slug: "ranking-july-update",
    title: {
      be: "Рэйтынг ByHLTV: Nemiga трымае #1, MTW наступае",
      ru: "Рейтинг ByHLTV: Nemiga держит #1, MTW наступает",
      en: "ByHLTV ranking: Nemiga holds #1 as MTW closes in",
    },
    excerpt: {
      be: "Абноўлены нацыянальны рэйтынг каманд за ліпень — аналіз формаў і трэндаў.",
      ru: "Обновлён национальный рейтинг команд за июль — анализ форм и трендов.",
      en: "Updated national team ranking for July — form and trend analysis.",
    },
    content: {
      be: "Nemiga захоўвае першае месца, але MTW скараціла адставанне пасля серыі з 6 перамог. Minsk Force паднялася на 3-ю пазіцыю.\n\nПоўная табліца даступная ў раздзеле «Каманды».",
      ru: "Nemiga сохраняет первое место, но MTW сократила отставание после серии из 6 побед. Minsk Force поднялась на 3-ю позицию.\n\nПолная таблица доступна в разделе «Команды».",
      en: "Nemiga keeps first place, but MTW cut the gap after a six-win run. Minsk Force climbed to 3rd.\n\nThe full table is available in the Teams section.",
    },
    coverImage: "/news/ranking.jpg",
    category: "analysis",
    author: {
      be: "Ігар Саўчанка",
      ru: "Игорь Савченко",
      en: "Ihar Sauchanka",
    },
    publishedAt: "2026-07-27T13:00:00+03:00",
    featured: false,
    tags: [
      { be: "Рэйтынг", ru: "Рейтинг", en: "Ranking" },
      { be: "Аналіз", ru: "Анализ", en: "Analysis" },
    ],
  },
  {
    id: "n5",
    slug: "interview-mds-igl",
    title: {
      be: "Інтэрв'ю з mds: «Мы будзем біцца за кожны раунд»",
      ru: "Интервью с mds: «Мы будем биться за каждый раунд»",
      en: "mds interview: “We’ll fight for every round”",
    },
    excerpt: {
      be: "IGL Nemiga пра фінал Minsk Cup, ростер і мэты на Belarus Open.",
      ru: "IGL Nemiga о финале Minsk Cup, ростере и целях на Belarus Open.",
      en: "Nemiga's IGL on the Minsk Cup final, the roster and Belarus Open goals.",
    },
    content: {
      be: "«Фінал супраць MTW — гэта заўсёды вайна. Мы падрыхтаваліся, разобралі іх дэфолты. Хочам закрыць летні сезон чэмпіёнствам і ісці на Belarus Open у максімальнай форме.»",
      ru: "«Финал против MTW — это всегда война. Мы подготовились, разобрали их дефолты. Хотим закрыть летний сезон чемпионством и идти на Belarus Open в максимальной форме.»",
      en: "“A final against MTW is always a war. We’re prepared, we’ve broken down their defaults. We want to close the summer with a title and arrive at Belarus Open in peak form.”",
    },
    coverImage: "/news/interview.jpg",
    category: "interview",
    author: {
      be: "Кацярына Літвін",
      ru: "Екатерина Литвин",
      en: "Katsiaryna Litvin",
    },
    publishedAt: "2026-07-26T13:00:00+03:00",
    featured: false,
    tags: [
      { be: "Інтэрв'ю", ru: "Интервью", en: "Interview" },
      { be: "mds", ru: "mds", en: "mds" },
      { be: "Nemiga", ru: "Nemiga", en: "Nemiga" },
    ],
  },
];
