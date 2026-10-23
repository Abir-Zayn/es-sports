import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import { getTournamentOverview, type TournamentSectionId } from '../sample-data';
import { useTournamentRoutes } from '../use-tournament-routes';
import { TournamentCompactHeader } from './tournament-compact-header';
import { TournamentSectionTabs } from './tournament-section-tabs';

type Props = { tournamentId: string; section: TournamentSectionId; children: ReactNode };

/** Shared shell of a tournament's inner screens: compact header, section tabs, then the screen's own content. */
export function TournamentScreenFrame({ tournamentId, section, children }: Props) {
  const styles = useThemedStyles(createStyles);
  const tournament = getTournamentOverview(tournamentId);
  const { goBack } = useTournamentRoutes(tournamentId);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TournamentCompactHeader
        short={tournament.short}
        name={tournament.name}
        tone={tournament.tone}
        avatarUri={tournament.avatarUri}
        format={tournament.format}
        onBack={goBack}
      />
      <TournamentSectionTabs tournamentId={tournamentId} selected={section} />
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl + spacing.xl },
    body: { paddingHorizontal: sizes.gutter, paddingTop: spacing.lg, gap: 18 },
  });
