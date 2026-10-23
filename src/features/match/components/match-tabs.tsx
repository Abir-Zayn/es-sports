import { StyleSheet, View } from 'react-native';

import { AppTabs } from '@/components/ui';
import { sizes, useThemedStyles, type Palette } from '@/theme';

import type { MatchTabId } from '../types';
import { matchTabs, useMatchRoutes } from '../use-match-routes';

type Props = { matchId: string; selected: MatchTabId };

/** Live, Scorecard, Overs, Wagon and Info as pills under the match header. */
export function MatchTabs({ matchId, selected }: Props) {
  const styles = useThemedStyles(createStyles);
  const { openTab } = useMatchRoutes(matchId);
  return (
    <View style={styles.bar}>
      <AppTabs tabs={matchTabs} selected={selected} onSelect={(tab) => tab !== selected && openTab(tab)} outlined={false} />
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      paddingHorizontal: sizes.gutter,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  });
