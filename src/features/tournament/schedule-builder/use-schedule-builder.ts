import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { generatePairings, pairingProblem } from './generate';
import { fetchSchedule, publishSchedule, ScheduleError } from './schedule-repository';
import { byKickoff, moveProblem, placeMatches } from './slots';
import type { Competition, MatchFormat, ScheduledMatch, ScheduleTeam, SlotSettings } from './types';

export const scheduleKey = (tournamentId: string) => ['tournament-schedule', tournamentId] as const;
const DEFAULT_SETTINGS: SlotSettings = { perDay: 2, firstStartMin: 9 * 60 };

type Input = {
  tournamentId: string;
  teams: ScheduleTeam[];
  competition: Competition;
  matchFormat: MatchFormat;
  days: string[];
  isOwner: boolean;
};

/**
 * The schedule being drawn. It starts from the published one; drawing and moving matches change a local copy
 * until it is published, so nothing is visible to teams before the owner decides.
 */
export function useScheduleBuilder({ tournamentId, teams, competition, matchFormat, days, isOwner }: Input) {
  const queryClient = useQueryClient();
  const saved = useQuery({ queryKey: scheduleKey(tournamentId), queryFn: () => fetchSchedule(tournamentId) });
  const [editedSettings, setEditedSettings] = useState<SlotSettings | null>(null);
  const [editedMatches, setEditedMatches] = useState<ScheduledMatch[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const settings = editedSettings ?? saved.data?.settings ?? DEFAULT_SETTINGS;
  const matches = [...(editedMatches ?? saved.data?.matches ?? [])].sort(byKickoff);
  const dirty = editedMatches !== null || editedSettings !== null;
  const teamIds = new Set(teams.map((t) => t.id));
  // A team disbanded or added after drawing leaves the schedule out of date.
  const outOfDate =
    matches.length > 0 &&
    (matches.some((m) => [m.home, m.away].some((s) => s.kind === 'team' && !teamIds.has(s.team.id))) ||
      teams.some((t) => !matches.some((m) => [m.home, m.away].some((s) => s.kind === 'team' && s.team.id === t.id))));

  const publish = useMutation({
    mutationFn: () => publishSchedule(tournamentId, isOwner, settings, matches),
    onSuccess: (schedule) => {
      queryClient.setQueryData(scheduleKey(tournamentId), schedule);
      setEditedMatches(null);
      setEditedSettings(null);
    },
  });

  function changeSettings(next: Partial<SlotSettings>) {
    setEditedSettings({ ...settings, ...next });
    setProblem(null);
  }

  /** Draws every match again from the teams and settings, replacing any hand-made changes. */
  function draw() {
    const refused = pairingProblem(teams.length, competition);
    if (refused) return setProblem(refused);
    const placed = placeMatches(generatePairings(teams, competition), days, settings, matchFormat);
    setProblem(placed.problem);
    if (!placed.problem) setEditedMatches(placed.matches);
    publish.reset();
  }

  /** Moves one match, or returns why it cannot go there. */
  function move(id: string, date: string, startMin: number): string | null {
    const refused = moveProblem(matches, id, date, startMin, matchFormat);
    if (refused) return refused;
    setEditedMatches(matches.map((m) => (m.id === id ? { ...m, date, startMin } : m)));
    publish.reset();
    return null;
  }

  const publishError = publish.isError
    ? publish.error instanceof ScheduleError
      ? publish.error.message
      : 'Could not publish. Please try again.'
    : null;

  return { saved, settings, matches, dirty, outOfDate, problem, publish, publishError, changeSettings, draw, move };
}
