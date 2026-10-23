import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, AppTabs, SearchField, Text } from '@/components/ui';
import { comingSoon } from '@/lib/coming-soon';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { RecentSearches } from './components/recent-searches';
import { ResultRow } from './components/result-row';
import { recentSearches, searchAll, searchTabs, type SearchTab } from './sample-data';

export function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('all');

  const hasQuery = query.trim().length > 0;
  const groups = searchAll(query, tab);

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
            placeholder="Tournaments, teams, players"
            accessibilityLabel="Search tournaments, teams, players"
            autoFocus
          />
        </View>

        <AppTabs tabs={searchTabs} selected={tab} onSelect={setTab} />

        {!hasQuery ? <RecentSearches searches={recentSearches} onPick={setQuery} /> : null}

        {hasQuery && groups.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="heading">No results</Text>
            <Text muted>Nothing matches “{query.trim()}”. Check the spelling or try another tab.</Text>
          </View>
        ) : null}

        {groups.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text accessibilityRole="header" style={styles.groupTitle}>
              {group.title.toUpperCase()}
            </Text>
            {group.rows.map((row) => (
              <ResultRow key={row.id} row={row} onPress={() => comingSoon(group.title)} />
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
