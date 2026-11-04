import { useCallback, useMemo, useState } from 'react';

import { useLiveMatchData } from '@/features/match/use-live-match-data';

/** The minimum the proof-of-concept overlay draws. Phase 2 replaces this with the GraphicTheme renderer. */
export type LabScore = {
  battingShort: string;
  bowlingShort: string;
  score: string;
  overs: string;
  runsPerOver: number[];
  wicketsPerOver: number[];
  /** Last ball label ("4", "6", "W"...), drives the stepped flash. */
  lastBall: string | null;
  /** Bumps on every ball, so equal consecutive balls still re-trigger a capture. */
  ballSeq: number;
};

type Synthetic = { runs: number; wickets: number; balls: number; perOver: number[]; wicketsPerOver: number[]; last: string | null };
const EMPTY: Synthetic = { runs: 0, wickets: 0, balls: 0, perOver: [0], wicketsPerOver: [0], last: null };

/**
 * G9/G10 data source. With a match id it follows a real scored match through the existing spectator pipeline
 * (Realtime + buildLiveView), so a second phone can score while this one streams. Without one, buttons add balls.
 */
export function useLabScore(matchId: string) {
  const live = useLiveMatchData(matchId);
  const [synthetic, setSynthetic] = useState<Synthetic>(EMPTY);

  const addBall = useCallback((label: string) => {
    setSynthetic((s) => {
      const wicket = label === 'W';
      const runs = wicket ? 0 : Number(label) || 0;
      const balls = s.balls + 1;
      const perOver = [...s.perOver];
      const wpo = [...s.wicketsPerOver];
      perOver[perOver.length - 1] += runs;
      if (wicket) wpo[wpo.length - 1] += 1;
      if (balls % 6 === 0) {
        perOver.push(0);
        wpo.push(0);
      }
      return { runs: s.runs + runs, wickets: s.wickets + (wicket ? 1 : 0), balls, perOver, wicketsPerOver: wpo, last: label };
    });
  }, []);

  const view = matchId.length > 0 ? live.data : undefined;
  const score = useMemo<LabScore>(() => {
    if (view && view.source === 'stored') {
      const batting = view.sides.find((s) => s.batting) ?? view.sides[0];
      const bowling = view.sides.find((s) => s !== batting) ?? view.sides[1];
      const overs = [...view.recentOvers].reverse();
      const latest = view.recentOvers[0]?.balls.filter(Boolean).at(-1) ?? null;
      return {
        battingShort: batting.team.short, bowlingShort: bowling.team.short, score: batting.score,
        overs: batting.overs, runsPerOver: overs.map((o) => o.runs),
        wicketsPerOver: overs.map((o) => o.balls.filter((b) => b === 'W').length),
        lastBall: latest, ballSeq: overs.reduce((n, o) => n + o.balls.filter(Boolean).length, 0),
      };
    }
    return {
      battingShort: 'KNG', bowlingShort: 'STR', score: `${synthetic.runs}/${synthetic.wickets}`,
      overs: `${Math.floor(synthetic.balls / 6)}.${synthetic.balls % 6}`, runsPerOver: synthetic.perOver,
      wicketsPerOver: synthetic.wicketsPerOver, lastBall: synthetic.last, ballSeq: synthetic.balls,
    };
  }, [view, synthetic]);

  return { score, addBall, source: view?.source === 'stored' ? 'match' : 'synthetic', loadError: matchId ? live.error : null } as const;
}
