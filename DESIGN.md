---
version: 1
name: Midnight Indigo Glow Mobile
colors:
  background: "#1A1E2E"
  surface: "#20263A"
  surface-alt: "#1E293B"
  surface-accent: "#262F45"
  on-surface: "#F8FAFC"
  on-surface-variant: "#94A3B8"
  border: "#2E3650"
  primary: "#3B82F6"
  on-primary: "#FFFFFF"
  success: "#22C55E"
  error: "#EF4444"
  warning: "#EAB308"
  accent-violet: "#A855F7"
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: 700
    lineHeight: 40px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Space Grotesk
    fontSize: 30px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: 700
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: 700
    lineHeight: 24px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: 700
    lineHeight: 22px
    letterSpacing: 0em
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: 500
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 600
    lineHeight: 18px
    letterSpacing: 0em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 700
    lineHeight: 16px
    letterSpacing: 0em
  caption:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0em
  label-uppercase:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 700
    lineHeight: 16px
    letterSpacing: 0.12em
  badge-uppercase:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: 700
    lineHeight: 12px
    letterSpacing: -0.01em
  tab-label:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: 500
    lineHeight: 12px
    letterSpacing: 0em
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  gutter: 16px
  card-padding: 20px
  section-gap: 24px
icons:
  set: solar
  default_variant: bold
  active_variant: bold
  stroke_weight: 1.5px
  default_size: 24px
components:
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    rounded: "{rounded.xl}"
    padding: "{spacing.card-padding}"
    boxShadow: none
  card-elevated:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    rounded: "{rounded.2xl}"
    padding: "{spacing.xl}"
    boxShadow: "0 8px 24px rgba(0,0,0,0.20)"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 48px
    paddingX: 20px
    gap: 8px
    iconSize: 20px
    border: none
    boxShadow: "0 0 15px rgba(59,130,246,0.4)"
    pressedBackground: "darken(8%)"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    rounded: "{rounded.lg}"
    height: 48px
    paddingX: 20px
    gap: 8px
    iconSize: 20px
    boxShadow: none
    pressedBackground: "{colors.surface-accent}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    paddingX: 4px
    paddingY: 4px
    border: none
    boxShadow: none
  button-icon:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-variant}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    rounded: "{rounded.full}"
    size: 40px
    iconSize: 20px
    boxShadow: none
  button-fab-glow:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    borderColor: "{colors.background}"
    borderWidth: 4px
    rounded: "{rounded.full}"
    size: 56px
    iconSize: 28px
    boxShadow: "0 0 20px rgba(59,130,246,0.5)"
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    rounded: "{rounded.md}"
    paddingX: 16px
    paddingY: 12px
    boxShadow: none
    focusRingColor: "{colors.primary}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-md}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    rounded: "{rounded.full}"
    paddingX: 20px
    paddingY: 8px
    boxShadow: none
  chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    paddingX: 20px
    paddingY: 8px
    border: none
    boxShadow: "0 0 10px rgba(59,130,246,0.3)"
  badge-pill:
    backgroundColor: "rgba(34,197,94,0.10)"
    textColor: "{colors.success}"
    typography: "{typography.label-sm}"
    borderColor: "rgba(34,197,94,0.20)"
    borderWidth: 1px
    rounded: "{rounded.full}"
    paddingX: 10px
    paddingY: 4px
    gap: 4px
    iconSize: 12px
    boxShadow: none
  badge-status-uppercase:
    backgroundColor: "rgba(34,197,94,0.10)"
    textColor: "{colors.success}"
    typography: "{typography.badge-uppercase}"
    rounded: "{rounded.sm}"
    paddingX: 6px
    paddingY: 2px
    border: none
    boxShadow: none
  badge-circle:
    backgroundColor: "rgba(59,130,246,0.20)"
    textColor: "{colors.primary}"
    borderColor: "rgba(59,130,246,0.30)"
    borderWidth: 1px
    rounded: "{rounded.full}"
    size: 40px
    iconSize: 20px
    boxShadow: none
  avatar:
    backgroundColor: "rgba(59,130,246,0.20)"
    textColor: "{colors.primary}"
    borderColor: "rgba(59,130,246,0.30)"
    borderWidth: 1px
    rounded: "{rounded.full}"
    size: 40px
    boxShadow: none
  list-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    rounded: "{rounded.xl}"
    paddingX: 16px
    paddingY: 16px
    gap: 12px
    boxShadow: none
  list-row-divided:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    rounded: 0px
    paddingX: 0px
    paddingY: 12px
    gap: 12px
    boxShadow: none
  progress-bar:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    height: 6px
    border: none
    boxShadow: none
  progress-ring:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    size: 128px
    border: none
    boxShadow: none
  top-app-bar:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-md}"
    height: 64px
    paddingX: 24px
    border: none
    boxShadow: none
  tab-bar:
    backgroundColor: "rgba(26,30,46,0.95)"
    textColor: "{colors.on-surface-variant}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    rounded: 0px
    height: 72px
    paddingX: 16px
    paddingY: 16px
    boxShadow: none
  tab-item-active:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.tab-label}"
    iconSize: 24px
    gap: 4px
    border: none
    boxShadow: none
  tab-item-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.tab-label}"
    iconSize: 24px
    gap: 4px
    border: none
    boxShadow: none
---

# Midnight Indigo Glow Mobile

## Overview

**Dark, technical, and softly luminous.** A deep indigo-leaning navy ground (`{colors.background}`) hosts marginally lighter card panels, with a saturated cobalt blue as the single source of energy. Every active or interactive primary element emits a soft cyan-blue halo via box-shadow, producing the "screens-glowing-in-the-dark" feel of premium fintech / trading dashboards.

The system is **information-dense but never cramped**: generous 16px gutters, large rounded corners, ample line-height. Two typefaces work in tandem — a condensed-feeling geometric grotesque for headlines and numerals (`Space Grotesk`) and a humanist sans for body and labels (`Manrope`). Numerals are the visual heroes; almost every screen anchors on a large bold figure.

The mood is **confident, calm, professional, never playful**. Color is rationed: blue means action, green means positive, red means negative, neutral grey-blue is everything else. Imagery is essentially absent — this is a typography-and-iconography aesthetic.

## Colors

The palette is layered from deepest to lightest by surface elevation:

- `{colors.background}` (`#1A1E2E`) — the page ground; the darkest layer.
- `{colors.surface}` (`#20263A`) — every card, button-secondary, icon button, chip-inactive, list row.
- `{colors.surface-alt}` (`#1E293B`) — recessed slots inside cards (e.g. progress-bar track, square icon tile background).
- `{colors.surface-accent}` (`#262F45`) — secondary gradient stop on elevated cards; pressed state for `button-secondary`.
- `{colors.border}` (`#2E3650`) — the universal hairline; nearly every surface carries it.

Foreground tiers:
- `{colors.on-surface}` (`#F8FAFC`) — primary text, numerals, headings.
- `{colors.on-surface-variant}` (`#94A3B8`) — secondary text, metadata, inactive icons, inactive tab labels.

Brand & semantics:
- `{colors.primary}` (`#3B82F6`) — the only accent that earns a glow. Reserved for the active CTA, the active chip, the active tab, the FAB, the brand avatar, and one-color data viz strokes.
- `{colors.on-primary}` (`#FFFFFF`).
- `{colors.success}` (`#22C55E`) — positive deltas, "completed" status badges, gain sparklines.
- `{colors.error}` (`#EF4444`) — negative deltas, loss sparklines.
- `{colors.warning}` (`#EAB308`) — held in reserve for caution states.
- `{colors.accent-violet}` (`#A855F7`) — secondary categorical color in multi-segment charts only; never appears in chrome.

**Tinted-on-dark recipe.** A recurring trick: a colored circular slot uses `bg-{role}/10` to `bg-{role}/20` fill plus `border-{role}/20` to `/30` hairline plus the matching role color for the icon or text. This is how categorical color enters the UI without breaking the dark-mode hush.

**Boundaries.** Saturated `{colors.primary}` never becomes a card background — it would burn out the screen. Semantic colors (`{colors.success}`/`{colors.error}`) appear only on text, sparklines, and tinted badges, never as solid fills.

## Typography

Two families, each with a dedicated job:

- **Space Grotesk** (`{typography.display-*}`, `{typography.headline-*}`) — all numerals, all titles, all section headers. Weight 700 almost exclusively. Tight tracking (`-0.01em` to `-0.02em`) at large sizes gives the hero numbers their packed, financial-readout feel.
- **Manrope** (`{typography.body-*}`, `{typography.label-*}`, `{typography.caption}`, `{typography.tab-label}`) — every paragraph, label, button, chip, metadata line, tab. Workhorse weights are 500 (body) and 600–700 (labels and emphasis).

Roles:
- `{typography.display-lg}` — the screen's hero numeral (a primary balance, a featured stat).
- `{typography.display-md}` — the secondary hero number on a detail view.
- `{typography.headline-lg}` — primary screen title in a top app bar.
- `{typography.headline-md}` — large screen title or major section anchor.
- `{typography.headline-sm}` — card section title ("Top Movers", "Watchlist", "My Assets").
- `{typography.body-md}` — list-row primary text, paragraph body.
- `{typography.body-sm}` — secondary metadata under a primary line.
- `{typography.label-md}` — button labels, chip labels, in-line emphasis.
- `{typography.label-sm}` — small button text, "View All", percentage deltas.
- `{typography.caption}` — helper labels above stat numerals ("Total Balance", "Buying Power").
- `{typography.label-uppercase}` — tracked-out date/group section headers ("TODAY", "YESTERDAY").
- `{typography.badge-uppercase}` — micro status pill text ("COMPLETED", "EXPIRED").
- `{typography.tab-label}` — bottom-nav text.

**Weight strategy.** Bold (700) for almost every visible-emphasis token; medium (500) for body and metadata. There is no light-weight type anywhere. The contrast between bold-headline and medium-body is what creates rhythm — never letter-spacing or italic.

## Spacing & Layout

The system runs on a 4px grid with these primary stops: `{spacing.xs}` 4, `{spacing.sm}` 8, `{spacing.md}` 12, `{spacing.lg}` 16, `{spacing.xl}` 24, `{spacing.2xl}` 32.

- `{spacing.gutter}` 16px — horizontal screen inset for content; the top app bar runs at 24px for slightly more breathing room.
- `{spacing.card-padding}` 20px — the standard card interior; elevated/feature cards step up to `{spacing.xl}`.
- `{spacing.section-gap}` 24px — vertical gap between titled sections.

Rhythm rule: card → 16px gap → next card. Section header → 12–16px → first card of section. Group label (uppercase) → 16px → first row.

The page is a single vertical scroll with a fixed bottom tab bar — no horizontal layout decisions to extract. The tab bar reserves ~72px at the bottom; content always pads `pb-24` to clear it.

## Elevation & Depth

Three depth strategies, used in combination:

1. **Tonal layering.** `{colors.background}` (deepest) → `{colors.surface}` (cards) → `{colors.surface-accent}` (gradient stop on featured cards). Each step is a small lightness lift; nothing is dramatic. Most depth comes from this layering alone.
2. **Hairline borders.** Nearly every surface carries a 1px `{colors.border}` stroke. The combination of slight tonal lift + visible hairline reads as "lifted card" without needing shadow.
3. **Glow shadows.** Reserved for primary-color elements only:
   - `button-primary`: `0 0 15px rgba(59,130,246,0.4)`
   - `button-fab-glow`: `0 0 20px rgba(59,130,246,0.5)`
   - `chip-active`: `0 0 10px rgba(59,130,246,0.3)`
   - The featured/hero card may use a soft black drop: `0 8px 24px rgba(0,0,0,0.20)`.

A blue dot at small sizes can also receive a tiny glow (`shadow-[0_0_8px_rgba(59,130,246,0.5)]`) to read as a status LED. Glow is the system's signature — **never apply it to non-primary surfaces**.

## Shapes

Heavily rounded throughout. Corners follow the scale:
- `{rounded.sm}` 8px — micro pills, status badges (`badge-status-uppercase`).
- `{rounded.md}` 12px — small icon-tile slots, inputs, segmented-control individual buttons.
- `{rounded.lg}` 16px — primary buttons, mid-size square slots.
- `{rounded.xl}` 20px — standard cards, list-row cards, watchlist tiles.
- `{rounded.2xl}` 24px — feature/hero cards.
- `{rounded.full}` — chips, avatars, circular icon buttons, badge pills, the FAB, status dots, progress-bar tracks.

Rule of thumb: **everything is either fully circular or noticeably rounded**. Sharp 90° corners do not appear. The tab bar and divider lines are the only thin straight elements.

## Components

### card

Default surface for every grouped block.

```html
<div class="bg-[#20263A] border border-[#2E3650] rounded-[20px] p-5">
  <h3 class="font-bold text-[18px] text-[#F8FAFC] mb-4" style="font-family: 'Space Grotesk'">[Section title]</h3>
  <p class="text-[14px] text-[#94A3B8]" style="font-family: 'Manrope'">[Body content]</p>
</div>
```

### card-elevated

The featured hero card per screen — usually carries the primary numeral and the page's main CTA pair. Uses a gradient from `{colors.surface}` to `{colors.surface-accent}` plus a soft black drop shadow.

```html
<div class="bg-gradient-to-br from-[#20263A] to-[#262F45] rounded-[24px] p-6 border border-[#2E3650] shadow-[0_8px_24px_rgba(0,0,0,0.20)]">
  <div class="flex justify-between items-start mb-2">
    <span class="text-[#94A3B8] text-[14px] font-medium" style="font-family: 'Manrope'">[Caption]</span>
    <!-- optional badge-pill here -->
  </div>
  <h2 class="text-[36px] font-bold tracking-tight mb-1 text-[#F8FAFC]" style="font-family: 'Space Grotesk'">[Hero numeral]</h2>
  <p class="text-[14px] text-[#22C55E] font-medium mb-6" style="font-family: 'Manrope'">[Delta line]</p>
  <!-- action pair -->
</div>
```

### button-primary

The single most attention-getting element. Always carries the cobalt glow.

```html
<button class="h-12 px-5 rounded-[16px] bg-[#3B82F6] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.4)]" style="font-family: 'Manrope'">
  <iconify-icon icon="solar:[icon-name]-bold" class="size-5"></iconify-icon>
  [Primary action]
</button>
```

Use `flex-1` to pair side-by-side with `button-secondary` inside a hero card.

### button-secondary

Same shape as primary, surface-toned, no glow.

```html
<button class="h-12 px-5 rounded-[16px] bg-[#20263A] border border-[#2E3650] text-[#F8FAFC] font-semibold text-[14px] flex items-center justify-center gap-2" style="font-family: 'Manrope'">
  <iconify-icon icon="solar:[icon-name]-bold" class="size-5"></iconify-icon>
  [Secondary action]
</button>
```

### button-text

```html
<button class="text-[#3B82F6] text-[12px] font-semibold" style="font-family: 'Manrope'">[Action]</button>
```

### button-icon

The circular chrome button used for back/notification/settings/share/filter.

```html
<button class="size-10 rounded-full bg-[#20263A] border border-[#2E3650] flex items-center justify-center">
  <iconify-icon icon="solar:[icon-name]-bold" class="size-5 text-[#94A3B8]"></iconify-icon>
</button>
```

### button-fab-glow (signature)

The center-protruding FAB on the bottom tab bar. The thick `border-4` matches the page background so the button reads as floating above the bar.

```html
<div class="relative -top-6">
  <button class="size-14 rounded-full bg-[#3B82F6] text-white flex items-center justify-center border-4 border-[#1A1E2E] shadow-[0_0_20px_rgba(59,130,246,0.5)]">
    <iconify-icon icon="solar:[icon-name]-bold" class="size-7"></iconify-icon>
  </button>
</div>
```

### input-text

```html
<input type="text" placeholder="[Placeholder]" class="w-full bg-[#20263A] border border-[#2E3650] rounded-[12px] px-4 py-3 text-[14px] text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#3B82F6]" style="font-family: 'Manrope'" />
```

### chip / chip-active

Filter chips with full-pill shape. Active chip swaps to primary fill plus a soft glow.

```html
<button class="px-5 py-2 rounded-full bg-[#3B82F6] text-white text-[14px] font-semibold whitespace-nowrap shadow-[0_0_10px_rgba(59,130,246,0.3)]" style="font-family: 'Manrope'">[Active filter]</button>
<button class="px-5 py-2 rounded-full bg-[#20263A] border border-[#2E3650] text-[#94A3B8] text-[14px] font-semibold whitespace-nowrap" style="font-family: 'Manrope'">[Filter]</button>
```

### badge-pill

The tinted-on-dark recipe — use for delta indicators and inline status. Swap the role color (`success` / `error` / `primary` / `warning`) and keep the alpha conventions identical.

```html
<span class="bg-[#22C55E]/10 text-[#22C55E] px-2.5 py-1 rounded-full text-[12px] font-bold flex items-center gap-1 border border-[#22C55E]/20" style="font-family: 'Manrope'">
  <iconify-icon icon="solar:[icon-name]-linear" class="size-3"></iconify-icon>
  [Value]
</span>
```

### badge-status-uppercase

Micro status tag, uppercase, tight tracking, sits to the right of a row's primary value. Same tinted recipe with low alpha.

```html
<p class="text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded uppercase tracking-tighter" style="font-family: 'Manrope'">[Status]</p>
```

### badge-circle

Round colored slot for a leading icon in a row or header. Apply the tinted recipe with whichever brand-categorical color the item carries (the categorical color may be a freeform brand hex, not a token).

```html
<div class="size-10 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/30 flex items-center justify-center">
  <iconify-icon icon="solar:[icon-name]-bold" class="size-5 text-[#3B82F6]"></iconify-icon>
</div>
```

### avatar

User avatar uses the same tinted-circle recipe as `badge-circle` with primary color and a person icon, OR a square-rounded muted slot with monogram text.

```html
<div class="size-10 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/30 flex items-center justify-center">
  <iconify-icon icon="solar:user-bold" class="size-5 text-[#3B82F6]"></iconify-icon>
</div>
```

### list-row

Card-shaped row used for assets, transactions, watchlist items. Leading colored circle, two-line label block, right-aligned numeral block with a delta or status underneath.

```html
<div class="bg-[#20263A] p-4 rounded-[20px] border border-[#2E3650] flex items-center justify-between">
  <div class="flex items-center gap-3">
    <div class="size-11 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/30 flex items-center justify-center">
      <iconify-icon icon="solar:[icon-name]-bold" class="size-6 text-[#3B82F6]"></iconify-icon>
    </div>
    <div>
      <p class="font-bold text-[14px] text-[#F8FAFC]" style="font-family: 'Manrope'">[Item name]</p>
      <p class="text-[12px] text-[#94A3B8]" style="font-family: 'Manrope'">[Subtitle / metadata]</p>
    </div>
  </div>
  <div class="text-right">
    <p class="font-bold text-[14px] text-[#F8FAFC]" style="font-family: 'Manrope'">[Value]</p>
    <p class="text-[12px] text-[#22C55E] font-semibold flex justify-end items-center gap-1" style="font-family: 'Manrope'">
      <iconify-icon icon="solar:arrow-right-up-linear" class="size-3"></iconify-icon>
      [Delta]
    </p>
  </div>
</div>
```

### list-row-divided

Inside a card that groups multiple rows, an alternative is a borderless row with a hairline `border-b border-[#2E3650]/40` divider and `last:border-0`. Same internal slot recipe; the wrapping card supplies the outer rounded surface.

### progress-bar

```html
<div class="w-full h-1.5 rounded-full bg-[#1E293B]">
  <div class="h-full rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.5)]" style="width: 60%"></div>
</div>
```

### progress-ring

Multi-segment SVG donut on a transparent background. Each segment uses one categorical color from the chart palette (`{colors.primary}`, `{colors.accent-violet}`, `{colors.success}`, etc.) at 3-unit stroke-width. Center stack: caption (`{typography.caption}`) over a percentage in `{typography.headline-sm}` colored to match the dominant segment.

### top-app-bar

A flush header — no background fill, no shadow. Title left, icon-button cluster right. On profile-style headers, the title pair sits next to a leading 40px circular avatar.

```html
<header class="px-6 pt-8 pb-4 flex items-center justify-between">
  <h1 class="text-[24px] font-bold tracking-tight text-[#F8FAFC]" style="font-family: 'Space Grotesk'">[Screen title]</h1>
  <div class="flex gap-3">
    <!-- button-icon × N -->
  </div>
</header>
```

### tab-bar / tab-item-active / tab-item-inactive

Fixed-bottom translucent bar with backdrop blur and a top hairline. Five slots; the third slot is the protruding `button-fab-glow`. Active item: primary color icon + label, no background pill. Inactive: muted variant color.

```html
<div class="fixed bottom-0 left-0 right-0 bg-[#1A1E2E]/95 backdrop-blur-md border-t border-[#2E3650] flex justify-around items-center py-4 z-50">
  <button class="flex flex-col items-center gap-1 text-[#3B82F6]">
    <iconify-icon icon="solar:[icon-name]-bold" class="size-6"></iconify-icon>
    <span class="text-[10px] font-medium" style="font-family: 'Manrope'">[Label]</span>
  </button>
  <button class="flex flex-col items-center gap-1 text-[#94A3B8]">
    <iconify-icon icon="solar:[icon-name]-bold" class="size-6"></iconify-icon>
    <span class="text-[10px] font-medium" style="font-family: 'Manrope'">[Label]</span>
  </button>
  <!-- button-fab-glow center -->
  <!-- two more tab items -->
</div>
```

### Composition recipes (not separate components)

- **Stat tile** (a small two-line metric card in a grid): a `card` with `{typography.caption}` for the label and `{typography.headline-sm}` (Space Grotesk, bold) for the value. Use `grid-cols-2 gap-3`. Color the value with `{colors.success}` or `{colors.error}` when it represents a signed delta.
- **Group section** (date- or category-grouped list): an `{typography.label-uppercase}` header in `{colors.on-surface-variant}` with 16px bottom margin, then a vertical stack of `list-row` cards at `space-y-3`.
- **Time-range segmented control**: a single `bg-[#20263A]/50` rounded container with a 1px border, holding equal-width buttons. Active button gets `bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 rounded-[12px]`; inactive buttons are transparent with `text-[#94A3B8]`.
- **Horizontal carousel tile** (in a swipe-row): a 150px-min-width `card` at `p-4`, leading 32px tinted circle, mini sparkline (40px tall SVG) in the middle, value + delta at the bottom.
- **Sparkline**: 100×40 viewBox SVG. Stroke 2px in `{colors.success}` for positive, `{colors.error}` for negative. Optional area fill via a vertical gradient from `stop-opacity:0.2` at top to `0` at bottom in the same hue. No axes, no grid.

## Iconography

Iconify set: **Solar**, with the **bold** variant as the default for both inactive and active states. Solar's bold style — softly rounded filled glyphs with consistent optical weight — pairs with the rounded shape language. Some thin meta-icons (small percentage-delta arrows, sort glyphs, search) use the **linear** variant at 12–16px to sit lightly inside dense rows.

Sizes:
- 12–16px inside delta pills, status indicators, micro chrome.
- 20px inside `button-icon`, `button-primary`/`secondary`.
- 24px in tab bar and standard list-row leading slots.
- 28px in the FAB.

The active vs inactive distinction in the bottom nav is driven by **color alone** (`{colors.primary}` vs `{colors.on-surface-variant}`), not by variant switching.

## Illustration & Imagery

**This aesthetic does not use imagery.** Adding photos or illustrations would clash with the dense, technical, dark-mode dashboard system. The screen is built from typography, iconography, tinted color slots, and minimalist data-viz strokes — that vocabulary is the entire visual language. Implement image-shaped requirements with these typographic & geometric fallbacks:

- **Avatars** → render as a 40px `rounded-full` slot using the tinted recipe: `bg-[#3B82F6]/20` with `border border-[#3B82F6]/30`, containing either a `solar:user-bold` glyph in `text-[#3B82F6]` or a 1–2 letter monogram in `{typography.label-md}` weight 700. Never insert a photo.
- **Brand / token / asset logos** → render as a tinted circle at 32–44px using the brand's signature hex for the fill (`bg-[brand]/20`), border (`border-[brand]/30`), and inner icon. Pull the icon from Iconify (e.g. `mdi:[brand-name]`, `cryptocurrency-color:[ticker]`) when one exists; otherwise use a 2–4 character monogram in Space Grotesk bold inside the circle.
- **Hero illustrations** → replaced by an oversized numeral in `{typography.display-lg}` (Space Grotesk, weight 700, tight tracking) inside a `card-elevated`. The number IS the hero.
- **Empty states** → a centered Solar bold icon at 48–64px in `{colors.on-surface-variant}` inside a `bg-[#20263A]` tinted circle at 96px, followed by a `{typography.headline-sm}` title and a `{typography.body-sm}` muted line. No illustration.
- **Decorative graphics** → SVG sparklines, donut/ring charts, and the soft glow halos on primary elements. These ARE the decoration. No icons-as-decoration; no abstract shapes for warmth.
- **Background imagery / atmospherics** → none. The flat `{colors.background}` is final.

If a future brief absolutely requires a photograph (user-uploaded content, an article cover), present it inside a `rounded-[20px]` frame with `border border-[#2E3650]`, `object-cover`, no filter, and contain it strictly to its data slot — never use it as decoration or atmosphere.

## Do's and Don'ts

### Do

- Use Space Grotesk for every numeral and every title; Manrope for everything else.
- Apply the cobalt glow shadow to primary CTAs, the active chip, the FAB, and primary-status dots — and nothing else.
- Use the tinted-on-dark recipe (`bg-[role]/10–20` + `border-[role]/20–30` + `text-[role]`) for every colored slot, badge, and status pill.
- Border every card surface with the `{colors.border}` hairline. Tonal layering plus hairline replaces shadow as the default depth strategy.
- Color signed values: gains in `{colors.success}`, losses in `{colors.error}`, neutrals in `{colors.on-surface-variant}`.
- Reserve the `card-elevated` gradient + soft black shadow for one true "hero" surface per screen.
- Use full-pill rounding for chips, avatars, badges, the FAB, and progress bars.

### Don't

- Don't use `{colors.primary}` as a card or page background — it should only ever appear on a CTA, an active state, or as inline accent text.
- Don't apply the blue glow shadow to neutral surfaces, secondary buttons, or inactive elements.
- Don't introduce shadows other than the documented glow recipes and the single `0 8px 24px rgba(0,0,0,0.20)` on `card-elevated`.
- Don't use light or thin font weights anywhere; the system relies on the bold/medium contrast.
- Don't introduce a third typeface — the JetBrains Mono and Playfair links exist in the source but are not used and should remain unused.
- Don't drop the hairline border off cards "for cleanliness" — without it the layered tonal scheme collapses.
- Don't insert decorative illustrations or photographs; the chart strokes and tinted icon slots are the entire decorative palette.
- Don't mix Solar variants randomly — bold is the default; switch to linear only for sub-16px meta glyphs.
