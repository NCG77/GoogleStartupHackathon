# SafeRoute 2.0 Design System

Production design language for the React Native app and the matching Figma library.

**Brand personality:** trustworthy · calm · premium · minimal · accessible · safety-first · Material 3  
**Not:** pink “women-only” styling. Burgundy is the single brand accent on neutral off-white / near-black surfaces; SOS and danger stay a distinct red so they never read as brand.

---

## Figma file structure

Create one library file: `SafeRoute 2.0 — Design System`

| Page | Contents |
| --- | --- |
| `01 Foundations` | Color styles, text styles, effect styles, spacing / radius grid |
| `02 Components` | All components below as variants with Auto Layout |
| `03 Patterns` | Map chrome, route picker strip, SOS hold state, sheet + scrim |
| `04 Screens` | Home, Navigate, Safe Walk, SOS, Contacts, Settings |

**Frame size:** iPhone 14/15 — `393 × 852`.  
**Layout grid:** 8pt base, 16pt page margin, 24px corner radius on cards/sheets.

---

## Color styles (Figma → Local styles)

| Style name | Light | Dark | Role |
| --- | --- | --- | --- |
| `Primary / Default` | `#800020` | `#B3364F` | Brand, primary CTA, active nav |
| `Primary / Pressed` | `#66001A` | — | Pressed primary |
| `Primary / Container` | `#F5E6E9` | `#3A0F1B` | Soft brand surfaces, icon tiles |
| `Brand / Deep` | `#4A0E1C` | `#7A1A2F` | End stop of the `important` gradient (Safe Walk hero) |
| `Success` | `#2F8F5B` | — | Safe / positive |
| `Warning` | `#C77700` | — | Caution, check-in needed |
| `Danger` | `#D92D20` | `#F2564B` | SOS, critical (never burgundy) |
| `Background` | `#F7F5F4` | `#111113` | Canvas |
| `Surface` | `#FFFFFF` | `#1C1C20` | Cards, sheets |
| `Text / Primary` | `#111113` | `#F5F3F2` | Headlines, body |
| `Text / Secondary` | `#66646B` | `#B4B1B8` | Meta |
| `Text / Tertiary` | `#929098` | — | Captions, kickers |
| `Divider` | `#E8E3E1` | — | Hairlines |

`textOnPrimary` is white in both modes. For inverse surfaces (e.g. the Apple sign-in button) use `textPrimary` as the fill and `background` as the label instead of a fixed `charcoal` + white pair.

Gradients are restrained: `primaryButton` and `important` are near-flat burgundy, `sos` is red. Shadows are neutral (`#111113`, black in dark mode); no colored glows.

Heat-map route color is **not** a static style — use continuous score → hue (see `core/heatmap.ts`).

---

## Typography (Inter)

| Style | Size / Line / Weight | Use |
| --- | --- | --- |
| `Hero` | 40 / 48 / Bold | Editorial greetings |
| `Display` | 32 / 40 / Bold | Screen titles |
| `Headline` | 26 / 34 / SemiBold | Section titles |
| `Title` | 22 / 28 / SemiBold | Card titles |
| `Body` | 16 / 24 / Regular | Primary body |
| `Caption` | 13 / 18 / Medium | Chips, meta |

---

## Effects

| Style | Spec |
| --- | --- |
| `Elevation / Card` | Y 4 · Blur 16 · `#111113` @ 8% |
| `Elevation / FAB` | Y 8 · Blur 20 · `#111113` @ 16% |
| `Elevation / Sheet` | Y −4 · Blur 24 · `#111113` @ 10% |

Glass: only on map overlays / bottom nav — fill `#FFFFFF` @ 78% + background blur 20.

---

## Spacing & radius

- **Spacing tokens:** 0, 2, 4, 8, 16, 24, 32, 40, 48  
- **Corner radius:** cards / sheets / search = **24**; chips / buttons = **pill (999)**; FAB / SOS / avatar = **full**  
- **Touch targets:** min **48**; SOS **72**; FAB **56**

---

## Components (variants + Auto Layout)

Recreate each as a Figma component. Props map 1:1 to RN props in `components/design-system/`.

### Primary Button
- Variants: `Default` | `Pressed` | `Disabled` | `Loading`, optional leading icon
- Auto Layout: horizontal, padding `12–16` vertical / `24` horizontal, hug height, fill width optional
- `primaryButton` gradient, text On-Primary, pill radius; pressed = scale + dark veil; disabled = 45% opacity

### Secondary Button
- Variants: `Default` | `Pressed` | `Disabled`, optional leading icon
- Surface fill, 1px Border (Primary when pressed), text Primary text, pill

### Pressable Scale
- `PressableScale` is the shared press feedback: spring scale-down while held (`motion.pressScale` for buttons, `motion.pressScaleCard` for cards). Use it instead of opacity-only touchables for new tappable surfaces.

### Safe Walk Hero Card
- Inactive: `important` gradient card with a "Start Safe Walk" pill.
- Active: surface card with a status border and pulsing dot. The status text comes only from the server session state (`active` / `check_in_pending` / `sos`); never show "active" before the server confirms.

### SOS Button
- Variants: `Idle` | `Holding`
- 72 circle, Danger fill, optional outer ring Danger Container
- Label `SOS` Bold 18

### Search Bar
- Variants: `Empty` | `Filled` | `Focused`
- Height 52, radius 24, leading Material Symbol `search`, optional trailing `close`
- Surface + Card elevation

### Route Card
- Variants: `Safest` | `Balanced` | `Fastest` × `Selected` | `Unselected`
- Fixed width ~168, radius 24, top 4px heat accent bar
- Shows ETA, kind label, km, SafetyScoreChip, optional Crowd · Light

### User Avatar
- Variants: `Image` | `Initials` · sizes 32 / 40 / 56
- Full circle, Primary Container fallback

### Bottom Navigation
- Variants: tab `Active` | `Inactive`; center SOS elevated
- Glass surface, top radius 24, Material Symbols rounded
- Tabs: Home, Navigate, SOS, Contacts, Settings (or project-specific set)

### Safety Score Chip
- Variants: `Compact` | `Labeled`
- Pill; fill = heat color for score; white score text

### Notification Card
- Variants: tone `Info` | `Success` | `Warning` | `Danger` × `Read` | `Unread`
- Radius 24, icon tile + title + body + optional time / dismiss

### Heat Map Legend
- Title + continuous segmented track (0→100) + Low / High captions
- Glass optional when over map

### Floating Action Button
- Variants: `Primary` | `Surface` · icon instance swap
- 56 circle, FAB elevation

### Modal Bottom Sheet
- Variants: `Collapsed` | `Half` | `Expanded` (height 35% / 45% / 70%)
- Handle 40×4, title, content slot; scrim `#111113` @ 32%

---

## Motion & feedback

| Token (`motion.*`) | Value | Use |
| --- | --- | --- |
| `micro` / `fast` | 150 / 180 ms | Press, small state changes |
| `normal` | 220 ms | Component transitions, overlay fade-in |
| `slow` | 280 ms | Stack screen transitions, overlay fade-out |
| `toastIn` / `toastOut` | 260 / 200 ms | Toast enter / exit |
| `toastVisibleMs` | 3600 ms | Toast auto-dismiss |
| `stagger` | 60 ms | Home section entrance |
| `pressSpring` | damping 18 · stiffness 320 · mass 0.6 | Press scale |

- **Reduce motion:** every animation checks `useReducedMotion()`; tabs and stack switch to `none`, press scale and pulses are skipped, overlays use a plain fade.
- **Tabs:** `shift` animation plus an animated pill behind the active icon.
- **Toasts:** `useToast().show({ tone, title, message })` with tones `success` / `warning` / `error` / `info`. One at a time, top of screen, tap to dismiss, announced to screen readers, and they never block touches below them. On iOS they render above native modals; on Android they render **under** an open RN `Modal`, so keep `Alert` for messages raised from inside a sheet or modal, for confirmations, and for anything safety-critical.
- **Safe Walk activation:** `SafeWalkActivationOverlay` (non-interactive) + success haptic + `assets/sounds/safe-walk-chime.wav`. Fires only once per server session, only within 2 min of a confirmed `startSafeWalk` (not on resume, SMS-only fallback, or permission-denied paths), only while the app is in the foreground. The chime respects the silent switch / ringer mode and can be turned off in Settings → "Safe Walk start sound" (`@SafeRoute:safeWalkChime`).

---

## Code mapping

| Concern | Path |
| --- | --- |
| Tokens | `constants/theme.ts` |
| Paper MD3 theme | `constants/paperTheme.ts` |
| Legacy map colors | `constants/GlobalStyles.js` |
| Components | `components/design-system/*` |
| Heat colors | `core/heatmap.ts` |

```ts
import { theme } from "@/constants/theme";
import { PrimaryButton, RouteCard, SOSButton } from "@/components/design-system";
```

Do not hard-code hex in screens. Extend tokens first, then components.

---

## Accessibility checklist

- Contrast ≥ 4.5:1 for body text on Background / Surface  
- All interactive targets ≥ 48×48  
- SOS uses long-press + cancel affordance (no instant dial on tap alone)  
- Labels on icon-only controls (FAB, clear search, dismiss)  
- Prefer Material Symbols Rounded for consistency with Android / M3

---

## Screen principles

1. **Maps are edge-to-edge** — chrome floats on top (search, legend, route cards, FAB).  
2. **One primary action** per viewport; SOS is always reachable but never decorative pink.  
3. **Large whitespace** — prefer 24–32 gaps between major blocks.  
4. **Glass only** where map readability requires it.  
5. Every new screen must compose from this library — no one-off visual systems.
