# esSports Design System — Coral Daylight Mobile

**Bright, friendly, quietly premium.** A near-white page, white cards with feathery shadows, and a single coral accent that carries all emphasis, action and active state. Everything else is grayscale plus a peach "selected" tint.

All tokens live in `src/theme` and are imported from `@/theme`. Never hard-code a colour, size, radius, shadow or font weight in a component.

## App-specific rules (override the source spec)

- **Font:** the device system font. Never set `fontFamily`.
- **Weights:** headings (`display*`, `numeralStat`, `headline*`) use `fontWeight.heading` (`'500'`). All other text uses `fontWeight.regular` (`'400'`). Nothing heavier than 500.
- **Sizes scale with the device:** wrap every layout number in `dp()` and every font size in `sp()`. Both equal the spec value on a 375pt-wide phone. `dp` scales 0.85–1.25×; `sp` grows half as fast (0.9–1.15×), and the OS font-size setting is applied on top by `<Text>`. Tokens are already scaled, so don't wrap them again.
- **Light and dark:** follow the device setting. The light palette is the spec; the dark palette is derived from it.
- **Contrast:** `textMuted` (#6E6E73) and `link` (#C73E26) are darker than the spec so small text passes WCAG AA. Use `link` for coral text on light surfaces. Raw `primary` is for fills only.
- **No blur:** the tab bar is solid `background` (no translucency or backdrop blur), per the performance rules in `memory.md`.

## Colours (`colors` from `useTheme()`)

| Token | Light | Role |
|---|---|---|
| `background` | #F8F8FB | Page |
| `surface` | #FFFFFF | Cards, sheets |
| `surfaceRaised` | #F0F0F3 | Inputs, inactive chips and list rows, secondary button |
| `border` | #E5E5EA | Hairlines, progress tracks |
| `text` / `textMuted` | #2C2C2E / #6E6E73 | Primary / supporting text |
| `primary` / `primaryText` | #FF6B50 / #FFFFFF | CTA, active tab, selection border, progress fill, focus ring |
| `primarySoft` | #FFEBE8 | Selected surface behind coral content |
| `primaryTint` | #FF9F8C | Two-tone coral moments, sparingly |
| `link` | #C73E26 | Coral text and links |
| `danger` / `live` | #FF3B30 | Destructive, live |
| `info` / `infoSoft` | #3B82F6 / #EFF6FF | Categorical blue cousin |
| `success` / `successSoft` | #15803D / #DCFCE7 | Completed / positive status |
| `accent` / `accentSoft` | amber | Categorical (toss, winner) |

Coral never becomes a card background or a wide field. A selected tile is `primarySoft` fill plus a 2px `primary` border. The inactive tile reserves a 2px transparent border so selection doesn't shift the layout.

## Typography (`typography.*` or `<Text variant>`)

| Variant | Size / line | Weight | Use |
|---|---|---|---|
| `displayLg` | 48 / 1.05 | 500 | Hero numerals |
| `displayMd` (`title`) | 30 / 1.1 | 500 | Screen title |
| `numeralStat` | 30 / 1.1, tabular | 500 | Stat grids |
| `headlineLg` (`heading`) | 20 / 1.25 | 500 | Top bar title |
| `headlineMd` | 18 / 1.3 | 500 | Card title, primary CTA label |
| `bodyMd` (`body`) | 14 / 1.5 | 400 | Body copy |
| `bodySm` (`caption`) | 12 / 1.45 | 400 | Helper copy |
| `labelMd` | 14 | 400 | Secondary actions, "See all" |
| `labelSm` | 12 | 400 | Chips, badges |
| `labelUppercase` | 12, +0.12em, caps | 400 | Kickers ("STREAK") |
| `tabLabel` | 10 | 400 | Bottom tabs |

Text 18px and larger has tracking tightened to -0.01/-0.02em. Single-line labels get a minimum line height of 1.2× so Android doesn't clip descenders. Use `fontVariant: ['tabular-nums']` on any numbers that stack.

## Spacing, sizes and radius

- `spacing`: xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32
- `sizes`: gutter 24 · sectionGap 24 · cardPadding 24 · cardPaddingTight 20 · control 52 · field 56 · iconButton/avatar 40 · icon 24 · iconSmall 16 · tabIcon 28 · tabBar 80 · topBar 64 · progressBar 10
- `radius`: sm 8 (micro) · md 16 (inputs, nested tiles) · lg 20 (every card) · xl 24 · pill 999 (buttons, chips, badges, avatars, progress)

Any interactive element that isn't a card is a pill. Cards are 20; tiles nested in a card are 16.

## Elevation (`shadows.*`)

- `shadows.card`: `0 4 20 rgba(0,0,0,.05)` on every card.
- `shadows.primary`: coral glow, only on the primary CTA.
- `shadows.iconButton`: hairline, on floating circular icon buttons.
- Chips, badges, inputs, list rows and the tab bar are flat.

Press state is `transform: [{ scale: 0.95 }]`. No hover-lift and no rotation.

## Components

- **Button:** `primary` is a coral pill with `shadows.primary` and a `headlineMd` label. `secondary` is a `surfaceRaised` pill with a `labelMd` label. `ghost` is `link`-coloured text.
- **Card:** use `<Card>` from `@/components/ui` (`padding="regular" | "tight" | "none"`): `surface`, `radius.lg`, `shadows.card`, no border. Horizontal scrollers of cards need vertical content padding so shadows aren't clipped.
- **Icon button:** `AppIconTile` defaults to a 40px pill. Pass `backgroundColor={colors.surface}` plus `elevated` for floating back/share buttons.
- **Input:** `surfaceRaised`, `radius.md`, height `sizes.field`, 20 horizontal padding, no border. On focus, a coral ring at 20% opacity.
- **Chip:** use `AppTabs`. Inactive is `surfaceRaised` + `textMuted`; active is `primarySoft` + `link`. Pill, 16/8 padding, 16px icon.
- **Segmented control:** a `surfaceRaised` pill track; the selected segment is a white pill.
- **List row / option card:** `surfaceRaised`, `radius.md`, 20 padding, 2px transparent border. Active is `primarySoft` with a 2px `primary` border.
- **Progress bar:** 10 tall, `border` track, `primary` fill, pill ends.
- **Tab bar:** the floating notched bar (`components/navigation/bottom-nav.tsx`) is kept. It has a `surface` fill and a hairline border. The active icon is coral; inactive icons are `textMuted` at 50% opacity. The raised + button is coral with `shadows.primary`.
- **Top bar:** title left-aligned in `displayMd` with a `bodySm` muted sub-line. Detail screens use a centred `headlineLg` title with a 40px icon button on the left.

## Do / Don't

- Do keep coral to one CTA, the active tab, active progress and focus rings per screen.
- Do pair coral with `primarySoft` for selected states, never coral against white.
- Don't add a third saturated brand colour, shadows on flat elements, or a custom font.
