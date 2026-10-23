import { StyleSheet, View } from 'react-native';

import { AppTabs } from '@/components/ui';
import { sizes, useThemedStyles, type Palette } from '@/theme';

import { tournamentSections, type TournamentSectionId } from '../sample-data';
import { useTournamentRoutes } from '../use-tournament-routes';

type Props = { tournamentId: string; selected: TournamentSectionId };

/** Overview, Matches, Table, Stats and Teams as pills under the tournament header. */
export function TournamentSectionTabs({ tournamentId, selected }: Props) {
  const styles = useThemedStyles(createStyles);
  const { openSection } = useTournamentRoutes(tournamentId);
  return (
    <View style={styles.bar}>
      <AppTabs
        tabs={[...tournamentSections]}
        selected={selected}
        onSelect={(section) => section !== selected && openSection(section)}
        outlined={false}
      />
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      marginTop: sizes.gutter,
      paddingHorizontal: sizes.gutter,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  });
