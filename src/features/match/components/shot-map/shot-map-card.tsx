import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppTabs, Card, SegmentedControl, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { quadrantSplit } from '@/lib/pitch-quadrant';
import { dp, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { ShotMapTeam, WagonBatter } from '../../types';
import { matchesFilter, type ShotFilter } from '../../utils/wagon-geometry';
import { QuadrantSplitCards } from '../quadrant-split-cards';
import { WagonLegend } from '../wagon-legend';
import { WagonWheel } from '../wagon-wheel';
import { KeyFigures, SideBar } from './shot-figures';

type Props = {
  batters: WagonBatter[];
  /** Every side to offer in the switch, in batting order, including one with no recorded shots. Defaults to the batters' teams. */
  teams?: ShotMapTeam[];
  /** Shown in place of the map for a side with no recorded shots. */
  empty?: (message: string) => ReactNode;
};

const WHOLE = 'all';
const NO_TEAM: ShotMapTeam = { key: '', name: '', short: '' };

/**
 * The shot map, for viewers of a live match and for the scorer's match summary alike: one side at a time (switch on
 * the right), the whole side or one batter, the field as the scorer drew it, the key figures, and shot-type filters
 * with counts. Under it, where the runs went: off against leg, then the four zones.
 */
export function ShotMapCard({ batters, teams, empty }: Props) {
  const s = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const sides = teams ?? [...new Map(batters.map((b) => [b.team?.key ?? '', b.team ?? NO_TEAM])).values()];
  const [teamKey, setTeamKey] = useState(sides[0]?.key ?? '');
  const [batterId, setBatterId] = useState(WHOLE);
  const [filter, setFilter] = useState<ShotFilter>('all');
  const team = sides.find((x) => x.key === teamKey) ?? sides[0] ?? NO_TEAM;
  const hitters = batters.filter((b) => (b.team?.key ?? '') === team.key && b.shots.length > 0);
  const batter = hitters.find((b) => b.id === batterId) ?? null;
  const scoped = batter ? batter.shots : hitters.flatMap((b) => b.shots);
  const shown = scoped.filter((x) => matchesFilter(x, filter));
  const count = (f: ShotFilter) => scoped.filter((x) => matchesFilter(x, f)).length;
  const pickTeam = (key: string) => { setTeamKey(key); setBatterId(WHOLE); };
  const filters = (['all', 'runs', 'fours', 'sixes'] as const).map((id) => ({
    id, label: `${t(id === 'all' ? 'match.wagon.filterAll' : id === 'runs' ? 'match.wagon.filterRuns' : id === 'fours' ? 'match.wagon.filterFours' : 'match.wagon.filterSixes')} · ${count(id)}`,
  }));
  const who = batter?.name ?? (team.name || t('match.wagon.allBatters'));
  const chips = [
    { id: WHOLE, label: team.short ? t('match.wagon.allTeam', { team: team.short }) : t('match.wagon.allBatters') },
    ...hitters.map((b) => ({ id: b.id, label: b.score ? `${b.name} ${b.score}` : b.name })),
  ];
  return (
    <View style={s.stack}>
      <Card style={s.card}>
        <View style={s.head}>
          <Text accessibilityRole="header" style={s.title}>{t('match.wagon.title')}</Text>
          {sides.length > 1 ? (
            <View style={s.switch}>
              <SegmentedControl options={sides.map((x) => ({ id: x.key, label: x.short }))} selected={team.key} onSelect={pickTeam}
                height={dp(34)} accessibilityLabel={t('match.wagon.teamA11y')} />
            </View>
          ) : null}
        </View>
        {hitters.length === 0 && empty ? empty(t('match.wagon.noShotsTeam', { team: team.name })) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={t('match.wagon.batterA11y')}>
              <AppTabs tabs={chips} selected={batter?.id ?? WHOLE} onSelect={setBatterId} />
            </ScrollView>
            <WagonWheel shots={shown} accessibilityLabel={t('match.wagon.mapA11y', { count: shown.length, who })} />
            <WagonLegend />
            <KeyFigures shots={scoped} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <AppTabs tabs={filters} selected={filter} onSelect={setFilter} />
            </ScrollView>
          </>
        )}
      </Card>
      {scoped.length > 0 ? (
        <Card style={s.card}>
          <Text accessibilityRole="header" style={s.title}>{t('match.wagon.splitTitle')}</Text>
          <SideBar shots={shown} />
          <QuadrantSplitCards split={quadrantSplit(shown)} />
        </Card>
      ) : null}
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  stack: { gap: spacing.md },
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: dp(34) },
  title: { ...typography.headlineMd, flex: 1, color: c.text },
  switch: { width: dp(132) },
});
