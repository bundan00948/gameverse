---
description: "Brand assets shipped by the GameVerse design system (logos, icons, illustrations, photography, fonts, videos) with exact import paths. Read before adding any logo, icon, illustration, image, video, or font to the app: use these real assets instead of placeholders, stock photos, or generated images."
---

# GameVerse — Assets

These files are copied into `src/design-system/{slug}/assets/` in this project — never generate, placeholder, or substitute an asset that exists here.

Raw files import directly, e.g. `import logo from "@/design-system/{slug}/assets/logos/logo.svg"`.
R2 pointer files (`.asset.json`) are imported as JSON — use the `url` property, e.g. `import hero from "@/design-system/{slug}/assets/hero.png.asset.json"` then `<img src={hero.url} />`.
The full machine-readable catalog lives in this library's `design-system.json` (`assets` array).

## Icons

- `@/design-system/{slug}/assets/icons/gameverse-token.webp.asset.json` (webp, R2 pointer)
- `@/design-system/{slug}/assets/icons/stats-messages.png.asset.json` (png, R2 pointer)
- `@/design-system/{slug}/assets/icons/stats-opened.png.asset.json` (png, R2 pointer)
- `@/design-system/{slug}/assets/icons/stats-tokens.png.asset.json` (png, R2 pointer)
- `@/design-system/{slug}/assets/icons/stats-unlocked.png.asset.json` (png, R2 pointer)

## Fonts

- `@/design-system/{slug}/assets/fonts/nunito-latin.woff2` (woff2)
- `@/design-system/{slug}/assets/fonts/quicksand-latin.woff2` (woff2)
- `@/design-system/{slug}/assets/fonts/titan-one-latin.woff2` (woff2)

