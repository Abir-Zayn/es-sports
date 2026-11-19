import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppTabs, SegmentedControl, Text } from '@/components/ui';
import { QuadrantSplitCards } from '@/features/match/components/quadrant-split-cards';
import { WagonLegend } from '@/features/match/components/wagon-legend';
import { WagonWheel } from '@/features/match/components/wagon-wheel';
import { matchesFilter, type ShotFilter } from '@/features/match/utils/wagon-geometry';
import { useTranslation } from '@/i18n';
import { quadrantSplit } from '@/lib/pitch-quadrant';
import { dp, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { ScoreState } from '../types';
import type { InningsSide } from './innings-sides';

type Props = { sides: InningsSide[]; teams: ScoreState['teams']; empty: (message: string) => React.ReactNode };

const WHOLE_TEAM = 'team';

/**
 * Where the runs came from, one team at a time (the switch on the right of the heading), narrowed to one batter
 * or kept to the whole team, and filtered to 1–3s, 4s or 6s. Each filter shows how many shots it holds.
 */
export function ShotMap({ sides, teams, empty }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [code, setCode] = useState(sides[0].code);
  const [batterId, setBatterId] = useState(WHOLE_TEAM);
  const [filter, setFilter] = useState<ShotFilter>('all');
  const side = sides.find((s) => s.code === code) ?? sides[0];
  const team = teams[side.code];
  const hitters = side.batters.filter((b) => side.shots.some((s) => s.batterId === b.id));
  const batter = hitters.find((b) => b.id === batterId) ?? null;
  const scoped = batter ? side.shots.filter((s) => s.batterId === batter.id) : side.shots;
  const shots = scoped.filter((s) => matchesFilter(s, filter));
  const count = (f: ShotFilter) => scoped.filter((s) => matchesFilter(s, f)).length;
  const pickTeam = (next: typeof code) => { setCode(next); setBatterId(WHOLE_TEAM); };
  const filters: { id: ShotFilter; label: string }[] = [
    { id: 'all', label: `${t('match.wagon.filterAll')} · ${count('all')}` },
    { id: 'runs', label: `${t('match.wagon.filterRuns')} · ${count('runs')}` },
    { id: 'fours', label: `${t('match.wagon.filterFours')} · ${count('fours')}` },
    { id: 'sixes', label: `${t('match.wagon.filterSixes')} · ${count('sixes')}` },
  ];
  const who = batter?.name ?? team.name;
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={styles.title} numberOfLines={2}>{t('scoring.result.whereRunsCameFrom')}</Text>
        <View style={styles.teamSwitch}>
          <SegmentedControl options={sides.map((s) => ({ id: s.code, label: teams[s.code].short }))} selected={side.code}
            onSelect={pickTeam} height={dp(34)} accessibilityLabel={t('scoring.result.teamSwitchA11y')} />
        </View>
      </View>
      {side.shots.length === 0 ? empty(t('scoring.result.noShotsTeam', { team: team.name })) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={t('scoring.result.batterFilterA11y')}>
            <AppTabs tabs={[{ id: WHOLE_TEAM, label: t('scoring.result.wholeTeam', { team: team.short }) }, ...hitters.map((b) => ({ id: b.id, label: b.name }))]}
              selected={batter?.id ?? WHOLE_TEAM} onSelect={setBatterId} />
          </ScrollView>
          <AppTabs tabs={filters} selected={filter} onSelect={setFilter} />
          <WagonWheel shots={shots} filter="all" accessibilityLabel={t('scoring.result.shotMapA11y', { count: shots.length, who })} />
          <WagonLegend />
          <QuadrantSplitCards split={quadrantSplit(shots)} />
        </>
      )}
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  section: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { ...typography.headlineMd, flex: 1, color: c.text },
  teamSwitch: { width: dp(132) },
});
