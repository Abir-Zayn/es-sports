import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { tournamentErrorText } from '../data/tournament-errors';
import { generatePairings, pairingProblem } from './generate';
import { cancelPublishedMatch, fetchSchedule, movePublishedMatch, publishSchedule, ScheduleError } from './schedule-repository';
import { byKickoff, moveProblem, placeMatches } from './slots';
import type { Competition, Schedule, ScheduledMatch, ScheduleMode, ScheduleTeam, SlotSettings, StageName } from './types';

export const scheduleKey = (tournamentId: string) => ['tournament-schedule', tournamentId] as const;
const DEFAULT_SETTINGS: SlotSettings = { perDay: 2, firstStartMin: 9 * 60 };
const stageRound: Record<StageName, number> = { League: 0, 'Round of 16': 1, 'Quarter-final': 2, 'Semi-final': 3, Final: 4 };

type Input = {
  tournamentId: string;
  teams: ScheduleTeam[];
  competition: Competition;
  /** Overs per side; decides how long each match keeps the ground. */
  overs: number;
  days: string[];
  isOwner: boolean;
};

/** A match the owner adds by hand. */
export type NewMatch = { home: ScheduleTeam; away: ScheduleTeam; stage: StageName; date: string; startMin: number };

const messageOf = (error: unknown) => (error instanceof ScheduleError ? error.message : tournamentErrorText(error));
const playsIn = (m: ScheduledMatch, teamId: string) => [m.home, m.away].some((s) => s.kind === 'team' && s.team.id === teamId);

/**
 * The schedule being made. Before publishing, drawing, adding and moving change a local copy, so teams see nothing
 * until the owner decides. Once published and unchanged, the owner moves or cancels single matches straight away
 * (the owner panel), and the teams playing are told.
 */
export function useScheduleBuilder({ tournamentId, teams, competition, overs, days, isOwner }: Input) {
  const queryClient = useQueryClient();
  const saved = useQuery({ queryKey: scheduleKey(tournamentId), queryFn: () => fetchSchedule(tournamentId) });
  const [editedMode, setEditedMode] = useState<ScheduleMode | null>(null);
  const [editedSettings, setEditedSettings] = useState<SlotSettings | null>(null);
  const [editedMatches, setEditedMatches] = useState<ScheduledMatch[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const mode = editedMode ?? saved.data?.mode ?? 'auto';
  const settings = editedSettings ?? saved.data?.settings ?? DEFAULT_SETTINGS;
  const matches = [...(editedMatches ?? saved.data?.matches ?? [])].sort(byKickoff);
  const dirty = editedMatches !== null || editedSettings !== null || editedMode !== null;
  const live = Boolean(saved.data?.publishedAt) && !dirty;
  const playing = matches.filter((m) => !m.cancelled);
  const teamIds = new Set(teams.map((t) => t.id));
  // A team removed or added after drawing leaves the schedule out of date. A hand-made schedule need not use every team.
  const outOfDate =
    playing.length > 0 &&
    (playing.some((m) => [m.home, m.away].some((s) => s.kind === 'team' && !teamIds.has(s.team.id))) ||
      (mode === 'auto' && teams.some((t) => !playing.some((m) => playsIn(m, t.id)))));

  const store = (schedule: Schedule | null) => queryClient.setQueryData(scheduleKey(tournamentId), schedule);
  const clearEdits = () => {
    setEditedMatches(null);
    setEditedSettings(null);
    setEditedMode(null);
    setProblem(null);
  };
  const publish = useMutation({
    mutationFn: () => publishSchedule(tournamentId, isOwner, mode, settings, matches),
    onSuccess: (schedule) => { store(schedule); clearEdits(); },
  });
  const cancel = useMutation({
    mutationFn: (a: { id: string; reason: string }) => cancelPublishedMatch(tournamentId, a.id, a.reason),
    onSuccess: store,
  });

  function edit(next: ScheduledMatch[]) {
    setEditedMatches(next);
    publish.reset();
  }

  function changeMode(next: ScheduleMode) {
    setEditedMode(next);
    setProblem(null);
  }

  function changeSettings(next: Partial<SlotSettings>) {
    setEditedSettings({ ...settings, ...next });
    setProblem(null);
  }

  /** Draws every match again from the teams and settings, replacing any hand-made changes. */
  function draw() {
    const refused = pairingProblem(teams.length, competition);
    if (refused) return setProblem(refused);
    const placed = placeMatches(generatePairings(teams, competition), days, settings, overs);
    setProblem(placed.problem);
    if (!placed.problem) edit(placed.matches);
  }

  /** Adds one match by hand, or returns why it cannot go there. */
  function add(match: NewMatch): string | null {
    if (match.home.id === match.away.id) return 'Pick two different teams.';
    const number = matches.reduce((max, m) => Math.max(max, m.number), 0) + 1;
    const added: ScheduledMatch = {
      id: `new-${number}`, number, stage: match.stage, round: stageRound[match.stage], date: match.date, startMin: match.startMin,
      home: { kind: 'team', team: match.home }, away: { kind: 'team', team: match.away },
    };
    const refused = moveProblem([...playing, added], added.id, match.date, match.startMin, overs);
    if (refused) return refused;
    edit([...matches, added]);
    return null;
  }

  /** Takes a match out of a schedule that is not published yet, or not since changed. */
  function remove(id: string) {
    edit(matches.filter((m) => m.id !== id));
  }

  /** Moves one match, or returns why it cannot go there. A published, unchanged schedule saves at once. */
  async function move(id: string, date: string, startMin: number): Promise<string | null> {
    const refused = moveProblem(playing, id, date, startMin, overs);
    if (refused) return refused;
    if (!live) {
      edit(matches.map((m) => (m.id === id ? { ...m, date, startMin } : m)));
      return null;
    }
    try {
      store(await movePublishedMatch(tournamentId, id, date, startMin));
      return null;
    } catch (error) {
      return messageOf(error);
    }
  }

  /** Calls off one published match, resolving to why it could not, or null. */
  async function cancelMatch(id: string, reason: string): Promise<string | null> {
    try {
      await cancel.mutateAsync({ id, reason });
      return null;
    } catch (error) {
      return messageOf(error);
    }
  }

  const publishError = publish.isError ? messageOf(publish.error) : null;

  return {
    saved, mode, settings, matches, dirty, live, outOfDate, problem, publish, publishError,
    changeMode, changeSettings, draw, add, remove, move, cancelMatch, discard: clearEdits,
  };
}
