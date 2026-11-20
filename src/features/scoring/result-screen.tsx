import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Info from 'lucide-react-native/icons/info';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, InitialsAvatar, Text } from '@/components/ui';
import { MatchResultSummaryCard, type ResultHighlight } from '@/features/match/components/match-result-summary-card';
import { UnderlineTabs, type UnderlineTabItem } from '@/features/match/components/match-tabs';
import { careerOf, useLedger } from '@/features/profile/career-ledger';
import { addPerformances, emptyCareer } from '@/lib/career-stats';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { ScorerFrame, ScorerHeader, ScorerNotice } from './components/scorer-ui';
import { sideOf } from './data/sides';
import { matchPerformances, rollupCareerStats, topPerformers, type MatchPlayerLine } from './engine/career-stats-rollup';
import { oversLabel } from './engine/score-delivery';
import { useScorer } from './scorer-provider';
import { useScorerRoutes } from './use-scorer-routes';
import { BattingTables } from './result/batting-tables';
import { inningsSides } from './result/innings-sides';
import { teamOf, wagonBattersOf } from './result/shot-map-data';
import { ShotMapCard } from '@/features/match/components/shot-map/shot-map-card';
import { computeResult, formatMatchResult } from './data/match-result';
import { useTranslation } from '@/i18n';

type SummaryTab = 'all' | 'standings' | 'wagon' | 'careers';

const batting = (p: MatchPlayerLine) => `${p.runs}${p.isNotOut ? '*' : ''} (${p.ballsFaced})`;
const bowling = (p: MatchPlayerLine) => `${p.wicketsTaken}/${p.runsConceded} (${oversLabel(p.ballsBowled)})`;

/** The post-match summary screen: DAZN-style hero scoreboard, underline tabs, innings table, shot map, and career updates. */
export function MatchResultScreen() {
  const { score, savedId } = useScorer();
  const routes = useScorerRoutes();
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const { t, locale } = useTranslation();
  const ledger = useLedger();
  const [tab, setTab] = useState<SummaryTab>('all');
  const result = useMemo(() => (score ? computeResult(score) : null), [score]);
  const lines = useMemo(() => (score ? matchPerformances(score) : []), [score]);

  if (!score || !result || !score.previousInnings) {
    return (
      <ScorerFrame>
        <ScorerHeader title={t('scoring.result.title')} onBack={routes.back} />
        <ScorerNotice>{t('scoring.result.waitSecondInnings')}</ScorerNotice>
        <Button label={t('scoring.wicket.backToScoring')} onPress={() => routes.replace('pad')} />
      </ScorerFrame>
    );
  }

  const summaryTabs: UnderlineTabItem<SummaryTab>[] = [
    { id: 'all', label: t('scoring.result.tabAll') },
    { id: 'standings', label: t('scoring.result.tabInnings') },
    { id: 'wagon', label: t('scoring.result.tabWagon') },
    { id: 'careers', label: t('scoring.result.tabCareers') },
  ];
  const innings = inningsSides(score);
  const top = topPerformers(lines);
  const highlights: ResultHighlight[] = [
    ...(top.mvp ? [{ title: t('scoring.result.mvp'), tag: 'MVP' as const, name: top.mvp.playerName, figure: top.mvp.ballsBowled > 0 && top.mvp.wicketsTaken > 0 ? bowling(top.mvp) : batting(top.mvp) }] : []),
    ...(top.batter ? [{ title: t('scoring.result.bestBatter'), tag: 'BAT' as const, name: top.batter.playerName, figure: batting(top.batter) }] : []),
    ...(top.bowler ? [{ title: t('scoring.result.bestBowler'), tag: 'BOWL' as const, name: top.bowler.playerName, figure: bowling(top.bowler) }] : []),
  ];
  // Careers count matches scored on this device; this match is left out of "before" so it is added once.
  const before = (line: MatchPlayerLine) => (line.profileId
    ? addPerformances(emptyCareer, careerOf(ledger.filter((m) => m.matchId !== savedId), line.profileId).performances)
    : emptyCareer);
  const careers = rollupCareerStats(lines.filter((l) => l.profileId), before);
  const showStandings = tab === 'all' || tab === 'standings';
  const showWagon = tab === 'all' || tab === 'wagon';
  const showCareers = tab === 'all' || tab === 'careers';

  return (
    <ScorerFrame footer={<Button label={t('common.done')} onPress={routes.leave} />}>
      <View style={s.topRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={routes.back}
          style={({ pressed }) => [s.backBtn, pressed && s.pressed]}>
          <ChevronLeft size={sizes.icon} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <Text accessibilityRole="header" style={s.topTitle} numberOfLines={1}>{t('scoring.result.title')}</Text>
        <View style={s.topSpacer} />
      </View>
      <View style={s.bleedTabs}>
        <MatchResultSummaryCard headline={formatMatchResult(score, locale) ?? result.result_summary} highlights={highlights}
          teams={innings.map((i) => ({
            team: score.teams[i.code], score: `${i.runs}/${i.wickets}`, overs: oversLabel(i.balls), won: result.winner_side === sideOf[i.code],
          }))} />
        <UnderlineTabs tabs={summaryTabs} selected={tab} onSelect={setTab} />
      </View>
      {showStandings ? (
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text accessibilityRole="header" style={s.sectionTitle}>{t('scoring.result.inningsBreakdown')}</Text>
            <Info size={sizes.iconSmall} color={colors.textMuted} strokeWidth={2} />
          </View>
          <View style={s.tableFlat}>
            <View style={[s.tableRow, s.tableHead]}>
              <Text style={[s.headCell, s.colRank]}>#</Text>
              <Text style={[s.headCell, s.colTeam]}>{t('scoring.result.teamCol')}</Text>
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
                    <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={dp(24)} />
                    <Text style={s.teamCellName} numberOfLines={1}>{team.name}</Text>
                  </View>
                  <Text style={[s.cellNum, s.colStat]}>{oversLabel(inn.balls)}</Text>
                  <Text style={[s.cellNum, s.colStat]}>{inn.wickets}</Text>
                  <Text style={[s.cellStrong, s.colPts]}>{inn.runs}</Text>
                </View>
              );
            })}
          </View>
          <BattingTables sides={innings} teams={score.teams} />
        </View>
      ) : null}
      {showWagon ? (
        <ShotMapCard batters={wagonBattersOf(innings, score.teams)} teams={innings.map((side) => teamOf(side.code, score.teams))}
          empty={(message) => <ScorerNotice>{message}</ScorerNotice>} />
      ) : null}
      {showCareers ? (
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text accessibilityRole="header" style={s.sectionTitle}>{t('scoring.result.careerUpdated')}</Text>
            <Info size={sizes.iconSmall} color={colors.textMuted} strokeWidth={2} />
          </View>
          {careers.length > 0 ? (
            <View style={s.tableFlat}>
              <View style={[s.tableRow, s.tableHead]}>
                <Text style={[s.headCell, s.colTeam]}>{t('scoring.result.playerCol')}</Text>
                <Text style={[s.headCell, s.colStat]}>M</Text>
                <Text style={[s.headCell, s.colStat]}>WKTS</Text>
                <Text style={[s.headCell, s.colStat]}>AVG</Text>
                <Text style={[s.headCell, s.colPts]}>HS</Text>
              </View>
              {careers.map(({ line, update }) => (
                <View key={line.playerId} style={[s.tableRow, s.rowBar]} accessible
                  accessibilityLabel={t('scoring.result.careerPlayerA11y', {
                    name: line.playerName,
                    highest: update.highestRun,
                    matches: update.totalMatches,
                    wickets: update.totalWickets,
                    avg: update.avg,
                  })}>
                  <Text style={[s.teamCellName, s.colTeam]} numberOfLines={1}>{line.playerName}</Text>
                  <Text style={[s.cellNum, s.colStat]}>{update.totalMatches}</Text>
                  <Text style={[s.cellNum, s.colStat]}>{update.totalWickets}</Text>
                  <Text style={[s.cellNum, s.colStat]}>{update.avg}</Text>
                  <Text style={[s.cellStrong, s.colPts]}>{update.highestRun}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <ScorerNotice>{t(careers.length > 0 ? 'scoring.result.careerLinkedNotice' : 'scoring.result.careerGuestNotice')}</ScorerNotice>
        </View>
      ) : null}
    </ScorerFrame>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: sizes.topBar },
  backBtn: { width: dp(48), height: dp(48), borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginLeft: -spacing.md },
  pressed: { transform: [{ scale: 0.95 }] },
  topTitle: { ...typography.headlineLg, flex: 1, textAlign: 'center', color: c.text },
  topSpacer: { width: dp(36) },
  bleedTabs: { marginHorizontal: -sizes.gutter },
  section: { gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.headlineMd, color: c.text },
  tableFlat: { backgroundColor: c.surface, borderRadius: radius.lg, paddingHorizontal: sizes.cardPaddingTight, ...shadows.card },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  tableHead: { borderBottomWidth: 1, borderBottomColor: c.border },
  rowBar: { borderBottomWidth: 1, borderBottomColor: c.border },
  headCell: { ...typography.labelSm, color: c.textMuted },
  colRank: { width: dp(22) }, colTeam: { flex: 1, minWidth: 0 }, colStat: { width: dp(44), textAlign: 'right' }, colPts: { width: dp(48), textAlign: 'right' },
  teamCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  teamCellName: { ...typography.labelMd, flexShrink: 1, color: c.text },
  cellMuted: { ...typography.bodyMd, color: c.textMuted, fontVariant: ['tabular-nums'] },
  cellNum: { ...typography.bodyMd, color: c.text, fontVariant: ['tabular-nums'] },
  cellStrong: { ...typography.headlineMd, color: c.text, fontVariant: ['tabular-nums'] },
});
