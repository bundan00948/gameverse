# GameVerse — Guidelines

## Components

The design system exports these components — import them from `@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf` and compose them before building anything from scratch:

`AuthForm`, `BadgeList`, `BadgesPanel`, `BannerCard`, `BannerPicker`, `BannersPanel`, `BlookArt`, `BlooksPanel`, `Button`, `Constants`, `DashboardShell`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`, `Dialog`, `DiscordIcon`, `EditorSection`, `Empty`, `ImagePicker`, `MarketBanners`, `PackOpener`, `PageError`, `PageTitle`, `PasswordForm`, `PlanetLogo`, `PlayerAvatar`, `PlayerName`, `ResultPreview`, `RolesPanel`, `SessionContext`, `SessionProvider`, `SiteHeader`, `ThemeToggle`

Per-component details (import stanzas, props, variants, examples) live in `.lovable/rules/libraries/{slug}/components.md` — on disk, not auto-loaded. Read that file or the component source when the name alone isn't enough.

## Stack Dependencies

The design system's components require these packages to work correctly. A consumer project must have them installed with compatible versions.

| Package | Version |
|---|---|
| @radix-ui/react-dialog | ^1.1.15 |
| @radix-ui/react-slot | ^1.2.4 |
| @supabase/supabase-js | ^2.119.0 |
| @tanstack/react-query | ^5.101.1 |
| @tanstack/react-router | 1.170.41 |
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| lucide-react | ^0.575.0 |
| react | ^19.2.0 |
| react-dom | ^19.2.0 |
| tailwind-merge | ^3.5.0 |

## Theme Files

The design system's theme is delivered through the following files. The author's original source files carry the full wiring the design system needs — variable declarations, framework-specific directives, provider objects, etc. — and are the canonical import target.

- `@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf/styles.css` (source — preferred import)
- `@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf/dist/tokens.css` (auto-generated flat list of CSS custom properties — a raw-values fallback only; does NOT carry framework-specific wiring that the source files above provide)

