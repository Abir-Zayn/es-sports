import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { comingSoon } from '@/lib/coming-soon';
import { useThemedStyles, type Palette } from '@/theme';

import { SquadMatchPicker } from './components/squad-match-picker';
import { TeamScreenFrame } from './components/team-screen-frame';
import { getTeamProfile } from './sample-team';
import { SquadGroupSection } from './sections/squad-group-section';

const XI_SIZE = 11;

/** The squad for one match: the playing XI and who is on the bench. */
export function TeamSquadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = id ?? 'CS';
  const styles = useThemedStyles(createStyles);
  const { team, squad } = getTeamProfile(teamId);

  return (
    <TeamScreenFrame teamId={teamId} tab="squad">
      <SquadMatchPicker
        matchLabel={squad.forMatch}
        onPickMatch={() => comingSoon('Choosing a match')}
        onEdit={() => comingSoon('Editing the squad')}
      />
      <SquadGroupSection
        title="Playing XI"
        count={`${squad.playingXi.length} / ${XI_SIZE}`}
        players={squad.playingXi}
        tone={team.tone}
      />
      <View style={styles.divider} />
      <SquadGroupSection title="On bench" count={String(squad.bench.length)} players={squad.bench} tone={team.tone} bench />
    </TeamScreenFrame>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    divider: { height: 1, backgroundColor: colors.border },
  });
