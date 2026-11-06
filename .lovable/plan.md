# Remove game cards, black-and-white bigger planet

## Changes
1. **Take out the game cards.** Remove the six cards (Arcade, Ranked, Battle, Puzzle, Space, Party) from the homepage. The title, tagline, and Register / Discord buttons stay on the left side of the screen.
2. **Black-and-white planet.** Switch the logo to the black-and-white (outline) version of the Noto ringed-planet emoji. It follows the color mode: white in Dark mode and dark navy in Bright mode. This applies to the top menu logo, the planet next to the big title, and the browser tab icon.
3. **Bigger planet.** Make the planet next to the main "GameVerse" title much larger, about 1.5x the height of the letters. Make the one in the top menu slightly larger too.

## Technical details
- Delete the tile data, the cluster markup, and the unused icon imports in `src/routes/index.tsx`, and make the hero a single column.
- Get the monochrome glyph from Google's open-source Noto Emoji set (Noto Emoji font, U+1FA90) as an SVG path. Draw it inline with `fill="currentColor"` so it picks up the theme's text color, and put it in a small `PlanetLogo` component.
- For the favicon, use a black-and-white SVG of the same shape.
- Re-check desktop and phone widths in both color modes for overflow.
