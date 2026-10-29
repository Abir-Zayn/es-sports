import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { MatchResultSummaryCard, type ResultHighlight } from '@/features/match/components/match-result-summary-card';
import { QuadrantSplitCards } from '@/features/match/components/quadrant-split-cards';
import { WagonWheel } from '@/features/match/components/wagon-wheel';
import { careerOf, useLedger } from '@/features/profile/career-ledger';
import { addPerformances, emptyCareer } from '@/lib/career-stats';
import { quadrantSplit } from '@/lib/pitch-quadrant';
import { useThemedStyles, type Palette } from '@/theme';

import { ScorerFrame, ScorerHeader, ScorerNotice, ScorerSection } from './components/scorer-ui';
import { computeResult } from './data/match-result';
import { sideOf } from './data/sides';
import { matchPerformances, rollupCareerStats, topPerformers, type MatchPlayerLine } from './engine/career-stats-rollup';
import { oversLabel } from './engine/score-delivery';
import { useScorer } from './scorer-provider';
import { useScorerRoutes } from './use-scorer-routes';

const batting = (p: MatchPlayerLine) => `${p.runs}${p.isNotOut ? '*' : ''} (${p.ballsFaced})`;
const bowling = (p: MatchPlayerLine) => `${p.wicketsTaken}/${p.runsConceded} (${oversLabel(p.ballsBowled)})`;

/** The celebration card after the chase ends: result, top performers, where the runs came from, and career updates. */
export function MatchResultScreen() {
  const { score, savedId } = useScorer();
  const routes = useScorerRoutes();
  const s = useThemedStyles(styles);
  const ledger = useLedger();
  const result = useMemo(() => (score ? computeResult(score) : null), [score]);
  const lines = useMemo(() => (score ? matchPerformances(score) : []), [score]);
  if (!score || !result || !score.previousInnings) return <ScorerFrame>
    <ScorerHeader title="Match summary" onBack={routes.back} />
    <ScorerNotice>The summary is ready when the second innings ends.</ScorerNotice>
    <Button label="Back to scoring" onPress={() => routes.replace('pad')} />
  </ScorerFrame>;

  const first = score.previousInnings;
  const innings = [
    { code: first.team, runs: first.runs, wickets: first.wickets, balls: first.balls },
    { code: score.battingTeam, runs: score.runs, wickets: score.wickets, balls: score.balls },
  ];
  const top = topPerformers(lines);
  const highlights: ResultHighlight[] = [
    ...(top.mvp ? [{ title: 'PLAYER OF THE MATCH', name: top.mvp.playerName, figure: top.mvp.ballsBowled > 0 && top.mvp.wicketsTaken > 0 ? bowling(top.mvp) : batting(top.mvp) }] : []),
    ...(top.batter ? [{ title: 'BEST BATTER', name: top.batter.playerName, figure: batting(top.batter) }] : []),
    ...(top.bowler ? [{ title: 'BEST BOWLER', name: top.bowler.playerName, figure: bowling(top.bowler) }] : []),
  ];
  const shots = [...first.shots, ...score.shots];
  // Careers count matches scored on this device; this match is left out of "before" so it is added once.
  const before = (line: MatchPlayerLine) => (line.profileId
    ? addPerformances(emptyCareer, careerOf(ledger.filter((m) => m.matchId !== savedId), line.profileId).performances)
    : emptyCareer);
  const careers = rollupCareerStats(lines.filter((l) => l.profileId), before);

  return <ScorerFrame footer={<Button label="Done" onPress={routes.leave} />}>
    <ScorerHeader title="Match summary" subtitle={result.result_summary} onBack={routes.back} />
    <MatchResultSummaryCard headline={result.result_summary} highlights={highlights}
      teams={innings.map((i) => ({
        team: score.teams[i.code], score: `${i.runs}/${i.wickets}`, overs: oversLabel(i.balls), won: result.winner_side === sideOf[i.code],
      }))} />
    <ScorerSection title="Where the runs came from">
      {shots.length > 0 ? <>
        <WagonWheel shots={shots} filter="all" accessibilityLabel={`Wagon wheel of ${shots.length} scoring shots in the match`} />
        <QuadrantSplitCards split={quadrantSplit(shots)} />
      </> : <ScorerNotice>No shot directions were recorded in this match.</ScorerNotice>}
    </ScorerSection>
    <ScorerSection title="Career updated">
      {careers.length > 0 ? careers.map(({ line, update }) => <View key={line.playerId} style={s.career}
        accessible accessibilityLabel={`${line.playerName}: highest ${update.highestRun}, ${update.totalMatches} matches, ${update.totalWickets} wickets, average ${update.avg}`}>
        <Text style={s.name}>{line.playerName}</Text>
        <Text muted style={s.figures}>HS {update.highestRun} · {update.totalMatches} matches · {update.totalWickets} wkts · Avg {update.avg}</Text>
      </View>) : null}
      <ScorerNotice>{careers.length > 0
        ? 'Players added from the app get this match on their profile. Guest figures stay with the match.'
        : 'Everyone played as a guest, so no profiles changed. Add players from the app to build their careers.'}</ScorerNotice>
    </ScorerSection>
  </ScorerFrame>;
}
const styles = (c: Palette) => StyleSheet.create({
  career: { padding: 12, gap: 2, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  name: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
  figures: { fontSize: 12, lineHeight: 17 },
});
