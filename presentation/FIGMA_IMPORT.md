# Figma Slides — ByHLTV v2 (full-page)

## Готовые артефакты
- PPTX: `presentation/ByHLTV-Presentation-v2.pptx` (+ копия `ByHLTV-Presentation-FULLPAGE.pptx`)
- HTML-дек: `presentation/index.html`
- Карта слайдов: `presentation/slide_map.md`
- Full-page PNG: `presentation/screens/*.png` (40 шт., `fullPage: true`)
- 16:9 для Figma: `presentation/screens/figma-fit/*.png`
- Архив: `presentation/byhltv-screens-fullpage.zip`

## Figma
- **v2 (новый файл):** https://www.figma.com/slides/e2wvA5sSnOaz8MHwYT9Ghf/ByHLTV-—-Презентация-v2  
  Имя: **ByHLTV — Презентация v2**. Автозаливка PNG через браузерный агент ограничена (нет доступа к file picker / clipboard Electron).  
  Залейте вручную: перетащите `presentation/screens/figma-fit/*.png` **по порядку имён** на слайды (или Place image).
- **v1 (старый, viewport):** https://www.figma.com/slides/qXDi2F7JiUbDF018asvQgS/ByHLTV-—-Презентация

## Команды
```bash
node presentation/scripts/capture-screens.mjs
node presentation/scripts/fit-for-figma.mjs
node presentation/scripts/build-pptx.mjs
```

Не коммитьте пароли/токены.
