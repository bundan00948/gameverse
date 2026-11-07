# Design Tokens

Token reference for **GameVerse**. Use utility classes and CSS variables — never raw values.

## Colors

Apply with any color utility: `bg-<name>`, `text-<name>`, `border-<name>`, `ring-<name>`, `divide-<name>`, etc.

| Name | CSS variable |
|---|---|
| `stats-action` | `--stats-action` |
| `stats-action-foreground` | `--stats-action-foreground` |
| `background` | `--background` |
| `foreground` | `--foreground` |
| `card` | `--card` |
| `card-foreground` | `--card-foreground` |
| `popover` | `--popover` |
| `popover-foreground` | `--popover-foreground` |
| `primary` | `--primary` |
| `primary-foreground` | `--primary-foreground` |
| `secondary` | `--secondary` |
| `secondary-foreground` | `--secondary-foreground` |
| `muted` | `--muted` |
| `muted-foreground` | `--muted-foreground` |
| `accent` | `--accent` |
| `accent-foreground` | `--accent-foreground` |
| `destructive` | `--destructive` |
| `destructive-foreground` | `--destructive-foreground` |
| `border` | `--border` |
| `input` | `--input` |
| `ring` | `--ring` |
| `discord` | `--discord` |
| `discord-hover` | `--discord-hover` |
| `discord-foreground` | `--discord-foreground` |
| `pedestal` | `--pedestal` |
| `glass` | `--glass` |
| `glass-hover` | `--glass-hover` |
| `tile` | `--tile` |
| `tile-a` | `--tile-a` |
| `tile-b` | `--tile-b` |
| `tile-c` | `--tile-c` |
| `tile-d` | `--tile-d` |
| `tile-fg` | `--tile-fg` |
| `surface` | `--surface` |
| `surface-border` | `--surface-border` |
| `layout-edge` | `--layout-edge` |
| `layout-highlight` | `--layout-highlight` |
| `layout-header` | `--layout-header` |
| `overlay-background` | `--overlay-background` |
| `overlay-foreground` | `--overlay-foreground` |
| `layout-accent` | `--layout-accent` |
| `google-background` | `--google-background` |
| `google-border` | `--google-border` |
| `google-foreground` | `--google-foreground` |
| `market-start` | `--market-start` |
| `market-end` | `--market-end` |
| `market-frame` | `--market-frame` |
| `market-price` | `--market-price` |
| `market-coin` | `--market-coin` |
| `market-foreground` | `--market-foreground` |

## Typography

Typography classes (`font-*` for families, `text-*` for sizes):

| Class | CSS variable |
|---|---|
| `font-display` | `--font-display` |
| `font-nav` | `--font-nav` |
| `font-sans` | `--font-sans` |

## Spacing

Apply with any spacing utility: `p-<name>`, `m-<name>`, `gap-<name>`, `space-<name>`, `w-<name>`, `h-<name>`, etc.

| Name | CSS variable |
|---|---|
| — | `--pack-dialog-padding` |
| — | `--pack-dialog-gap` |

## Border Radius

Border-radius classes:

| Class | CSS variable |
|---|---|
| `rounded-sm` | `--radius-sm` |
| `rounded-md` | `--radius-md` |
| `rounded-xl` | `--radius-xl` |
| `rounded-2xl` | `--radius-2xl` |
| `rounded` | `--radius` |
| — | `--market-radius` |

## Shadows

Box-shadow classes:

| Class | CSS variable | Usage |
|---|---|---|
| `shadow-tile` | `--shadow-tile` | — |
| — | `--layout-shadow` | — |
| — | `--market-shadow` | Reach for this token on Market pack cards and purchase panels when you want the signature hard-edged drop shadow that gives shop elements their raised, game-like depth. |

## Other

Reference via `var(--name)` in inline styles or CSS.

| CSS variable |
|---|
| `--pedestal-arch` |
| `--tiles-image` |
| `--market-picture-size` |
| `--pack-dialog-width` |
| `--pack-preview-height` |
| `--pack-dialog-frame` |
| `--pack-step-size` |

