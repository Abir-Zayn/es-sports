import { ScrollView, StyleSheet, View } from 'react-native';

import { AppTabs } from '@/components/ui';
import { sizes, useThemedStyles, type Palette } from '@/theme';

import { tournamentSections, type TournamentSectionId } from '../sample-data';
import { useTournamentRoutes } from '../use-tournament-routes';

type Props = { tournamentId: string; selected: TournamentSectionId };

/** Horizontally scrollable tournament navigation tabs: Overview, Matches, Table, Knockout, Stats, Teams. */
export function TournamentSectionTabs({ tournamentId, selected }: Props) {
  const styles = useThemedStyles(createStyles);
  const { openSection } = useTournamentRoutes(tournamentId);
  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AppTabs
          tabs={[...tournamentSections]}
          selected={selected}
          onSelect={(section) => section !== selected && openSection(section)}
          outlined={false}
        />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      marginTop: sizes.gutter,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    scrollContent: {
      paddingHorizontal: sizes.gutter,
    },
  });
