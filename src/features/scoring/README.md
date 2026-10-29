# Scorer UI preview

The six screens follow the uploaded references in `design/scorer/`:

| Reference | Route beneath `/scorer/[id]` |
| --- | --- |
| 25 Match setup | `/` |
| 26 Ball entry pad | `/pad` |
| 26b Shot direction | `/shot` |
| 27 Wicket sheet | `/wicket` |
| 28 End of over | `/over` |
| 29 Stream overlay | `/overlay` |

Open **Match → Info → Scorer panel · preview**. Setup starts a new first innings at 0/0; **Try the reference match** opens the 142/4 sample chase.

Screen files compose smaller components and stay below 200 lines. Routes only export screens, and the scorer layout owns the session provider. No new native dependencies were added.

`engine/` contains pure scoring functions. The session reducer keeps immutable undo snapshots, delivery IDs, shot directions, and audit references. It prevents duplicate events, protects completed overs/innings, and enforces the T20 bowler quota. Tests cover extras, strike changes, wickets, free hits, chase completion, idempotency, and undo.

## Saving matches

Migration `supabase/migrations/20261029000000_matches.sql` adds `matches`, `match_players`, `match_scorers` and the append-only `ball_events` log. `matches.tournament_id` is nullable (no tournaments table yet, so no foreign key). Teams and players are a per-match snapshot. Anyone signed in can read; only the creator and assigned scorers can write (`can_score_match`).

How it fits together (all under `data/`):

- The reducer records every accepted change in `audit`. `use-match-sync.ts` follows that trail and turns each entry into one write (`event-rows.ts`). The first innings creates the match row and squads; every ball, bowler choice and strike swap becomes a `ball_events` row; a chosen shot direction updates `angle`.
- Writes go through one ordered queue (`sync-queue.ts`) with bounded retries. Event ids are made on the device and inserts ignore duplicates, so a retry cannot count a ball twice. The pad shows Saved / Saving / Not saved (tap to retry).
- Undo never deletes. `void_events_from` sets `voided_at` on the ball and on anything after it (a bowler chosen after the last ball of an over).
- Opening a scorer route loads the match and replays the events that are not voided through the same reducer (`replay.ts`), so a closed or crashed app resumes exactly. A route id that is a uuid opens that match. Any other id is a fixture reference: it resumes the newest live match you scored from that fixture, otherwise a new one starts.
- When the chase ends, `match-result.ts` works out the winner, margin and summary and writes them with both team totals. Undoing that last ball puts the match back to live and clears the result. Level scores are a tie; super overs are not scored.
- "Try the reference match" is a local demo and is never saved.

Friendly matches (`/match/friendly/setup`) hand the scorer a ready setup (`data/staged-setups.ts`): real teams, side size, toss, and an assigned scorer written to `match_scorers`. The engine works for 2 to 16 a side (all out at side size - 1).

Not done yet: spectator screens reading live data, offline storage (unsent balls live in memory, so closing the app while offline loses them), and a tournaments table. Hosted overlay links, automatic stream animations and advanced scoring cases also remain. The overlay Copy button is disabled until a real hosted link exists.

The panel supports the displayed dismissal choices on legal balls. A dismissal combined with a wide/no-ball, no-ball byes, penalty runs, retirements, DLS, and exceptional dismissals need additional entry flows before production use.
