# ByHLTV — slide map (v2)

Widescreen deck: **info slides** (текст) + **full-page screenshots** (1920px wide).  
Screens: `presentation/screens/`. Open: `presentation/index.html`. PPTX: `presentation/ByHLTV-Presentation.pptx`.

Capture: `node presentation/scripts/capture-screens.mjs` (`fullPage: true`).  
Build PPTX: `node presentation/scripts/build-pptx.mjs`.

| # | Type | Slide | File / note | Role |
|---|------|-------|-------------|------|
| 1 | info | Title · ByHLTV | — | — |
| 2 | info | Что это | — | — |
| 3 | screen | Главная | `10-home.png` | public |
| 4 | info | Публичный сайт | — | — |
| 5 | screen | Матчи | `11-matches.png` | public |
| 6 | screen | Карточка матча | `12-match-detail.png` | public |
| 7 | screen | Результаты | `13-results.png` | public |
| 8 | screen | Live | `14-live.png` | public |
| 9 | screen | Турниры | `15-events.png` | public |
| 10 | screen | BEL Season 2 | `16-event-detail.png` | public |
| 11 | screen | Новости | `17-news.png` | public |
| 12 | screen | Статья | `18-article.png` | public |
| 13 | screen | Рейтинг | `19-ranking.png` | public |
| 14 | screen | Игроки | `20-players.png` | public |
| 15 | screen | Профиль игрока | `21-player-profile.png` | public |
| 16 | screen | Команды | `22-teams.png` | public |
| 17 | screen | Команда | `23-team.png` | public |
| 18 | screen | Статистика | `24-stats.png` | public |
| 19 | screen | Top-20 | `25-top20.png` | public |
| 20 | screen | MVP | `26-mvp.png` | public |
| 21 | screen | Галерея | `27-gallery.png` | public |
| 22 | screen | Форумы | `28-forums.png` | public |
| 23 | screen | Fantasy | `29-fantasy.png` | public |
| 24 | screen | Betting | `30-betting.png` | public |
| 25 | screen | Вход | `31-login.png` | public |
| 26 | info | Роль USER | — | USER |
| 27 | screen | Профиль | `40-user-profile.png` | USER |
| 28 | screen | Главная (auth) | `41-user-home.png` | USER |
| 29 | info | Editor CMS | — | EDITOR |
| 30 | screen | Новости CMS | `50-editor-news.png` | EDITOR |
| 31 | screen | Игроки CMS | `51-editor-players.png` | EDITOR |
| 32 | screen | Матчи CMS | `52-editor-matches.png` | EDITOR |
| 33 | screen | Награды | `53-editor-awards.png` | EDITOR |
| 34 | screen | Галерея CMS | `54-editor-gallery.png` | EDITOR |
| 35 | screen | Ops | `55-editor-ops.png` | EDITOR |
| 36 | info | Модерация | — | MOD |
| 37 | screen | /mod | `60-mod.png` | MOD |
| 38 | info | Tournament Admin | — | TO |
| 39 | screen | Ops TO | `70-to-ops.png` | TO |
| 40 | screen | Live console | `71-to-live.png` | TO |
| 41 | info | Admin / Superadmin | — | ADMIN |
| 42 | screen | Admin CMS | `80-admin.png` | ADMIN |
| 43 | screen | Пользователи | `81-admin-users.png` | ADMIN |
| 44 | screen | Реклама | `82-admin-ads.png` | ADMIN |
| 45 | screen | Ads analytics | `83-admin-ads-analytics.png` | ADMIN |
| 46 | screen | Заявки TO | `84-admin-applications.png` | ADMIN |
| 47 | screen | Команды CMS | `85-admin-teams.png` | ADMIN |
| 48 | screen | Рейтинг CMS | `86-admin-ranking.png` | ADMIN |
| 49 | info | Стек + CTA | — | — |
| 50 | collage | Home + live ops | `10-home` + `71-to-live` | — |

## Notes
- Screenshots are **full page** (height can exceed 1080; e.g. players ~5106px, event ~4231px).
- Short pages that fit the viewport stay 1920×1080 — that is correct, not a crop.
- EDITOR: no `admin.panel` — use `/admin/news` etc., not `/admin` root.
- Brand: bg `#121212`, accent `#8BB41A`, live `#C41E3A`.
