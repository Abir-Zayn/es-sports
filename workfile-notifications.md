# Centralized Notifications & Squad Alerts Center Specification

> **Target Agent:** Codex  
> **Status:** Ready for Implementation  
> **Boundary / Scope:** Dedicated to `src/features/notifications/` and `src/app/notifications.tsx`. No overlap with Claude's friendly match work.

---

## 1. Executive Summary & Purpose

Currently in `esSports`, tapping the Bell icon on the Home screen redirects directly to `/invitations`. With the rollout of team ownership invitations, mid-tournament squad freeze alerts, and match updates, the app needs a **Centralized Notifications & Squad Alerts Center**.

This center will aggregate:
1. **Squad Alerts:** High-priority alerts notifying Tournament Owners and Moderators when a Team Owner removes or replaces a player mid-tournament (anti-ringer / anti-khyapa guard).
2. **Team & Player Invites:** Invitations to become Team Owner or join a squad with inline `Accept` and `Decline` actions.
3. **Match & Tournament Updates:** Live match commencement, toss results, and final outcomes.
4. **Tabbed Filtering:** Instant switching between `All`, `Invites`, `Squad Alerts`, and `Match Updates`.

---

## 2. System Architecture & Data Contracts

### 2.1 Notification Types & Schema
Located in `src/features/notifications/types.ts`:

```typescript
export type NotificationKind = 'squad_alert' | 'invite' | 'match_update' | 'system';

export type NotificationFilterTab = 'all' | 'invites' | 'squad_alerts' | 'match_updates';

export type SquadAlertMeta = {
  tournamentId: string;
  tournamentName: string;
  teamId: string;
  teamName: string;
  playerName: string;
  action: 'removed' | 'added' | 'replaced';
  reason?: string;
  performedByName: string;
};

export type InviteMeta = {
  invitationId: string;
  invitationKind: 'team-owner' | 'player-squad';
  tournamentName: string;
  teamName?: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'declined';
};

export type MatchUpdateMeta = {
  matchId: string;
  matchLabel: string;
  headline: string;
  status: 'toss' | 'live' | 'completed';
};

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  sentLabel: string;            // e.g. "5m ago", "1h ago", "Yesterday"
  isRead: boolean;
  meta: {
    squadAlert?: SquadAlertMeta;
    invite?: InviteMeta;
    matchUpdate?: MatchUpdateMeta;
  };
};
```

---

## 3. UI & Component Structure

### 3.1 Screen Layout (`/notifications`)
* **Route:** `src/app/notifications.tsx`
* **Root Component:** `src/features/notifications/notifications-screen.tsx`
* **Features:**
  1. **Header Bar:**
     - Back navigation button (returns to previous screen or `/home`).
     - Title: "Notifications".
     - Right action: "Mark all as read" button.
     - Unread count pill badge (e.g. "3 unread").
  2. **Filter Tabs:**
     - Horizontal tab row using `AppTabs` or custom pills:
       - `All` (all notifications)
       - `Invites` (filtered to `kind === 'invite'`)
       - `Squad Alerts` (filtered to `kind === 'squad_alert'`)
       - `Match Updates` (filtered to `kind === 'match_update'`)
  3. **Notification List:**
     - Rendered via list / scroll container.
     - Each card specialized by `kind`:
       - **Squad Alert Card:** Red/Orange warning accent, shield/alert icon, displays *"Halishahar Strikers removed Liton Roy during active tournament"*, reason, and link to inspect tournament desk.
       - **Invite Action Card:** User/Team avatar, invitation text, and inline `[ Accept ]` and `[ Decline ]` buttons.
       - **Match Update Card:** Cricket icon/badge, match status (e.g. *"Toss Won by Kings"*, *"Strikers won by 18 runs"*), tapping opens the match.
  4. **Empty State:**
     - Displayed when no notifications match the active filter tab.

---

## 4. File Structure & Responsibilities

```
src/
├── app/
│   └── notifications.tsx              # Expo Router page exporting NotificationsScreen
├── features/
│   └── notifications/
│       ├── types.ts                   # Core data models and tab definitions
│       ├── sample-notifications.ts    # Rich sample data (Squad Alerts, Invites, Match Updates)
│       ├── notifications-store.ts     # In-memory reactive store (mark read, accept/decline)
│       ├── use-notifications.ts       # Hook for list state, unread counts, and actions
│       ├── notifications-screen.tsx   # Main screen component (<= 200 lines)
│       ├── components/
│       │   ├── notification-tabs.tsx  # Horizontal filter tabs
│       │   ├── squad-alert-card.tsx   # Mid-tournament kick warning card
│       │   ├── invite-card.tsx        # Card with Accept / Decline actions
│       │   └── match-update-card.tsx  # Match event notification card
│       └── __tests__/
│           └── notifications-screen.test.tsx # Full unit and interaction test suite
```

### Routing Wiring
* Update [home-screen.tsx](file:///c:/office-work/esSports/src/features/home/home-screen.tsx):
  Change `onNotifications={() => router.push('/invitations')}` to `onNotifications={() => router.push('/notifications')}`.
* Keep `/invitations` intact for direct link compatibility.

---

## 5. Quality & Engineering Standards (MANDATORY)

Codex must strictly adhere to the project's quality rules defined in `memory.md` and `CLAUDE.md`:
1. **File Length Limit:**
   - Every handwritten file must be `<= 200 lines` (Hard limit `270 lines`). Split components by domain responsibility.
2. **Zero-Crash Render Safety:**
   - NEVER render raw text or numbers outside React Native `<Text>` components (avoid `{count && <Component />}` which crashes if count is `0`). Use `{count > 0 ? <Component /> : null}` or `{Boolean(count) && ...}`.
   - Guard optional nested fields with defensive chaining (`?.`) and nullish coalescing (`?? ''`).
3. **Strict TypeScript:**
   - Strict types enabled. No `any`, no `@ts-ignore`.
4. **Verification Gates Before Completion:**
   - `npx tsc --noEmit` &rarr; Must PASS with 0 errors.
   - `npx expo lint` &rarr; Must PASS with 0 warnings/errors.
   - `npx jest src/features/notifications` &rarr; All tests must PASS.
   - `graphify update .` &rarr; Rebuild graph.

---

## 6. Phased Implementation Roadmap for Codex

- [ ] **Phase 1: Types & In-Memory Store**
  - Create `src/features/notifications/types.ts` with notification kinds and filter tabs.
  - Create `src/features/notifications/sample-notifications.ts` with realistic alerts (Squad kick alert, Team Owner invite, Match toss update).
  - Create `src/features/notifications/notifications-store.ts` supporting read status toggles and invite acceptance.

- [ ] **Phase 2: Notification Cards by Kind**
  - Build `squad-alert-card.tsx` with alert badge and tournament context.
  - Build `invite-card.tsx` with inline `Accept` and `Decline` pressables.
  - Build `match-update-card.tsx` with score/toss summary.

- [ ] **Phase 3: Screen & Filter Tabs**
  - Build `notification-tabs.tsx` (`All`, `Invites`, `Squad Alerts`, `Match Updates`).
  - Build `notifications-screen.tsx` integrating header, tabs, list, and "Mark all as read".
  - Create route at `src/app/notifications.tsx`.

- [ ] **Phase 4: Navigation Integration & Wiring**
  - Wire Home screen Bell icon in `src/features/home/home-screen.tsx` to navigate to `/notifications`.
  - Ensure unread badge count updates dynamically.

- [ ] **Phase 5: Automated Testing & Verification**
  - Write test suite in `src/features/notifications/__tests__/notifications-screen.test.tsx`.
  - Validate filter tab switching, mark all as read, and inline invite actions.
  - Run `npx tsc --noEmit`, `npx expo lint`, and `graphify update .`.

