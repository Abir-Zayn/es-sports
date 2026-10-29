import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, InitialsAvatar, SegmentedControl, Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

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
  const { setup, score, dispatch } = useScorer();
  const routes = useScorerRoutes();
  const s = useThemedStyles(styles);
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
    } catch (error) { Alert.alert('Check match setup', error instanceof Error ? error.message : 'Check the selected players.'); }
  };
  if (score && !chase) return <ScorerFrame>
    <ScorerHeader title={score.complete ? 'Match complete' : 'Scoring in progress'} onBack={routes.back} />
    <ScorerNotice>{score.complete ? 'View the final score and stream preview.' : 'Your current scoring session is ready to resume.'}</ScorerNotice>
    <Button label={score.complete ? 'View final score' : 'Resume scoring'} onPress={() => routes.replace('pad')} />
  </ScorerFrame>;
  return <ScorerFrame footer={<Button label={chase ? 'Start second innings' : 'Start match'} onPress={start} />}>
    <ScorerHeader title={chase ? 'Chase setup' : setup.preset ? 'Openers' : 'Match setup'} subtitle={setup.title} onBack={chase ? routes.toPad : routes.leave} />
    {chase ? <ScorerNotice>{teams[batting].team.name} need {score.runs + 1} runs to win.</ScorerNotice>
    : setup.preset ? <ScorerNotice>{teams[setup.tossWinner].team.name} won the toss and chose to {setup.decision}. {teams[batting].team.name} bat first.</ScorerNotice>
    : <>
      <ScorerSection title="Who won the toss?">
        <View style={s.teams}>{teamCodes.map((code) => <Pressable key={code}
          accessibilityRole="button" accessibilityState={{ selected: setup.tossWinner === code }}
          onPress={() => configure({ ...setup, tossWinner: code })} style={[s.team, setup.tossWinner === code && s.selected]}>
          <InitialsAvatar label={teams[code].team.short} tone={teams[code].team.tone} size={40} />
          <Text style={s.teamName}>{teams[code].team.name}</Text>
        </Pressable>)}</View>
      </ScorerSection>
      <ScorerSection title="Chose to">
        <SegmentedControl height={44} options={[{ id: 'bat', label: 'Bat first' }, { id: 'bowl', label: 'Bowl first' }]}
          selected={setup.decision} onSelect={(decision) => configure({ ...setup, decision })} />
        <Text style={s.batting}>{teams[batting].team.name} will bat first</Text>
      </ScorerSection>
      <PlayingXiEditor setup={normalized} onChange={configure} />
    </>}
    <OpeningPlayers setup={normalized} batting={batting} onChange={configure} />
    <SwitchRow title="Record shot direction" detail="One extra tap per scoring shot, for the wagon wheel" value={setup.recordShots}
      onChange={(recordShots) => configure({ ...normalized, recordShots })} />
    <ScorerNotice>{chase ? 'The result is saved when the chase ends.' : 'Balls are saved to your account as you score. You can resume an unfinished match from here.'}</ScorerNotice>
    {!chase && !setup.preset ? <Button label="Try the reference match" variant="ghost" onPress={() => {
      dispatch({ type: 'demo', id: localEventId() }); routes.replace('pad');
    }} /> : null}
  </ScorerFrame>;
}
const styles = (c: Palette) => StyleSheet.create({
  teams: { flexDirection: 'row', gap: 10 },
  team: { flex: 1, minHeight: 100, padding: 12, gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 20 },
  selected: { borderColor: c.primary, backgroundColor: c.primarySoft },
  teamName: { fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  batting: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: c.link },
});
