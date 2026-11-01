# Step 11: teams backend

Roadmap step 11 (Phase D). Branch: `feat/teams-backend`, from `main` at `7989ede`. Started while the owner was away. Not pushed, not applied.

This is the first step toward tournaments: tournament registration (step 15) needs real teams with an owner and admins, and team invitations (step 13) need members.

## Decisions taken (please confirm or change)

These follow the roadmap's step 11 line. None of them is in the open-decisions table, so I chose defaults. Each is cheap to change before the migration is applied.

| # | Decision | Default chosen |
| --- | --- | --- |
| D1 | Roles | `owner` (exactly one), `admin`, `player`, `staff`. A captain flag is separate: at most one, never staff. |
| D2 | Who creates a team | Any signed-in user. The creator becomes the owner. |
| D3 | Who edits the team | The owner and admins edit the name, short name, colour, logo and area. Only the owner deletes the team. |
| D4 | Role changes | Only the owner. The owner hands over ownership with a transfer and then becomes an admin. |
| D5 | Removing and leaving | Anyone except the owner can leave. The owner removes anyone. An admin removes players and staff. |
| D6 | Captain | Chosen by the owner or an admin. |
| D7 | Joining | Only by invitation (step 13). Until then a team has only its owner. There is no "add member" without consent. |
| D8 | Guest players | Not members, because they have no account. They stay in each match's squad (`match_players`). |
| D9 | Several teams | An account can belong to any number of teams. The per-tournament rule is step 15's open decision. |
| D10 | Names | Not unique: many clubs are called "Strikers". The short name is 2 to 4 letters or digits, stored in upper case. |
| D11 | Logo | `logo_url` (https), uploaded to the uploader's own folder in the existing `avatars` bucket, as the friendly team images are. No new bucket. |

## What was built (Job 1, Opus)

**Migration `supabase/migrations/20261102000000_teams.sql`:**
- Tables:
  - `teams` with checks on name, short name, tone, logo and area;
  - `team_members` with primary key `(team_id, profile_id)`;
  - partial unique indexes for one owner and one captain per team.
- Functions, all security definer with `search_path` pinned:
  - `create_team(id, name, short_name, tone, logo_url, area, district)`: idempotent on the client id, like `create_friendly_match`, so a retry after a lost reply is safe;
  - `set_team_member_role`;
  - `set_team_captain`;
  - `transfer_team_ownership`;
  - `remove_team_member`, which covers both leaving and removing;
  - `team_role(team)`: the caller's role, used by the row level security policies.
- Every member change locks the team row first, so two transfers or removals on one team run one after the other.
- Grants and row level security:
  - any signed-in user reads both tables;
  - direct inserts are revoked, and so are direct member writes;
  - a team update is limited to the listed columns, by the owner or an admin;
  - a team delete is by the owner only.
- Error codes: `42501` not allowed, `22023` invalid, `P0002` not found, `23505` id used by another account.

**Verification `supabase/tests/teams.sql`.** It rolls itself back and covers:
- grants;
- create, repeat and a reused id;
- invalid details;
- direct inserts refused;
- role changes;
- the captain rules;
- remove and leave;
- ownership transfer;
- column-limited updates;
- the delete cascade;
- a signed-out caller.

**Not done yet:**
- **Owner account deletion (step 22)** must transfer or delete owned teams first. Until then, deleting the owner's profile leaves a team without an owner.
- **Team matches.** Teams are not linked to `matches`; tournament fixtures (step 16) add that link.

## Verification

- SQL: NOT RUN. There is no local database (Docker is not running). The owner runs `supabase/tests/teams.sql` after applying the migration.
- App: no app code changed, so typecheck, lint and Jest are unaffected by this branch.

## Next jobs

### Job 2: app data layer and create-team (Sonnet 5.5, M)

**Depends on:** the migration applied, and types regenerated from Git Bash.

```text
ROLE: Implement the app side of step 11 in esSports (Expo SDK 58, TanStack Query, Supabase).
SPEC: docs/tasks/step-11-teams-backend.md and supabase/migrations/20261102000000_teams.sql.
BUILD
1. src/features/team/data/team-repository.ts: createTeam (client uuid, calls create_team), fetchTeam,
   fetchTeamMembers (join profiles for name and avatar), fetchMyTeams, updateTeam, setMemberRole,
   setCaptain, transferOwnership, removeMember / leaveTeam. Map Postgres codes to friendly errors.
2. A create-team screen (name, short name, colour, logo via the existing image picker into
   avatars/<uid>/team/<team id>/), reachable from the teams entry point.
3. The team overview and members tabs read the real team when the route id is a uuid. Keep the
   sample only for the sample ids, and never show the sample in place of a real team (same rule as step 5).
4. Jest tests for the repository and the screens. Files <= 200 lines. Zero-crash render rules.
DONE WHEN: pnpm typecheck, pnpm lint (0 warnings) and pnpm test pass; report PASS | FAIL | NOT RUN.
```

### Job 3: review (GPT 6.1)

```text
ROLE: Independent reviewer for step 11 of esSports. One review round, plus one re-check of fixes.
TARGET: git diff origin/main...origin/feat/teams-backend
SPEC: docs/tasks/step-11-teams-backend.md (decisions D1-D11)
CHECK
1. Can anyone gain a role they should not have: an admin promoting themselves or others, a non-member
   writing, two owners after concurrent transfers, a removed owner?
2. Security definer functions: auth check before any write, search_path pinned, team row locked
   before reading roles, no dynamic SQL, grants to authenticated only.
3. RLS and grants: are direct inserts and member writes really revoked? Is the update limited to
   the listed columns? Can created_by or the id be changed?
4. Idempotency of create_team under a retry and under two concurrent calls with one id.
5. Do the checks (names, short name, tone, logo https, captain not staff) hold on every write path?
6. Does supabase/tests/teams.sql cover each rule and leave nothing behind?
OUTPUT: `path:line — severity (blocker/major/minor) — problem — fix`; mark residual risks "accept";
end with Approve or Changes needed. Minors alone do not block; they go to the roadmap's deferred list.
```

## Owner's steps

1. Confirm or change decisions D1 to D11.
2. Run Job 3 (review) before applying the migration. Changes are cheaper before `db push`.
3. `npx supabase db push --include-all`, then paste **`supabase/tests/teams.sql`** (the SQL file, not this brief) into the SQL editor.
4. Regenerate the types from Git Bash, then Job 2.
