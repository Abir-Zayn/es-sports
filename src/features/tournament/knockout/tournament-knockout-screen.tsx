import { useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ElementRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from '@/components/ui';
import { radius, sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import { TournamentScreenFrame } from '../components/tournament-screen-frame';
import { KnockoutBracketSide } from './components/knockout-bracket-side';
import { KnockoutFinalCard } from './components/knockout-final-card';
import { getKnockoutData } from './sample-knockout-data';
import type { KnockoutMatch } from './types';

type DrawTab = 'full' | 'draw-a' | 'draw-b';

const DRAW_TABS: { id: DrawTab; label: string }[] = [
  { id: 'full', label: 'Full Draw' },
  { id: 'draw-a', label: 'Draw A (PSG Path)' },
  { id: 'draw-b', label: 'Draw B (Inter Path)' },
];

/** The Knockout Tournament Bracket screen with smooth horizontal and vertical scrolling. */
export function TournamentKnockoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentId = id ?? 'ucl';
  const data = getKnockoutData(tournamentId);
  const styles = useThemedStyles(createStyles);
  const [selectedTab, setSelectedTab] = useState<DrawTab>('full');
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);

  function handleTabSelect(tab: DrawTab) {
    setSelectedTab(tab);
  }

  function handleMatchPress(_match: KnockoutMatch) {
    // Interactive match tap feedback
  }

  return (
    <TournamentScreenFrame tournamentId={tournamentId} section="knockout" flush>
      {/* Draw filter pills */}
      <View style={styles.filterRow}>
        {DRAW_TABS.map((tab) => {
          const active = tab.id === selectedTab;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              onPress={() => handleTabSelect(tab.id)}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text
                style={[
                  styles.filterText,
                  active && styles.filterTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Horizontally scrollable tournament canvas */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollCanvas}
        nestedScrollEnabled
      >
        <View style={styles.bracketContainer}>
          {selectedTab === 'draw-a' ? (
            <View style={styles.singleSideWrapper}>
              <KnockoutBracketSide
                draw={data.drawA}
                onMatchPress={handleMatchPress}
                showDropLineToFinal
              />
            </View>
          ) : selectedTab === 'draw-b' ? (
            <View style={styles.singleSideWrapper}>
              <KnockoutBracketSide
                draw={data.drawB}
                onMatchPress={handleMatchPress}
                showDropLineToFinal
              />
            </View>
          ) : (
            <View style={styles.bothSidesRow}>
              <KnockoutBracketSide
                draw={data.drawA}
                onMatchPress={handleMatchPress}
                showDropLineToFinal
              />
              <View style={styles.bracketDivider} />
              <KnockoutBracketSide
                draw={data.drawB}
                onMatchPress={handleMatchPress}
                showDropLineToFinal
              />
            </View>
          )}

          {/* Championship Final Card */}
          <View style={styles.finalSection}>
            <KnockoutFinalCard
              match={data.finalMatch}
              onPress={handleMatchPress}
            />
          </View>
        </View>
      </ScrollView>
    </TournamentScreenFrame>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: sizes.gutter,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    filterPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterPillActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    filterText: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600',
      color: colors.textMuted,
    },
    filterTextActive: {
      color: colors.background,
    },
    scrollCanvas: {
      paddingHorizontal: sizes.gutter,
      paddingBottom: spacing.xxl,
    },
    bracketContainer: {
      alignItems: 'center',
    },
    singleSideWrapper: {
      alignItems: 'center',
    },
    bothSidesRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 20,
    },
    bracketDivider: {
      width: 1,
      height: '80%',
      backgroundColor: colors.border,
      opacity: 0.5,
    },
    finalSection: {
      width: '100%',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
  });
