import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import { matchHeader } from '../sample-match';
import type { MatchTabId } from '../types';
import { useMatchRoutes } from '../use-match-routes';
import { MatchCompactHeader } from './match-compact-header';
import { MatchTabs } from './match-tabs';

type Props = { matchId: string; tab: MatchTabId; children: ReactNode };

/** Shared shell of the match's Scorecard, Overs, Wagon and Info screens: compact header, tabs, then content. */
export function MatchScreenFrame({ matchId, tab, children }: Props) {
  const styles = useThemedStyles(createStyles);
  const { goBack } = useMatchRoutes(matchId);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <MatchCompactHeader title={matchHeader.title} subtitle={matchHeader.subtitle} onBack={goBack} />
      <View style={styles.tabs}>
        <MatchTabs matchId={matchId} selected={tab} />
      </View>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl + spacing.xl },
    tabs: { marginTop: 14 },
    body: { paddingHorizontal: sizes.gutter, paddingTop: 18, gap: 22 },
  });
