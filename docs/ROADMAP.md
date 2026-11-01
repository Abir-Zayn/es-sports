# esSports roadmap

Snapshot taken 2026-10-31 on branch `feat/durable-scoring-outbox` (`139fecf`). Sources: `graphify-out/GRAPH_REPORT.md` (built from `d4a8d47`), `supabase/migrations/`, `src/app/` routes, the `sample-*` imports in `src/features/`, and `NEXT_WORK.md`.

## 1. Done so far

### Backend: what is really in Supabase (5 migrations)

| Migration | Adds |
| --- | --- |
| `20261028000000_profiles` | `profiles`, `profile_private`, sign-up trigger `handle_new_user`, `avatars` bucket with owner-only policies |
| `20261029181703_matches` | `matches`, `match_players`, `match_scorers`, `ball_events`, `can_score_match()`, `void_events_from()`, RLS |
| `20261029181705_player_career_stats` | `player_match_figures` view and career totals derived from `ball_events` |
| `20261029192151_match_team_images` | Team image paths for friendlies (in `avatars/<user>/friendly/<match>/`) |
| `20261029194934_friendly_exclusive_scorer` | One scorer per friendly (`friendly_single_scorer` trigger) |

There are **no tables yet** for tournaments, teams, team members, invitations, squads, fixtures or notifications.

### App: real vs. sample data

| Area | State |
| --- | --- |
| Auth (email, Google, password reset, sessions) | **Real** (Supabase Auth) |
| Profile, edit profile, avatar upload | **Real** (`profiles`, `avatars`) |
| Friendly setup, player search, team images, saved friendlies | **Real** |
| Scorer (pad, shot, wicket, over, result, undo) | **Real**, with a durable per-account outbox |
| Career rollup after a match | **Real** (server views) |
| Spectator match screens (live, scorecard, overs, wagon, info) | **Mixed**: screens import `sample-match` / `sample-info` |
| Player profile `/player/[id]` | **Sample** (`sample-players`) |
| Home, search | **Sample** (`home/sample-data`, `search/sample-data`) |
| Matches tab (upcoming) | **Sample** (`sample-upcoming`) |
| Team screens (overview, squad, members, matches) | **Sample** (`sample-team`) |
| Tournament create, add teams, schedule | Local only (`draft-storage` in SecureStore) |
| Tournament overview, table, stats, teams, knockout, head-to-head | **Sample** |
| Roster, invitations, claim link | **Sample** (`roster-store`, `sample-rosters`) |
| Notifications | **Sample** (`sample-notifications`) |
| Settings: change password, notifications, delete account | `comingSoon` stubs |

### Release

- APK `v1.0.0-preview.2` with OTA updates on the `preview` channel (runtime `1.0.0`).
- PR #5 (friendly scorer + outbox into `main`) is merged; all five local and remote migration versions now agree.
- PR #7 (fix for issue #6) is merged as `b68e7ec` and published as an OTA update on `preview`. Issue #6 is closed.

## Current status (2026-11-01 at 7989ede)

**Where we are:** Steps 1–5 merged (PRs #5–#12). Step 6 (scorer handover) is in progress. `main` is at `7989ede`.

**Current state**
- Steps 1–5 merged into `main` across PRs #5–#12.
- Step 6 in progress; spec in [step-6-scorer-handover.md](tasks/step-6-scorer-handover.md).
- Migrations through `20261101030000` (including `scorer_handover`) are applied remotely; local and remote histories match.
- Device testing: rows 4–7 verified on PLR110; rows 8–15 pending.

**Next steps**
1. Finish step 6: review of the UI, GPT 6.1 Terra review of the migration, then merge.
2. Run the manual two-session lock check described in `supabase/tests/scorer_handover.sql`.
3. Complete device testing (rows 8, 9, 13–15 on two phones).

**Deferred or open**
- Two-phone device tests (rows 8, 9, 13–15) and low-end phone check.
- Plain wording for server errors (`23503`, `42501`) in unsent notice.
- Spectator polling connection status observability (step 5 review, minor).

## Model routing

Every task brief names the model for each part, sized by workload.

| Size | Signals | Model |
| --- | --- | --- |
| **L** (hard) | Migrations, RLS, RPCs, concurrency or ordering, offline sync, security, cross-feature design | **Claude Opus 5.5** builds it |
| **M** (standard) | Screen wiring, swapping sample data for queries, hooks, Jest tests, refactors within one feature | **Claude Sonnet 5.5** |
| **S** (light) | Docs, test logs, status updates, mechanical renames, deleting unused `sample-*` files | **Gemini Flash 3.8** |
| Review | Independent second opinion on every L task and any risky M task, before merge | **GPT 6.1** (a different model family catches different mistakes) |

Device tests and Supabase dashboard or account actions stay with you.

## 2. Why it feels scattered

The UI was built screen by screen for the whole product, but the backend only covers profiles and friendly matches. About two thirds of the screens still run on sample data. The plan below builds the backend in dependency order (player → team → tournament → fixtures → stats) and swaps each group of screens onto it before starting the next.

## 3. Feature plan, in order

Each step ends with migrations plus rolled-back SQL checks, `pnpm typecheck`, `pnpm lint`, the affected Jest suites, and the memory.md §11 report. Do not start a step until the one before is merged.

### Phase A: stabilise what exists

1. **Merge PR #5 and repair migration history.** Done: PR #5 is merged and `supabase migration list` shows all five versions locally and remotely. (NEXT_WORK item 1)
2. **Device test the preview APK.** Run the 12-row checklist and record it in `docs/device-test-log.md`. (NEXT_WORK item 2) In progress: rows 4–7 pass on one phone (row 7 after the issue #6 fix); rows 8 and 9 not run; rows 10–12 partly checked; low-end performance deferred.

### Phase B: finish friendly scoring

3. **Atomic friendly creation.** RPC `create_friendly_match(match, players, scorer)`, idempotent, with orphan image cleanup. (NEXT_WORK item 3)
4. **Server-side write ordering guard.** `expected_tail` check on ball writes, void, result and reopen; conflicts surface as `OutboxConflictError`. (NEXT_WORK item 4)
5. **Spectator screens on real data.** Replace `sample-match` / `sample-info` in the five match tabs with queries on `matches` + `ball_events`, plus one Realtime channel per open match.
6. **Scorer handover.** In progress. Spec and decisions in [step-6-scorer-handover.md](tasks/step-6-scorer-handover.md). (NEXT_WORK item 5)
7. **Open and score a match offline.** Local snapshot per match; decide JSON files (OTA) or `expo-sqlite` (new APK). (NEXT_WORK item 6)

### Phase C: players and discovery

8. **Player profile on real data.** `/player/[id]` reads `profiles` + career views; guest players show match-only figures.
9. **Matches tab on real data.** Live, upcoming and recent from `matches`, filtered to the user's matches and followed ones.
10. **Search on real data.** Players from `profiles`; teams and tournaments added as each table lands (steps 11 and 14).

### Phase D: teams

11. **Teams backend.** Tables `teams`, `team_members` (role: owner, captain, player, staff), team logo in storage, RLS by membership.
12. **Team screens on real data.** Overview, squad, members, matches; create team; edit Playing XI; substitutes.
13. **Team invitations.** `team_invitations` table, invite by search or share link, accept/decline, wired to `/invitations` and `/claim/[token]`.

### Phase E: tournaments

14. **Tournament backend.** `tournaments` (organiser, format, overs, dates, cover image) and `tournament_staff`; move create and draft from SecureStore to the server.
15. **Team registration and squads.** `tournament_teams`, `tournament_squads`, registration requests, roster lock date. Replaces `roster-store` and `sample-rosters`.
16. **Fixtures and schedule.** `fixtures` rows linked to `matches` (`tournament_id`, round, venue, time); schedule builder saves to the server; the scorer is assigned per fixture.
17. **Tournament match scoring.** Start a fixture's match from its squads (reuses the friendly scorer and the step 4 guard); the result updates the fixture.
18. **Points table, stats, knockout.** Server views for standings (points, NRR), leaderboards and bracket progress; replace `sample-table` and `sample-stats`; head-to-head from completed matches.
19. **Tournament overview, follow and home.** Overview, favourite or follow, and the home feed (live, upcoming, my teams, tournaments to follow) built from the tables above. Removes `home/sample-data`.

### Phase F: notifications and account

20. **Notifications backend.** `notifications` table written by triggers (invitation, registration, match start, result, scorer handover); replace `sample-notifications`; unread badge.
21. **Push notifications.** `expo-notifications` and a device token table; an Edge Function sends the push. Native module, so it needs a new APK.
22. **Settings gaps.** Change password, notification preferences, and **account deletion** via an Edge Function using the service role (Google Play requires it).

### Phase G: platform and launch

23. **Multi-tenant scope.** An organisation or league tenant (HSF Premier League pilot) with tenant-scoped RLS on tournaments and teams, and an admin role.
24. **Auction** (listed in the README structure). Player pool, bids and budgets per tournament. Confirm it is still in scope before building it.
25. **Play Store release.** Production EAS profile, privacy policy and data safety form, store listing, a production Supabase project with SMTP and email confirmation, crash reporting.

## 4. Open decisions

| Decision | Needed before step |
| --- | --- |
| Who can start a scorer handover, and the timeout | Decided ([spec](tasks/step-6-scorer-handover.md)) |
| Offline storage: JSON files (OTA) or `expo-sqlite` (new APK) | 7 |
| Can a player belong to several teams in one tournament? | 15 |
| Points rules (tie, no result, NRR) and knockout formats | 18 |
| Is auction in the pilot? | 24 |

## 5. Housekeeping

- Rebuild the graph after merging (`graphify update .`). The current graph is from `d4a8d47` and also indexes skill and docs folders, so the code communities are noisy. Excluding `.agents/`, `.claude/` and `.codex/` would make it cleaner.
- Delete each `sample-*.ts` file once nothing imports it. That makes progress visible: when no `sample-*` imports are left, the app runs fully on real data.
- The `workfile-*.md` files and `NEXT_WORK.md` overlap with this roadmap. Keep this file as the single ordered list and link the workfiles from their steps.
