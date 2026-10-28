import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { comingSoon } from '@/lib/coming-soon';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { PlayerDetailSheet } from './components/player-detail-sheet';
import { TeamScreenFrame } from './components/team-screen-frame';
import { TopXiCard } from './components/top-xi-card';
import { getTeamProfile } from './sample-team';
import { SquadGroupSection } from './sections/squad-group-section';
import type { SquadPlayer } from './types';

/**
 * Team Squad Screen featuring the prominent Top XI showcase,
 * with 11-slot indicator pill, circular player disc grid, player career stats, and bench squad section.
 */
export function TeamSquadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = id ?? 'CS';
  const styles = useThemedStyles(createStyles);
  const { team, squad } = getTeamProfile(teamId);

  const [selectedPlayer, setSelectedPlayer] = useState<SquadPlayer | null>(null);
  const [showBench, setShowBench] = useState(false);

  function handlePlayerPress(player: SquadPlayer) {
    setSelectedPlayer(player);
  }

  function handleCloseSheet() {
    setSelectedPlayer(null);
  }

  function handleSubstitute(player: SquadPlayer) {
    comingSoon(`Substitute ${player.name}`);
  }

  return (
    <TeamScreenFrame teamId={teamId} tab="squad">
      {/* Top XI Showcase Card */}
      <TopXiCard
        players={squad.playingXi}
        tone={team.tone}
        onPlayerPress={handlePlayerPress}
        onEditPlayingXi={() => comingSoon('Editing the Playing XI')}
        onToggleBench={() => setShowBench((prev) => !prev)}
        benchCount={squad.bench.length}
      />

      {/* Bench Section (expandable view) */}
      {showBench ? (
        <View style={styles.benchWrapper}>
          <View style={styles.divider} />
          <SquadGroupSection
            title="On bench"
            count={String(squad.bench.length)}
            players={squad.bench}
            tone={team.tone}
            bench
          />
        </View>
      ) : null}

      {/* Player Detail & Career Results Modal */}
      <PlayerDetailSheet
        player={selectedPlayer}
        tone={team.tone}
        visible={Boolean(selectedPlayer)}
        onClose={handleCloseSheet}
        onSubstitute={handleSubstitute}
      />
    </TeamScreenFrame>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },
    benchWrapper: {
      gap: spacing.md,
      paddingTop: spacing.xs,
    },
  });
