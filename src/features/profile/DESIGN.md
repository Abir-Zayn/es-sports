# User Profile: design spec

Status: **built** (Profile tab, Edit profile, Settings). Not yet checked on a device. Owner: main agent (Claude Code).
Deviations from this spec: "Your Teams" reuses Home `ContractedTeams` as is (title "Your Teams", Manage action); the Settings Privacy row shows a "coming soon" toast until `/privacy` exists; the discard guard uses `usePreventRemove` instead of a custom back handler.

The Claude design file has no exported mock for the profile (`design/` holds splash, logo, home and scorer only). This spec is therefore written from the app's existing design language (Home, Team overview, Tournament screens) and the WORKLOG screen list. Assumed numbering from the old TODO: **05 Profile**, **34 Edit profile**, **37 Settings**. If a real mock turns up, it wins over this spec.

## Scope

| Screen | Route | Type |
| --- | --- | --- |
| Profile | `/(tabs)/profile` (replaces the placeholder) | tab |
| Edit profile | `/profile/edit` | full screen |
| Settings | `/settings` | full screen |

Out of scope: viewing *other* players' profiles (`/player/[id]`, separate task, reuses the same sections), notifications screen, follow/friends, achievements, phone verification.

## Design rules (match the rest of the app)

- Theme tokens only (`Palette`, `spacing`, `sizes`, `radius`). No hex in screens. Works in light and dark.
- Gutter `sizes.gutter` (20), section gap `sizes.sectionGap` (30). Headings: title case, 20px bold, no italic, via `SectionHeader`.
- Cards: `colors.surface`, `radius.lg` (20) for big cards, `radius.md` (12) for rows and tiles, 1px `colors.border`.
- Icons: per-icon lucide imports (`lucide-react-native/icons/<name>`), size `sizes.icon`.
- Touch targets 48dp minimum. Every icon-only button has `accessibilityLabel`. Screen titles use `accessibilityRole="header"`.
- Placeholders that have no backend yet use `comingSoon()` from `src/lib/coming-soon.ts`.

## 1. Profile tab

```
┌──────────────────────────────┐
│ Profile                  ⚙  │  top bar: title left, settings icon tile right
│                              │
│          ( AB )              │  InitialsAvatar 96, circle, blue tone
│        Abir Zayn             │  title 28/700
│  All-rounder · Chittagong    │  muted caption
│      [ Edit profile ]        │  Button secondary, compact, centred
│                              │
│ ┌────┬────┬────┬────┐        │  stat strip: Matches | Runs | Wickets | Teams
│ │ 24 │612 │ 18 │ 2  │        │  value 20/700, label caption muted
│ └────┴────┴────┴────┘        │
│                              │
│ Playing style                │  SectionHeader
│ (Right-hand bat) (Off spin)  │  AppBadge pills: batting, bowling, role
│                              │
│ Career        [Bat | Bowl]   │  SectionHeader + SegmentedControl
│ ┌──────────┬──────────┐      │  2-col stat grid (see below)
│ │ Innings  │ Average  │      │
│ ...                          │
│                              │
│ My teams            See all  │  reuse Home "Your Teams" row
│ ▢ HSF  ▢ AGT                 │
│                              │
│ Recent performances          │  3 rows, hairline separated (like Next Games)
│ 45 (32) vs Titans  · 2d ago  │  bat figure, bowl figure, result chip W/L
│                              │
│ ┌ Settings                ›┐ │  list rows in one rounded card
│ └ Notifications           ›┘ │  (coming soon toast)
│                              │
│ [ Log out ]                  │  Button secondary, danger text
└──────────────────────────────┘
```

Rules:
- Scroll: whole screen scrolls, top bar stays pinned. Bottom padding clears the floating tab bar (use the same inset Home uses).
- Avatar: `InitialsAvatar` with `uri` when uploaded, else initials from `lib/initials.ts`. No camera badge here; changing the photo lives in Edit profile.
- Stat strip: four equal tiles, one card divided by hairlines (same look as the Team overview record strip).
- Career grid, **Bat**: Matches, Innings, Runs, Highest, Average, Strike rate, 50s, 100s. **Bowl**: Matches, Overs, Wickets, Best, Economy, Average, 3W, 5W. Value 20/700, label caption muted. Not-out highest shows `*` (e.g. `78*`).
- Recent performances: reuse the row layout of `UpcomingMatchTile` (flat rows split by hairlines). Left: date block. Middle: `45 (32)` and `2/24 (4)` figures, opponent muted. Right: `AppBadge` W or L.
- "Log out" moves from the placeholder to the foot of Settings **and** stays here as the last element for now (one tap, no confirm; keep existing `signOut()` + in-flight guard).
- Empty states: no matches → stat strip shows `0`, Career card replaced by a single card "No matches yet. Join a team to start building your record." with a `Button` "Find a team" (→ `/search`). No teams → "My teams" shows the dashed "Join a team" circle from Home.

## 2. Edit profile

```
┌──────────────────────────────┐
│ ‹   Edit profile      [Save] │  back tile left, Save ghost button right (disabled until dirty+valid)
│                              │
│          ( AB )              │  avatar 96
│       Change photo           │  link-coloured text button
│                              │
│ Full name                    │  TextField
│ Area                         │  TextField (optional)
│ District                     │  TextField (optional)
│ Phone number                 │  TextField, phone keypad (optional)
│ National ID number           │  TextField, number keypad (optional), "Private" helper
│ Email                        │  TextField disabled, muted, helper "Change in Settings"
│                              │
│ Blood group                  │  chips A+ A- B+ B- AB+ AB- O+ O-, tap again to clear
│ Playing role                 │  2x2 PlayingRoleOption cards: Batsman | Bowler | Keeper | All-rounder
│ Batting style                │  SegmentedControl: Right-hand | Left-hand
└──────────────────────────────┘
```

Rules:
- Validation (zod, same pattern as login/sign-up): name 2 to 40 chars trimmed, area and district 0 to 40, phone and National ID optional (see Changes below). Inline error under the field on blur and on Save.
- Save: ghost button in header; shows loading; double-tap guarded with a ref like `logOut()`. On success `router.back()` and the Profile tab shows the new values. On failure inline banner above the form (`accessibilityLiveRegion="polite"`, danger colour), form stays editable.
- Leaving with unsaved changes: back asks "Discard changes?" (native `Alert`, Discard / Keep editing). No prompt when nothing changed.
- Photo: `expo-image-picker` (install with `npx expo install expo-image-picker`, library only, square crop, quality 0.7, no camera permission needed). Preview immediately; upload to Supabase Storage is a later backend task, so for now it only lives in provider state.
- Keyboard: `KeyboardAvoidingView` + `ScrollView keyboardShouldPersistTaps="handled"`; fields use `returnKeyType="next"` and the last one `done`.

## 3. Settings

```
┌──────────────────────────────┐
│ ‹   Settings                 │
│                              │
│ Account                      │  group card, rows separated by hairlines
│  Email           a@b.com     │  read only
│  Change password          ›  │  coming soon
│                              │
│ Preferences                  │
│  Appearance                  │  existing AppearancePicker inline (System | Light | Dark)
│  Notifications            ›  │  coming soon
│                              │
│ Legal                        │
│  Terms and Conditions     ›  │  → /terms
│  Privacy Policy           ›  │  → /privacy  (built by the parallel task, see below)
│                              │
│ About                        │
│  Version              1.0.0  │  expo-constants nativeApplicationVersion
│                              │
│ [ Log out ]                  │
│                              │
│ Delete account               │  text button, dangerSoftText, centred, small
└──────────────────────────────┘
```

Rules:
- New shared `SettingsGroup` + `SettingsRow` in `src/components/ui` (label left, optional value or chevron right, optional `onPress`). Row height 56.
- **Delete account** is mandatory for Google Play (in-app deletion path). Tap opens a confirm sheet: title "Delete your account?", body "This permanently removes your profile and cannot be undone.", buttons `Delete account` (danger) and `Cancel`. Backend is not built: the confirm action shows `comingSoon()` for now. Real deletion needs a Supabase Edge Function with the service role key; track it in WORKLOG open items.
- Appearance picker moves here from the Profile tab (delete it from `profile.tsx`).

## Data and types

New `src/types/profile.ts`:

Types live in `src/types/profile.ts` (see the file for the current shape):

```ts
export type PlayingRole = 'batter' | 'bowler' | 'all-rounder' | 'keeper';
export type BattingStyle = 'right' | 'left';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type PlayerProfile = {
  id: string;
  fullName: string;
  area?: string;
  district?: string;
  bloodGroup?: BloodGroup;
  phone?: string;
  nationalId?: string;
  role: PlayingRole;
  battingStyle: BattingStyle;
  avatarUri?: string;
};
// BattingStats, BowlingStats, Performance and ProfileData: see src/types/profile.ts.
```

Sample data in `src/features/profile/sample-data.ts` until Supabase has a `profiles` table. Edits go through `ProfileProvider` (context, in-memory) so Profile and Edit stay in sync; swap `saveProfile` for a Supabase upsert later without touching screens.

Supabase (later, not part of the build): `profiles(id uuid pk references auth.users, full_name, area, district, blood_group, phone, national_id, role, batting_style, avatar_path, updated_at)` with RLS: select for authenticated, insert/update only where `id = auth.uid()`. `national_id` and `phone` need stricter access: owner only, not readable by other users.

## File layout

```
src/app/(tabs)/profile.tsx            thin: <ProfileScreen />
src/app/profile/edit.tsx              thin: <EditProfileScreen />
src/app/settings.tsx                  thin: <SettingsScreen />
src/features/profile/
  profile-screen.tsx                  composes sections
  edit-profile-screen.tsx
  settings-screen.tsx
  profile-provider.tsx
  profile-schema.ts                   zod (+ test)
  labels.ts
  sample-data.ts
  components/
    playing-role-option.tsx           icon + label, static or radio
    screen-header.tsx
  sections/
    profile-header.tsx
    stat-strip.tsx
    playing-style.tsx
    personal-info.tsx
    career-stats.tsx
    recent-performances.tsx
src/components/ui/settings-group.tsx, settings-row.tsx
src/lib/mask-id.ts
src/types/profile.ts
```

"Your Teams" on Profile reuses Home's `ContractedTeams`. `profile/edit` and `settings` are registered inside the `session` guard in `src/app/_layout.tsx`.

## Acceptance criteria

- Profile tab shows header, stat strip, playing style, personal info, career (bat/bowl toggle), teams, recent performances, links, log out; no placeholder text left.
- Edit saves, validates, guards unsaved changes; Profile reflects the change instantly.
- Settings holds Appearance picker (removed from Profile), Terms, Privacy, version, log out, delete-account confirm.
- Light and dark both checked; no hard-coded colours; targets 48dp+ where practical; screen reader labels on icon buttons.
- Lint, typecheck and tests clean.

## Open questions for the owner

1. Real design mock exists for 05 / 34 / 37? If yes, drop it in `design/profile/` and this spec is adjusted.
2. Phone and National ID are now included (Edit profile fields, Personal Info section, NID masked). Date of birth still left out.
3. Should Log out stay on the Profile tab, or live only in Settings? Spec keeps both for now.

## Changes since the first draft

- **Playing role** is four icon + label cards (`PlayingRoleOption`, icons in `assets/logo`, labels Batsman / Bowler / Keeper / All-rounder), not a segmented control.
- **Phone number** and **National ID** added (both optional). Phone: Bangladeshi mobile, `+88` allowed. NID: 10, 13 or 17 digits. Profile shows the NID masked to the last 4 digits. The NID is sensitive: owner-only RLS when the backend lands, consider encryption, never log it.
- **Bowling style removed** (field, chips, pill, schema, sample data). Career bowling stats stay.
- **City replaced by Area and District** (two optional text fields). Profile header meta reads "Role · Area, District".
- **Blood group** added: optional single-select chips (A+, A-, B+, B-, AB+, AB-, O+, O-); tap the selected chip again to clear. Shown on Profile under Personal Info.
- Profile **Personal Info** section: Email, Phone, Blood group, Area, District, National ID (masked), with an Edit link.
