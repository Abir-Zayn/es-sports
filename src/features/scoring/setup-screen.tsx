import { Alert, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { OpeningPlayers, normalizeOpeners } from './components/opening-players';
import { PlayingXiEditor } from './components/playing-xi-editor';
import { ScorerFrame, ScorerHeader, ScorerNotice } from './components/scorer-ui';
import { StepHeader } from './components/setup/setup-parts';
import { TossPicker } from './components/setup/toss-picker';
import { SwitchRow } from './components/switch-row';
import { createInnings } from './engine/create-innings';
import { battingFirst, otherTeam, playerName } from '@/features/scoring/setup-defaults';
import { localEventId, useScorer } from './scorer-provider';
import type { MatchSetup } from './types';
import { useScorerRoutes } from './use-scorer-routes';

/**
 * Before the first ball: the toss as a face-off, the playing sides, the openers and the scoring options, numbered in the
 * order they are settled, with a one-line summary of who opens above the start button.
 */
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
  const askToss = !chase && !setup.preset;
  let step = 0;
  const next = () => (step += 1);
  const summary = t('scoring.setup.summary', {
    striker: playerName(normalized, normalized.strikerId), nonStriker: playerName(normalized, normalized.nonStrikerId),
    bowler: playerName(normalized, normalized.bowlerId),
  });
  const footer = <View>
    <Text style={s.summary} numberOfLines={2} accessibilityLiveRegion="polite">{summary}</Text>
    <Button label={t(chase ? 'scoring.setup.startSecondInnings' : 'scoring.setup.startMatch')} onPress={start} />
  </View>;

  return <ScorerFrame footer={footer}>
    <ScorerHeader title={t(chase ? 'scoring.setup.chaseTitle' : setup.preset ? 'scoring.setup.openersTitle' : 'scoring.setup.setupTitle')} subtitle={setup.title} onBack={chase ? routes.toPad : routes.leave} />
    {chase ? <ScorerNotice>{t('scoring.setup.chaseNotice', { team: teams[batting].team.name, runs: score.runs + 1 })}</ScorerNotice> : null}
    {setup.preset && !chase ? <ScorerNotice>{t('scoring.setup.presetNotice', { tossTeam: teams[setup.tossWinner].team.name, decision, battingTeam: teams[batting].team.name })}</ScorerNotice> : null}
    {askToss ? <>
      <StepHeader step={next()} title={t('scoring.setup.tossStep')} detail={t('scoring.setup.tossDetail')} />
      <TossPicker setup={setup} batting={batting} onChange={configure} />
    </> : null}
    {askToss && !tournament ? <>
      <StepHeader step={next()} title={t('scoring.xi.title')} detail={t('scoring.xi.detail', { size: setup.playersPerSide })} />
      <PlayingXiEditor setup={normalized} onChange={configure} />
    </> : null}
    <StepHeader step={next()} title={t('scoring.openers.section')}
      detail={t('scoring.openers.detail', { batting: teams[batting].team.name, bowling: teams[otherTeam(batting)].team.name })} />
    <OpeningPlayers setup={normalized} batting={batting} onChange={configure} />
    <StepHeader step={next()} title={t('scoring.setup.optionsStep')} />
    <SwitchRow title={t('scoring.setup.recordShotsTitle')} detail={t('scoring.setup.recordShotsDetail')} value={setup.recordShots}
      onChange={(recordShots) => configure({ ...normalized, recordShots })} />
  </ScorerFrame>;
}

const styles = (c: Palette) => StyleSheet.create({
  summary: { ...typography.bodySm, color: c.textMuted, textAlign: 'center', marginBottom: spacing.sm },
});
