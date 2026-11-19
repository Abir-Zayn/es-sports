import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Section, SectionHeader, Text } from '@/components/ui';
import { useTranslation, type TranslationKey } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { BattingStats, BowlingStats } from '@/types/profile';

type Mode = 'bat' | 'bowl';

type Props = {
  batting: BattingStats;
  bowling: BowlingStats;
  onFindTeam: () => void;
};

const modes: { id: Mode; labelKey: TranslationKey; icon: number }[] = [
  { id: 'bat', labelKey: 'profile.career.batting', icon: require('../../../../assets/images/career-bat.svg') },
  { id: 'bowl', labelKey: 'profile.career.bowling', icon: require('../../../../assets/images/career-ball.svg') },
];

function battingCells(s: BattingStats): [TranslationKey, string | number][] {
  return [
    ['profile.stats.matches', s.matches],
    ['profile.career.innings', s.innings],
    ['profile.stats.runs', s.runs],
    ['profile.career.highest', s.highest],
    ['profile.career.average', s.average],
    ['profile.career.strikeRate', s.strikeRate],
    ['profile.career.fifties', s.fifties],
    ['profile.career.hundreds', s.hundreds],
  ];
}

function bowlingCells(s: BowlingStats): [TranslationKey, string | number][] {
  return [
    ['profile.stats.matches', s.matches],
    ['profile.career.overs', s.overs],
    ['profile.stats.wickets', s.wickets],
    ['profile.career.best', s.best],
    ['profile.career.economy', s.economy],
    ['profile.career.average', s.average],
    ['profile.career.threeW', s.threeW],
    ['profile.career.fiveW', s.fiveW],
  ];
}

/** Career figures with a Bat / Bowl switch. With no matches played it invites the player to join a team. */
export function CareerStats({ batting, bowling, onFindTeam }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [mode, setMode] = useState<Mode>('bat');
  const empty = batting.matches === 0 && bowling.matches === 0;
  const cells = mode === 'bat' ? battingCells(batting) : bowlingCells(bowling);

  return (
    <Section>
      <SectionHeader title={t('profile.career.title')} />
      <View style={styles.body}>
        {empty ? (
          <View style={styles.empty}>
            <Text muted style={styles.emptyText}>
              {t('profile.career.empty')}
            </Text>
            <Button label={t('profile.career.findTeam')} size="compact" onPress={onFindTeam} />
          </View>
        ) : (
          <>
            <View style={styles.modes} accessibilityRole="tablist" accessibilityLabel={t('profile.career.typeA11y')}>
              {modes.map((option) => (
                <Pressable
                  key={option.id}
                  accessibilityRole="tab"
                  accessibilityLabel={t(option.labelKey)}
                  accessibilityState={{ selected: mode === option.id }}
                  onPress={() => setMode(option.id)}
                  style={[styles.mode, mode === option.id && styles.modeSelected]}
                >
                  <Image source={option.icon} style={styles.modeIcon} contentFit="contain" accessibilityElementsHidden />
                </Pressable>
              ))}
            </View>
            <View style={styles.grid}>
              {cells.map(([labelKey, value]) => {
                const label = t(labelKey);
                return (
                  <View key={labelKey} accessible accessibilityLabel={`${label} ${value}`} style={styles.cell}>
                    <Text style={styles.value}>{value}</Text>
                    <Text variant="bodySm" muted>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>
    </Section>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    body: { paddingHorizontal: sizes.gutter, gap: spacing.md },
    modes: { flexDirection: 'row', gap: spacing.sm },
    mode: {
      width: dp(48),
      height: dp(48),
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceRaised,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    modeSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    modeIcon: { width: sizes.tabIcon, height: sizes.tabIcon },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    cell: {
      // Two per row: half the width minus half the gap.
      flexBasis: '48.5%',
      flexGrow: 1,
      gap: spacing.xs,
      padding: sizes.cardPaddingTight,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    value: typography.numeralStat,
    empty: {
      gap: spacing.md,
      alignItems: 'flex-start',
      padding: sizes.cardPadding,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    emptyText: typography.bodyMd,
  });
