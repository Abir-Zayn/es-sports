import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Info from 'lucide-react-native/icons/info';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, InitialsAvatar, Text } from '@/components/ui';
import { MatchResultSummaryCard, type ResultHighlight } from '@/features/match/components/match-result-summary-card';
import { UnderlineTabs, type UnderlineTabItem } from '@/features/match/components/match-tabs';
import { QuadrantSplitCards } from '@/features/match/components/quadrant-split-cards';
import { WagonWheel } from '@/features/match/components/wagon-wheel';
import { careerOf, useLedger } from '@/features/profile/career-ledger';
import { addPerformances, emptyCareer } from '@/lib/career-stats';
import { quadrantSplit } from '@/lib/pitch-quadrant';
import { sizes, useTheme, useThemedStyles, type Palette } from '@/theme';

import { ScorerFrame, ScorerHeader, ScorerNotice } from './components/scorer-ui';
import { computeResult } from './data/match-result';
import { sideOf } from './data/sides';
import { matchPerformances, rollupCareerStats, topPerformers, type MatchPlayerLine } from './engine/career-stats-rollup';
import { oversLabel } from './engine/score-delivery';
import { useScorer } from './scorer-provider';
import { useScorerRoutes } from './use-scorer-routes';

type SummaryTab = 'all' | 'standings' | 'wagon' | 'careers';

const SUMMARY_TABS: UnderlineTabItem<SummaryTab>[] = [
  { id: 'all', label: 'Summary' },
  { id: 'standings', label: 'Innings' },
  { id: 'wagon', label: 'Shot map' },
  { id: 'careers', label: 'Careers' },
];

const batting = (p: MatchPlayerLine) => `${p.runs}${p.isNotOut ? '*' : ''} (${p.ballsFaced})`;
const bowling = (p: MatchPlayerLine) => `${p.wicketsTaken}/${p.runsConceded} (${oversLabel(p.ballsBowled)})`;

/** The post-match summary screen: DAZN-style hero scoreboard, underline tabs, innings table, shot map, and career updates. */
export function MatchResultScreen() {
  const { score, savedId } = useScorer();
  const routes = useScorerRoutes();
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const ledger = useLedger();
  const [tab, setTab] = useState<SummaryTab>('all');
  const result = useMemo(() => (score ? computeResult(score) : null), [score]);
  const lines = useMemo(() => (score ? matchPerformances(score) : []), [score]);

  if (!score || !result || !score.previousInnings) {
    return (
      <ScorerFrame>
        <ScorerHeader title="Match summary" onBack={routes.back} />
        <ScorerNotice>The summary is ready when the second innings ends.</ScorerNotice>
        <Button label="Back to scoring" onPress={() => routes.replace('pad')} />
      </ScorerFrame>
    );
  }

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
  const showStandings = tab === 'all' || tab === 'standings';
  const showWagon = tab === 'all' || tab === 'wagon';
  const showCareers = tab === 'all' || tab === 'careers';

  return (
    <ScorerFrame footer={<Button label="Done" onPress={routes.leave} />}>
      <View style={s.topRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={routes.back}
          style={({ pressed }) => [s.backBtn, pressed && s.pressed]}>
          <ChevronLeft size={22} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <Text accessibilityRole="header" style={s.topTitle} numberOfLines={1}>Match summary</Text>
        <View style={s.topSpacer} />
      </View>
      <View style={s.bleedTabs}>
        <MatchResultSummaryCard headline={result.result_summary} highlights={highlights}
          teams={innings.map((i) => ({
            team: score.teams[i.code], score: `${i.runs}/${i.wickets}`, overs: oversLabel(i.balls), won: result.winner_side === sideOf[i.code],
          }))} />
        <UnderlineTabs tabs={SUMMARY_TABS} selected={tab} onSelect={setTab} />
      </View>
      {showStandings ? (
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text accessibilityRole="header" style={s.sectionTitle}>Innings breakdown</Text>
            <Info size={15} color={colors.textMuted} strokeWidth={2} />
          </View>
          <View style={s.tableFlat}>
            <View style={[s.tableRow, s.tableHead]}>
              <Text style={[s.headCell, s.colRank]}>#</Text>
              <Text style={[s.headCell, s.colTeam]}>Team</Text>
              <Text style={[s.headCell, s.colStat]}>OV</Text>
              <Text style={[s.headCell, s.colStat]}>W</Text>
              <Text style={[s.headCell, s.colPts]}>RUNS</Text>
            </View>
            {innings.map((inn, idx) => {
              const team = score.teams[inn.code];
              return (
                <View key={inn.code} style={[s.tableRow, s.rowBar]}>
                  <Text style={[s.cellMuted, s.colRank]}>{idx + 1}</Text>
                  <View style={[s.teamCell, s.colTeam]}>
                    <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={24} />
                    <Text style={s.teamCellName} numberOfLines={1}>{team.name}</Text>
                  </View>
                  <Text style={[s.cellNum, s.colStat]}>{oversLabel(inn.balls)}</Text>
                  <Text style={[s.cellNum, s.colStat]}>{inn.wickets}</Text>
                  <Text style={[s.cellStrong, s.colPts]}>{inn.runs}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
      {showWagon ? (
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text accessibilityRole="header" style={s.sectionTitle}>Where the runs came from</Text>
            <Info size={15} color={colors.textMuted} strokeWidth={2} />
          </View>
          {shots.length > 0 ? (
            <View style={s.wagonGroup}>
              <WagonWheel shots={shots} filter="all" accessibilityLabel={`Wagon wheel of ${shots.length} scoring shots in the match`} />
              <QuadrantSplitCards split={quadrantSplit(shots)} />
            </View>
          ) : (
            <View style={s.flatNote}><ScorerNotice>No shot directions were recorded in this match.</ScorerNotice></View>
          )}
        </View>
      ) : null}
      {showCareers ? (
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text accessibilityRole="header" style={s.sectionTitle}>Career updated</Text>
            <Info size={15} color={colors.textMuted} strokeWidth={2} />
          </View>
          {careers.length > 0 ? (
            <View style={s.tableFlat}>
              <View style={[s.tableRow, s.tableHead]}>
                <Text style={[s.headCell, s.colTeam]}>Player</Text>
                <Text style={[s.headCell, s.colStat]}>M</Text>
                <Text style={[s.headCell, s.colStat]}>WKTS</Text>
                <Text style={[s.headCell, s.colStat]}>AVG</Text>
                <Text style={[s.headCell, s.colPts]}>HS</Text>
              </View>
              {careers.map(({ line, update }) => (
                <View key={line.playerId} style={[s.tableRow, s.rowBar]} accessible
                  accessibilityLabel={`${line.playerName}: highest ${update.highestRun}, ${update.totalMatches} matches, ${update.totalWickets} wickets, average ${update.avg}`}>
                  <Text style={[s.teamCellName, s.colTeam]} numberOfLines={1}>{line.playerName}</Text>
                  <Text style={[s.cellNum, s.colStat]}>{update.totalMatches}</Text>
                  <Text style={[s.cellNum, s.colStat]}>{update.totalWickets}</Text>
                  <Text style={[s.cellNum, s.colStat]}>{update.avg}</Text>
                  <Text style={[s.cellStrong, s.colPts]}>{update.highestRun}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <ScorerNotice>{careers.length > 0
            ? 'Players added from the app get this match on their profile. Guest figures stay with the match.'
            : 'Everyone played as a guest, so no profiles changed. Add players from the app to build their careers.'}</ScorerNotice>
        </View>
      ) : null}
    </ScorerFrame>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginLeft: -12 },
  pressed: { opacity: 0.7 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 15, lineHeight: 20, fontWeight: '600', color: c.text },
  topSpacer: { width: 36 },
  bleedTabs: { marginHorizontal: -sizes.gutter },
  section: { gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: c.text },
  tableFlat: { borderTopWidth: 1, borderTopColor: c.border },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 6 },
  tableHead: { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: c.border },
  rowBar: { borderBottomWidth: 1, borderBottomColor: c.border },
  headCell: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: c.textMuted },
  colRank: { width: 22 }, colTeam: { flex: 1, minWidth: 0 }, colStat: { width: 44, textAlign: 'right' }, colPts: { width: 48, textAlign: 'right' },
  teamCell: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamCellName: { flexShrink: 1, fontSize: 14, lineHeight: 19, fontWeight: '600', color: c.text },
  cellMuted: { fontSize: 13, lineHeight: 18, color: c.textMuted, fontVariant: ['tabular-nums'] },
  cellNum: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: c.text, fontVariant: ['tabular-nums'] },
  cellStrong: { fontSize: 14, lineHeight: 19, fontWeight: '700', color: c.text, fontVariant: ['tabular-nums'] },
  wagonGroup: { gap: 12 },
  flatNote: { paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border },
});
