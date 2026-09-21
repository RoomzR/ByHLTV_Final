export type LegalSection = { heading: string; paragraphs: string[] };

export type LegalDoc = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const legalRu = {
  privacy: {
    title: "Политика конфиденциальности",
    updated: "Обновлено: 30 июля 2026",
    intro:
      "ByHLTV уважает вашу конфиденциальность. Здесь коротко и по делу — какие данные мы обрабатываем и зачем.",
    sections: [
      {
        heading: "Какие данные собираем",
        paragraphs: [
          "При регистрации: email, имя пользователя, отображаемое имя и хеш пароля.",
          "При использовании сайта: данные профиля (био, аватар), избранное, комментарии, заявки и служебные логи безопасности.",
          "Технические данные: cookie сессии, IP и user-agent в пределах защиты от злоупотреблений.",
        ],
      },
      {
        heading: "Зачем это нужно",
        paragraphs: [
          "Чтобы вы могли входить в аккаунт, комментировать, сохранять избранное и пользоваться кабинетами по ролям.",
          "Чтобы обеспечивать безопасность, модерацию и стабильную работу сервиса.",
        ],
      },
      {
        heading: "Хранение и передача",
        paragraphs: [
          "Данные хранятся на серверах проекта и не продаются третьим лицам.",
          "Доступ к персональным данным имеют только уполномоченные сотрудники с соответствующими правами.",
        ],
      },
      {
        heading: "Ваши права",
        paragraphs: [
          "Вы можете изменить профиль в настройках аккаунта.",
          "По вопросам удаления или уточнения данных напишите разработчику: Telegram @roomzrly.",
        ],
      },
    ],
  } satisfies LegalDoc,
  terms: {
    title: "Пользовательское соглашение",
    updated: "Обновлено: 30 июля 2026",
    intro:
      "Используя ByHLTV, вы соглашаетесь с правилами сообщества и условиями ниже.",
    sections: [
      {
        heading: "О сервисе",
        paragraphs: [
          "ByHLTV — медиа о белорусском Counter-Strike: матчи, новости, рейтинги и community-инструменты.",
          "Контент может обновляться; мы стремимся к точности, но не гарантируем отсутствие ошибок в live-данных.",
        ],
      },
      {
        heading: "Аккаунт",
        paragraphs: [
          "Вы отвечаете за сохранность доступа к аккаунту и за действия, совершённые под ним.",
          "Запрещены мультиаккаунты для обхода банов, спам, оскорбления и публикация запрещённого контента.",
        ],
      },
      {
        heading: "Модерация",
        paragraphs: [
          "Комментарии и форум могут скрываться или удаляться модераторами.",
          "Нарушение правил может привести к временному или постоянному ограничению доступа.",
        ],
      },
      {
        heading: "Ответственность",
        paragraphs: [
          "Сервис предоставляется «как есть». Мы не несём ответственность за решения, принятые на основе публикуемых коэффициентов или прогнозов.",
        ],
      },
    ],
  } satisfies LegalDoc,
  cookies: {
    title: "Политика cookies",
    updated: "Обновлено: 30 июля 2026",
    intro:
      "Мы используем cookies, чтобы сайт работал стабильно и безопасно.",
    sections: [
      {
        heading: "Что такое cookies",
        paragraphs: [
          "Cookies — небольшие файлы, которые браузер сохраняет на устройстве. Они помогают узнавать сессию и настройки.",
        ],
      },
      {
        heading: "Какие cookies применяет ByHLTV",
        paragraphs: [
          "Обязательные: httpOnly cookies авторизации (доступ и обновление сессии).",
          "Функциональные: язык интерфейса и связанные пользовательские предпочтения.",
        ],
      },
      {
        heading: "Управление",
        paragraphs: [
          "Вы можете очистить cookies в настройках браузера. После этого потребуется повторный вход.",
          "Отключение обязательных cookies сделает авторизацию недоступной.",
        ],
      },
    ],
  } satisfies LegalDoc,
} as const;

export const legalBe = {
  privacy: {
    title: "Палітыка канфідэнцыяльнасці",
    updated: "Абноўлена: 30 ліпеня 2026",
    intro:
      "ByHLTV паважае вашу прыватнасць. Ніжэй коратка — якія даныя мы апрацоўваем і навошта.",
    sections: [
      {
        heading: "Якія даныя збіраем",
        paragraphs: [
          "Пры рэгістрацыі: email, імя карыстальніка, адлюстроўванае імя і хэш пароля.",
          "Пры карыстанні сайтам: профіль, абранае, каментарыі, заяўкі і службовыя логі бяспекі.",
          "Тэхнічныя даныя: cookie сесіі, IP і user-agent у межах абароны ад злоўжыванняў.",
        ],
      },
      {
        heading: "Навошта гэта патрэбна",
        paragraphs: [
          "Каб вы маглі ўваходзіць у акаўнт, каментаваць, захоўваць абранае і карыстацца кабінетамі па ролях.",
          "Каб забяспечваць бяспеку, мадэрацыю і стабільную працу сэрвісу.",
        ],
      },
      {
        heading: "Захаванне і перадача",
        paragraphs: [
          "Даныя захоўваюцца на серверах праекта і не прадаюцца трэцім асобам.",
          "Доступ да персанальных даных маюць толькі ўпаўнаважаныя супрацоўнікі.",
        ],
      },
      {
        heading: "Вашы правы",
        paragraphs: [
          "Вы можаце змяніць профіль у наладах акаўнта.",
          "Па пытаннях выдалення ці ўдакладнення даных пішыце распрацоўшчыку: Telegram @roomzrly.",
        ],
      },
    ],
  } satisfies LegalDoc,
  terms: {
    title: "Карыстальніцкае пагадненне",
    updated: "Абноўлена: 30 ліпеня 2026",
    intro: "Карыстаючыся ByHLTV, вы згаджаецеся з правіламі супольнасці і ўмовамі ніжэй.",
    sections: [
      {
        heading: "Пра сэрвіс",
        paragraphs: [
          "ByHLTV — медыя пра беларускі Counter-Strike: матчы, навіны, рэйтынгі і community-інструменты.",
          "Кантент можа абнаўляцца; мы імкнемся да дакладнасці, але не гарантуем адсутнасць памылак у live-даных.",
        ],
      },
      {
        heading: "Акаўнт",
        paragraphs: [
          "Вы адказваеце за захаванасць доступу да акаўнта і за дзеянні пад ім.",
          "Забаронены мультыакаўнты для абходу банаў, спам, абразі і публікацыя забароненага кантэнту.",
        ],
      },
      {
        heading: "Мадэрацыя",
        paragraphs: [
          "Каментарыі і форум могуць хавацца ці выдаляцца мадэратарамі.",
          "Парушэнне правілаў можа прывесці да часовага ці пастаяннага абмежавання доступу.",
        ],
      },
      {
        heading: "Адказнасць",
        paragraphs: [
          "Сэрвіс прадастаўляецца «як ёсць». Мы не нясём адказнасць за рашэнні на аснове каэфіцыентаў ці прагнозаў.",
        ],
      },
    ],
  } satisfies LegalDoc,
  cookies: {
    title: "Палітыка cookies",
    updated: "Абноўлена: 30 ліпеня 2026",
    intro: "Мы выкарыстоўваем cookies, каб сайт працаваў стабільна і бяспечна.",
    sections: [
      {
        heading: "Што такое cookies",
        paragraphs: [
          "Cookies — невялікія файлы, якія браўзер захоўвае на прыладзе. Яны дапамагаюць пазнаваць сесію і налады.",
        ],
      },
      {
        heading: "Якія cookies ўжывае ByHLTV",
        paragraphs: [
          "Абавязковыя: httpOnly cookies аўтарызацыі (доступ і абнаўленне сесіі).",
          "Функцыянальныя: мова інтэрфейсу і звязаныя карыстальніцкія перавагі.",
        ],
      },
      {
        heading: "Кіраванне",
        paragraphs: [
          "Вы можаце ачысціць cookies у наладах браўзера. Пасля гэтага спатрэбіцца паўторны ўваход.",
          "Адключэнне абавязковых cookies зробіць аўтарызацыю недаступнай.",
        ],
      },
    ],
  } satisfies LegalDoc,
} as const;

export const legalEn = {
  privacy: {
    title: "Privacy Policy",
    updated: "Updated: 30 July 2026",
    intro:
      "ByHLTV respects your privacy. Here is a clear overview of what we process and why.",
    sections: [
      {
        heading: "Data we collect",
        paragraphs: [
          "On registration: email, username, display name, and a password hash.",
          "While using the site: profile data, favorites, comments, applications, and security logs.",
          "Technical data: session cookies, IP and user-agent for abuse protection.",
        ],
      },
      {
        heading: "Why we need it",
        paragraphs: [
          "To let you sign in, comment, save favorites, and use role-based desks.",
          "To keep the product secure, moderated, and reliable.",
        ],
      },
      {
        heading: "Storage and sharing",
        paragraphs: [
          "Data stays on project servers and is not sold to third parties.",
          "Only authorized staff with the right capabilities can access personal data.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "You can edit your profile in account settings.",
          "For deletion or clarification requests, contact the developer on Telegram: @roomzrly.",
        ],
      },
    ],
  } satisfies LegalDoc,
  terms: {
    title: "Terms of Use",
    updated: "Updated: 30 July 2026",
    intro: "By using ByHLTV you agree to the community rules and terms below.",
    sections: [
      {
        heading: "About the service",
        paragraphs: [
          "ByHLTV covers Belarusian Counter-Strike: matches, news, rankings, and community tools.",
          "Content is updated continuously; we aim for accuracy but live data may contain errors.",
        ],
      },
      {
        heading: "Accounts",
        paragraphs: [
          "You are responsible for account security and activity under your login.",
          "Multi-accounting to evade bans, spam, harassment, and illegal content are prohibited.",
        ],
      },
      {
        heading: "Moderation",
        paragraphs: [
          "Comments and forum posts may be hidden or removed by moderators.",
          "Rule violations may lead to temporary or permanent access restrictions.",
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "The service is provided as is. We are not liable for decisions based on odds or predictions.",
        ],
      },
    ],
  } satisfies LegalDoc,
  cookies: {
    title: "Cookie Policy",
    updated: "Updated: 30 July 2026",
    intro: "We use cookies so ByHLTV stays stable and secure.",
    sections: [
      {
        heading: "What cookies are",
        paragraphs: [
          "Cookies are small files stored by your browser. They help keep sessions and preferences.",
        ],
      },
      {
        heading: "Cookies used by ByHLTV",
        paragraphs: [
          "Essential: httpOnly auth cookies for access and session refresh.",
          "Functional: interface language and related preferences.",
        ],
      },
      {
        heading: "Managing cookies",
        paragraphs: [
          "You can clear cookies in browser settings. You will need to sign in again afterward.",
          "Disabling essential cookies will break authentication.",
        ],
      },
    ],
  } satisfies LegalDoc,
} as const;

export function getLegal(locale: string) {
  if (locale === "en") return legalEn;
  if (locale === "be") return legalBe;
  return legalRu;
}
