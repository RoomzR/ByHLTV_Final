# ByHLTV — Role divider images

Branded 1920×1080 PNG slides for presentation section breaks (PPTX / Figma).

## Style

- Background: dark charcoal `#0b0b0b` / `#121212`
- Accent: acid green `#8BB41A`
- Live / elevated roles: red `#C41E3A` (moderator, superadmin)
- Typography: Space Grotesk + Sora (same as `presentation/index.html`)

## Files

| File | Role | Title / subtitle |
|------|------|------------------|
| `01-public.png` | PUBLIC / зритель | ПУБЛИЧНЫЙ САЙТ · Матчи · новости · рейтинги |
| `02-user.png` | USER | ПОЛЬЗОВАТЕЛЬ · Профиль · комментарии · fantasy |
| `03-editor.png` | EDITOR | РЕДАКТОР · Новости · игроки · CMS |
| `04-moderator.png` | MODERATOR | МОДЕРАТОР · Жалобы · форум · баны |
| `05-tournament-admin.png` | TOURNAMENT ADMIN | TOURNAMENT ADMIN · Ивенты · ops · live · демки |
| `06-admin.png` | ADMIN | ADMIN · Пользователи · ads · права |
| `07-superadmin.png` | SUPERADMIN | SUPERADMIN · Полный контроль платформы |
| `99-thanks.png` | END / Thanks | СПАСИБО ЗА ПРОСМОТР · ByHLTV · Беларускі Counter-Strike |

Копия финального слайда: `presentation/99-thanks-for-watching.png`

## Suggested use

Insert each PNG **before** the corresponding role block in the deck (title/divider slide), then place screenshots and talking points for that role.

Place `99-thanks.png` as the **last** slide (end / Q&A).

Source layout: `role-dividers.html`, `thanks-slide.html`  
Regenerate roles: `node presentation/scripts/capture-role-dividers.mjs`  
Regenerate thanks: `node presentation/scripts/capture-thanks.mjs`
