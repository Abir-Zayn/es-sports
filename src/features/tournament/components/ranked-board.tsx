import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing } from '@/theme';
import type { StatLeader } from '@/types/cricket';

import type { RankedCategory } from '../data/player-stats';
import { StatLeaderboard } from './stat-leaderboard';
import { StatPodium } from './stat-podium';

/** Players shown before "Show all": the podium's three plus seven rows. */
export const TOP_COUNT = 10;

type Props = { board: RankedCategory };

/**
 * One leaderboard: its qualifying rule, the top three on a podium, the rest of the top ten, and every other qualifier
 * behind "Show all". Tapping a player opens their profile. Give it `key={board.id}` so a new category starts collapsed.
 */
export function RankedBoard({ board }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const open = (leader: StatLeader) =>
    leader.id && router.push({ pathname: '/player/[id]', params: { id: leader.id, name: leader.name } });
  const shown = expanded ? board.leaders : board.leaders.slice(0, TOP_COUNT);
  const hidden = board.leaders.length - shown.length;

  return (
    <View style={styles.gap}>
      {board.note ? <Text variant="caption" muted>{board.note}</Text> : null}
      {board.leaders.length === 0 ? (
        <Text muted accessibilityLiveRegion="polite">Nobody qualifies for this list yet.</Text>
      ) : (
        <>
          <StatPodium leaders={shown} unit={board.unit} onPressPlayer={open} />
          {shown.length > 3 ? (
            <StatLeaderboard leaders={shown.slice(3)} valueHeading={board.valueHeading} secondaryHeading={board.secondaryHeading}
              onPressPlayer={open} />
          ) : null}
          {hidden > 0 ? (
            <Button label={`Show all ${board.leaders.length} players`} variant="secondary" onPress={() => setExpanded(true)} />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ gap: { gap: spacing.lg } });
