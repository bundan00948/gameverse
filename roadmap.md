# Roadmap

- [x] Fix mailbox viewport positioning and scrolling; verified signed-in desktop and 390/320px phones, message images, filters, close/reopen and Escape; publishing requested after checks

- [x] Add selectable 24/48/72-hour, 7-day and 30-day login links; preserve two-active limit
- [x] Add verified Owner access, precise permissions, protected IP/activity logs and password resets (never password viewing)
- [x] Confirm Owner IP visibility and require explicit Owner-granted permission for other staff
- [x] Address follow-up password viewing request: irreversible password storage is retained; authorized reset replaces viewing
- [x] Add live bans with immediate notice/logout and server/database enforcement
- [x] Verify permissions, link durations, activity readback and live ban flows; all 81 tests pass, retained banned tokens blocked and temporary accounts removed
- [ ] Verify production IP capture after publishing; local preview has no trusted edge IP header (historical IPs cannot be recovered)

- [x] Support gradient rarity colors and gently running role gradients; verify saving and readback with temporary colors restored
- [x] Sort pack blooks by ascending rarity then alphabetically, retaining alphabetical admin catalog
- [x] Lock desktop Market packs to five columns and reduce token artwork; verified desktop and phone without overflow

- [x] Add banner catalog, protected purchases and owned nameplate selection
- [x] Match reference banner cards below Market packs and add folded admin banner editors with previews
- [x] Verify banner creation, purchase, selection, unlisted ownership and phone layout; temporary test content removed

- [x] Fold unopened admin editors and add live customization previews; verified keyboard controls, retained drafts, role/blook previews and phone layout

- [x] Match November 8 Market card reference and verify saved top-to-bottom color blending, pack selection, and phone layout

- [x] Fix purchase-stage shaking and verify stationary pack before opening on desktop and phone
- [x] Refine peel/reveal animation and verify purchased reveals; exact Blooket match unverified because its Market requires login
- [x] Blend vertical pack colors into thin frames; move price into translucent bottom-right badge and remove fixed Market blue defaults while preserving admin-selected pack colors

- [x] Optimize initial-load assets and repeated auth requests; compare cold-load measurements (preview cold load ~0.85–0.88s; 0.5s target not reached).

- [x] Reduce navigation reloads and repeated shared-data requests; verify signed-in page switching.

- [x] Match purchase popup reference, unify currency pictures, and remove purchased-pack containers; verify purchase and reveal.

- [x] Add orange View Stats player search and other-player stats
- [x] Synchronize saved names, pictures, roles and badges across player displays
- [x] Verify selected-profile viewing and saved-name synchronization on desktop and phone
- [ ] Verify a distinct second player's profile (blocked: only one player currently exists)

- [x] Move signed-in theme selection into Settings and verify persistence
- [x] Refresh all page layouts with shared original GameVerse styling
- [x] Fix accessibility issues and verify signed-in desktop and phone flows

- [x] Fix pack-opening failure and layout shifting; verify an authenticated purchase and reveal
- [x] Add rarity-blended falling confetti and interactive opening gradients
- [x] Polish staff-panel layout and action buttons; verify desktop and phone

- [x] Add game icon uploads and admin embed links
- [x] Redesign Games and verify embedded play, history, and phone layout

- [x] Integrate icon-only Blooks into the Admin Panel and polish admin layouts
- [x] Verify admin sections and icon editing on desktop and mobile

- [x] Add alphabetical Blooks admin grid with editable pack assignments
- [x] Preserve blooks and owned inventory when a pack is deleted; verify the flow

- [x] Match the pack selection popup to the reference using GameVerse colors and verify quantity and drop-rate controls

- [x] Replace emoji artwork and redesign Market to match the supplied pack reference
- [x] Add admin picture, gradient, opening background, pattern, and rarity color controls
- [x] Verify saved appearance controls and authenticated purchase confirmation (full opening blocked: current player has 10 tokens)

- [x] Connect real signup, login, logout and password recovery
- [x] Add signed-in Games dashboard and editable player Profile pages with on-demand loading
- [x] Verify authenticated navigation and saved profiles

- [x] Use Noto Emoji ringed planet (color version) as the GameVerse logo + favicon
- [x] Remove "Free to play · In your browser" badge
- [x] Remove features section ("Everything in one universe" cards) and "Ready to play?" box
- [x] Revert background pattern to the original two-square style, scaled bigger
- [x] Tighten background spacing: ~2.3x more squares on screen
- [x] Make the Stats page, sidebar and other dashboard pages more compact so each fits the screen
- [x] Fix lag: make the drifting background GPU-composited and drop per-frame blur passes
- Roles (permissions, gradient chat colors) & Badges; chat replies with notifications [done]

- [x] Add Bazaar (fixed-price listings for all blooks, auctions for Legendary+), mail drawer and admin system mail
- [ ] Live buy/bid/auction-finish flow not yet tested with two real players
