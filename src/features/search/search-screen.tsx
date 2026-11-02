import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, AppTabs, SearchField, Text } from '@/components/ui';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { RecentSearches } from './components/recent-searches';
import { ResultRow } from './components/result-row';
import { clearSearches, saveSearch, useRecentSearches } from './recent-history';
import { searchAll, searchTabs, type SearchGroup, type SearchGroupId, type SearchRow, type SearchTab } from './sample-data';
import { usePlayerResults } from './use-player-results';

export function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('all');
  const recentSearches = useRecentSearches();

  const hasQuery = query.trim().length > 0;
  // Teams and tournaments are still sample data; players are real accounts, found by name or by a pasted user id.
  const sample = searchAll(query, tab);
  const players = usePlayerResults(query, tab === 'all' || tab === 'players');
  const playerGroups: SearchGroup[] = players.rows.length > 0 ? [{ id: 'players', title: 'Players', rows: players.rows }] : [];
  const groups = [...sample.filter((g) => g.id === 'teams'), ...playerGroups, ...sample.filter((g) => g.id === 'tournaments')];

  function openResult(row: SearchRow, group: SearchGroupId) {
    saveSearch(query);
    if (group === 'players') {
      router.push({ pathname: '/player/[id]', params: { id: row.id, name: row.name, role: row.role ?? '' } });
    } else if (group === 'teams') {
      router.push({ pathname: '/team/[id]', params: { id: row.id } });
    } else {
      router.push({ pathname: '/tournament/[id]', params: { id: row.id } });
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <AppIconTile
            icon={ChevronLeft}
            size={44}
            borderRadius={radius.pill}
            backgroundColor={colors.surface}
            borderColor={colors.border}
            borderWidth={1}
            accessibilityLabel="Back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          />
          <SearchField
            value={query}
            onChangeText={setQuery}
            onSubmit={() => saveSearch(query)}
            placeholder="Tournaments, teams, players or user ID"
            accessibilityLabel="Search tournaments, teams, players"
            autoFocus
          />
        </View>

        <AppTabs tabs={searchTabs} selected={tab} onSelect={setTab} />

        {!hasQuery ? <RecentSearches searches={recentSearches} onPick={(value) => { setQuery(value); saveSearch(value); }} onClear={clearSearches} /> : null}

        {hasQuery && players.waiting ? <ActivityIndicator accessibilityLabel="Searching players" color={colors.link} /> : null}
        {players.failed ? <Text muted accessibilityLiveRegion="polite">Player search failed. Check your connection and try again.</Text> : null}

        {hasQuery && groups.length === 0 && !players.waiting && !players.failed ? (
          <View style={styles.empty}>
            <Text variant="heading">No results</Text>
            <Text muted>Nothing matches “{query.trim()}”. Check the spelling, paste a full user ID, or try another tab.</Text>
          </View>
        ) : null}

        {groups.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text accessibilityRole="header" style={styles.groupTitle}>
              {group.title.toUpperCase()}
            </Text>
            {group.rows.map((row) => (
              <ResultRow key={row.id} row={row} onPress={() => openResult(row, group.id)} />
            ))}
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: sizes.gutter, gap: 18 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    group: { gap: spacing.xs },
    groupTitle: {
      marginBottom: 6,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: colors.textMuted,
    },
    empty: { gap: spacing.sm, paddingTop: spacing.lg },
  });
