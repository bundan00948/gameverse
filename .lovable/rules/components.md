# Components

Component catalog for **GameVerse**. Import all components from `@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf`.

### AuthForm

```ts
import { AuthForm } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

Use the GameVerse account form for login or registration with visible field labels.

**Examples:**

_Typical usage_
```tsx
<AuthForm register />
```

**Avoid:**

- Do not remove visible labels or expose credentials in error messages.

### BadgeList

```ts
import { BadgeList } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### BadgesPanel

```ts
import { BadgesPanel } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### BlookArt

```ts
import { BlookArt } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

**Props:**

| Prop | Type | Default |
|---|---|---|
| `src` | string | `—` |
| `alt` | string | `—` |

### BlooksPanel

```ts
import { BlooksPanel } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### Button

```ts
import { Button } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

Use for actions with consistent touch targets and keyboard focus.

**Props:**

| Prop | Type | Default |
|---|---|---|
| `variant` | default · destructive · outline · secondary · ghost · link | `default` |
| `size` | default · sm · lg · icon | `default` |
| `asChild` | boolean | `false` |

**Examples:**

_Typical usage_
```tsx
<Button onClick={saveProfile}>Save profile</Button>
```

**Avoid:**

- Do not omit accessible names on icon-only actions.

### Constants

```ts
import { Constants } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### DashboardShell

```ts
import { DashboardShell } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

Wrap each signed-in page in the shared navigation and single main landmark. Keep data fetching in the page loader.

**Examples:**

_Typical usage_
```tsx
<DashboardShell bare><PageTitle kicker="Your universe" title="Games" /></DashboardShell>
```

**Avoid:**

- Do not nest another main landmark or wrap whole page sections in cards.

### Dialog

```ts
import { Dialog } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### DialogClose

```ts
import { DialogClose } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### DialogContent

```ts
import { DialogContent } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

Use within Dialog for focus trapping, Escape handling, and accessible modal contents.

**Examples:**

_Typical usage_
```tsx
<Dialog open={open} onOpenChange={setOpen}><DialogContent aria-describedby={undefined}><DialogTitle>Choose a blook</DialogTitle></DialogContent></Dialog>
```

**Avoid:**

- Do not hand-build modal focus behavior or omit DialogTitle.

### DialogDescription

```ts
import { DialogDescription } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### DialogFooter

```ts
import { DialogFooter } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### DialogHeader

```ts
import { DialogHeader } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### DialogOverlay

```ts
import { DialogOverlay } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### DialogPortal

```ts
import { DialogPortal } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### DialogTitle

```ts
import { DialogTitle } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### DialogTrigger

```ts
import { DialogTrigger } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### DiscordIcon

```ts
import { DiscordIcon } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### Empty

```ts
import { Empty } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

Use for an empty collection or filtered result with a clear status.

**Examples:**

_Typical usage_
```tsx
<Empty>No games match your search.</Empty>
```

**Avoid:**

- Do not imply a loading error when there are simply no results.

### ImagePicker

```ts
import { ImagePicker } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

Use in staff forms for an image preview, keyboard-accessible upload, and remove action.

**Props:**

| Prop | Type | Default |
|---|---|---|
| `value` | string | `—` |
| `label` | string | `—` |
| `onChange` | function | `—` |

**Examples:**

_Typical usage_
```tsx
<ImagePicker label="Pack image" value={image} onChange={setImage} />
```

**Avoid:**

- Do not crop uploaded art or replace it with emoji.

### PackOpener

```ts
import { PackOpener } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

Use for pack selection with interchangeable artwork and drop rates, quantity shortcuts, and sequential purchased reveals.

**Props:**

| Prop | Type | Default |
|---|---|---|
| `pack` | any | `—` |
| `tokens` | number | `—` |
| `onClose` | function | `—` |

**Examples:**

_Purchase a catalog pack_
```tsx
<PackOpener pack={selectedPack} tokens={wallet.tokens} onClose={() => setSelectedPack(null)} />
```

**Avoid:**

- Do not add a frame or gradient container around the purchased pack artwork.
- Do not charge again when advancing through purchased pulls.

### PageError

```ts
import { PageError } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

Use for page failures with a keyboard-accessible retry action.

**Examples:**

_Typical usage_
```tsx
<PageError error={error} />
```

**Avoid:**

- Do not show a dead-end error without a retry or navigation action.

### PageTitle

```ts
import { PageTitle } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

Use for a consistent page heading and optional page actions.

**Examples:**

_Typical usage_
```tsx
<PageTitle kicker="Recently played" title="History" />
```

**Avoid:**

- Do not skip heading levels.

### PasswordForm

```ts
import { PasswordForm } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

Use for email recovery or password reset with announced submission results.

**Examples:**

_Typical usage_
```tsx
<PasswordForm recovery />
```

**Avoid:**

- Do not display submission failures only visually.

### PlanetLogo

```ts
import { PlanetLogo } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### PlayerAvatar

```ts
import { PlayerAvatar } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

**Props:**

| Prop | Type | Default |
|---|---|---|
| `name` | string | `—` |
| `identity` | any | `—` |
| `className` | string | `inline-flex flex-wrap items-center gap-1` |

### PlayerName

```ts
import { PlayerName } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

**Props:**

| Prop | Type | Default |
|---|---|---|
| `name` | string | `—` |
| `identity` | any | `—` |
| `className` | string | `inline-flex flex-wrap items-center gap-1` |

### RolesPanel

```ts
import { RolesPanel } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### SessionContext

```ts
import { SessionContext } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### SessionProvider

```ts
import { SessionProvider } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### SiteHeader

```ts
import { SiteHeader } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

### ThemeToggle

```ts
import { ThemeToggle } from "@ws-bd67d8820baa01b4265a/8b44ca91-c56b-4244-8fec-9218cd4b72cf"
```

Use on public pages to change the remembered GameVerse theme. Signed-in appearance is selected in Settings.

**Examples:**

_Typical usage_
```tsx
<ThemeToggle />
```

**Avoid:**

- Do not add another signed-in sidebar theme toggle.

