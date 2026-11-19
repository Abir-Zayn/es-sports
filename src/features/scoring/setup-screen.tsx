import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, InitialsAvatar, SegmentedControl, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { OpeningPlayers, normalizeOpeners } from './components/opening-players';
import { PlayingXiEditor } from './components/playing-xi-editor';
import { ScorerFrame, ScorerHeader, ScorerNotice, ScorerSection } from './components/scorer-ui';
import { SwitchRow } from './components/switch-row';
import { createInnings } from './engine/create-innings';
import { battingFirst, teamCodes } from './sample-data';
import { localEventId, useScorer } from './scorer-provider';
import type { MatchSetup } from './types';
import { useScorerRoutes } from './use-scorer-routes';

export function ScorerSetupScreen() {
  const { setup, score, dispatch, fixtureRef } = useScorer();
  const tournament = fixtureRef?.startsWith('tournament-') ?? false;
  const routes = useScorerRoutes();
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const teams = setup.teams;
  const chase = score?.complete && score.innings === 1;
  const batting = chase ? score.bowlingTeam : battingFirst(setup);
  const normalized = normalizeOpeners(setup, batting);
  const configure = (value: MatchSetup) => dispatch({ type: 'setup', value: normalizeOpeners(value, chase ? batting : battingFirst(value)) });
  const start = () => {
    try {
      createInnings(normalized, chase ? score : undefined);
      dispatch({ type: 'setup', value: normalized });
      dispatch({ type: 'start', id: localEventId() });
      routes.replace('pad');
    } catch (error) {
      Alert.alert(t('scoring.setup.alertTitle'), error instanceof Error ? error.message : t('scoring.setup.alertFallback'));
    }
  };
  if (score && !chase) return <ScorerFrame>
    <ScorerHeader title={t(score.complete ? 'scoring.setup.completeTitle' : 'scoring.setup.inProgressTitle')} onBack={routes.back} />
    <ScorerNotice>{t(score.complete ? 'scoring.setup.completeNotice' : 'scoring.setup.resumeNotice')}</ScorerNotice>
    <Button label={t(score.complete ? 'scoring.setup.viewFinalScore' : 'scoring.setup.resumeScoring')} onPress={() => routes.replace('pad')} />
  </ScorerFrame>;
  const decision = t(setup.decision === 'bat' ? 'match.toss.decisionBat' : 'match.toss.decisionBowl');
  return <ScorerFrame footer={<Button label={t(chase ? 'scoring.setup.startSecondInnings' : 'scoring.setup.startMatch')} onPress={start} />}>
    <ScorerHeader title={t(chase ? 'scoring.setup.chaseTitle' : setup.preset ? 'scoring.setup.openersTitle' : 'scoring.setup.setupTitle')} subtitle={setup.title} onBack={chase ? routes.toPad : routes.leave} />
    {chase ? <ScorerNotice>{t('scoring.setup.chaseNotice', { team: teams[batting].team.name, runs: score.runs + 1 })}</ScorerNotice>
    : setup.preset ? <ScorerNotice>{t('scoring.setup.presetNotice', { tossTeam: teams[setup.tossWinner].team.name, decision, battingTeam: teams[batting].team.name })}</ScorerNotice>
    : <>
      <ScorerSection title={t('scoring.setup.whoWonToss')}>
        <View style={s.teams}>{teamCodes.map((code) => <Pressable key={code}
          accessibilityRole="button" accessibilityState={{ selected: setup.tossWinner === code }}
          onPress={() => configure({ ...setup, tossWinner: code })} style={[s.team, setup.tossWinner === code && s.selected]}>
          <InitialsAvatar label={teams[code].team.short} tone={teams[code].team.tone} size={sizes.avatar} />
          <Text style={s.teamName}>{teams[code].team.name}</Text>
        </Pressable>)}</View>
      </ScorerSection>
      <ScorerSection title={t('scoring.setup.choseTo')}>
        <SegmentedControl height={dp(48)} options={[{ id: 'bat', label: t('friendly.toss.batFirst') }, { id: 'bowl', label: t('friendly.toss.bowlFirst') }]}
          selected={setup.decision} onSelect={(choice) => configure({ ...setup, decision: choice })} />
        <Text style={s.batting}>{t('scoring.setup.willBatFirst', { team: teams[batting].team.name })}</Text>
      </ScorerSection>
      {tournament ? null : <PlayingXiEditor setup={normalized} onChange={configure} />}
    </>}
    <OpeningPlayers setup={normalized} batting={batting} onChange={configure} />
    <SwitchRow title={t('scoring.setup.recordShotsTitle')} detail={t('scoring.setup.recordShotsDetail')} value={setup.recordShots}
      onChange={(recordShots) => configure({ ...normalized, recordShots })} />
    <ScorerNotice>{t(chase ? 'scoring.setup.chaseSavedNotice' : 'scoring.setup.firstInningsNotice')}</ScorerNotice>
    {!chase && !setup.preset && !tournament ? <Button label={t('scoring.setup.tryReference')} variant="ghost" onPress={() => {
      dispatch({ type: 'demo', id: localEventId() }); routes.replace('pad');
    }} /> : null}
  </ScorerFrame>;
}
const styles = (c: Palette) => StyleSheet.create({
  teams: { flexDirection: 'row', gap: spacing.md },
  team: { flex: 1, minHeight: dp(100), padding: spacing.md, gap: spacing.md, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, borderWidth: 2, borderColor: 'transparent', borderRadius: radius.lg, ...shadows.card },
  selected: { borderColor: c.primary, backgroundColor: c.primarySoft },
  teamName: { ...typography.labelMd, textAlign: 'center' },
  batting: { ...typography.bodyMd, color: c.link },
});
