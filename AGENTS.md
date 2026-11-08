<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## App architecture
- The library barrel imports its canonical stylesheet so attached consumers receive theme tokens and base styles when importing the library.
- All signed-in pages share the unframed GameVerse shell and semantic main landmark; appearance is persisted locally through the shared theme utility and selected in Settings, keeping page data loaders independent.
- Signed-in pages live under the client-only `_authenticated` gate; public login remains `/login` with `/auth` redirect compatibility, because browser sessions cannot be read during SSR.
- Auth identity is subscribed once in the root and shared through SessionContext; profile reads and writes use the browser Cloud client with owner-only RLS.
- Initial loading uses self-hosted WOFF2 brand fonts, a resized WebP currency derivative, and typed per-icon imports in src/lib/icons.ts; browser query IDs and display identity come from the session while remote user validation remains in the authenticated gate and server/RLS authorization is unchanged. Load the pack-opening dialog only after pack selection.
- Dashboard destinations use client-side navigation with preloading disabled and automatic route code splitting, keeping shared Query cache alive while fetching only the opened page; balance mutations invalidate wallet/stats and shared wallet reads reuse the same query.
- Store Market appearance on pack rows and rarity colors/badge image mappings in admin-protected market_settings; derive validated gradient paint and solid endpoints separately so color-mix and celebration effects stay valid, and share badge reads between admin previews and inventory.
- Share rarity-first sorting across pack catalogs, drop rates and inventory; keep full admin catalogs alphabetical to preserve their independent browsing contract.
- Role text motion uses a stylesheet token disabled by reduced-motion preferences, so every shared identity display animates consistently without per-frame JavaScript.
- Quantity purchases use one authenticated atomic database function with a wallet row lock; purchased results are revealed sequentially without additional charges.
- Currency displays import the canonical token asset used by Stats so Market prices, purchases, rewards and wallet displays stay visually consistent.
- Pack opening stays in one portal dialog with explicit viewport positioning and state-specific centering with transitions disabled, preventing purchase-to-opening shifts; block accidental dismissal until purchased pulls are revealed.
- Blooks use nullable pack assignments with ON DELETE SET NULL; query the full catalog for admin and inventory so unassigned blooks and owned copies remain visible.
- Admin sections use validated tab search state and mount only the selected panel; the legacy Blooks URL redirects to its integrated admin tab.
- Admin item editors use accessible collapsible sections with draft-driven previews; collapsing preserves draft state and previews never perform writes or launch embedded games.
- Games use admin-uploaded icons and validated HTTPS embed URLs; mount a sandboxed iframe only for the selected game and record play history separately.
- Staff permissions come from admin-defined roles (staff_roles) checked by has_permission in RLS and server functions; the app_role 'admin' remains the full-access super role.
- Player displays use the shared profile-backed identity directory; invalidate shared identity caches after edits and refresh across tabs so names, roles, badges and pictures agree. Other-player stats use authenticated, narrowly projected database functions without opening private base-table policies.

- Banner ownership and sale status are independent; purchases run atomically with wallet locks, profile selection is ownership-validated by a database trigger, and shared identities project the selected background.
