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
- Signed-in pages live under the client-only `_authenticated` gate; public login remains `/login` with `/auth` redirect compatibility, because browser sessions cannot be read during SSR.
- Auth identity is subscribed once in the root and shared through SessionContext; profile reads and writes use the browser Cloud client with owner-only RLS.
- Dashboard destinations disable preloading and use automatic route code splitting so only the opened page fetches its content.
- Store Market appearance on pack rows and rarity colors in the admin-protected market_settings table; validate saved colors before using them as CSS variables.
- Quantity purchases use one authenticated atomic database function with a wallet row lock; purchased results are revealed sequentially without additional charges.
- Pack opening stays in one portal dialog with explicit viewport positioning and no inherited translate/zoom; block accidental dismissal until purchased pulls are revealed.
- Blooks use nullable pack assignments with ON DELETE SET NULL; query the full catalog for admin and inventory so unassigned blooks and owned copies remain visible.
- Admin sections use validated tab search state and mount only the selected panel; the legacy Blooks URL redirects to its integrated admin tab.
- Games use admin-uploaded icons and validated HTTPS embed URLs; mount a sandboxed iframe only for the selected game and record play history separately.
- Staff permissions come from admin-defined roles (staff_roles) checked by has_permission in RLS and server functions; the app_role 'admin' remains the full-access super role.
