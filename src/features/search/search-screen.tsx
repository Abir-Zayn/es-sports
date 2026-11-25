import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, AppTabs, SearchField, Text } from '@/components/ui';
import { useTranslation, type TranslationKey } from '@/i18n';
import { radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { RecentSearches } from './components/recent-searches';
import { ResultRow } from './components/result-row';
import { clearSearches, saveSearch, useRecentSearches } from './recent-history';
import { searchTabs, type SearchGroupId, type SearchRow, type SearchTab } from './types';
import { useSearchResults } from './use-search-results';

const TAB_LABEL_KEY: Record<SearchTab, TranslationKey> = {
  all: 'search.tabAll',
  tournaments: 'search.tabTournaments',
  teams: 'search.tabTeams',
  players: 'search.tabPlayers',
};

const GROUP_TITLE_KEY: Record<SearchGroupId, TranslationKey> = {
  teams: 'search.groupTeams',
  players: 'search.groupPlayers',
  tournaments: 'search.groupTournaments',
};

export function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('all');
  const recentSearches = useRecentSearches();

  const hasQuery = query.trim().length > 0;
  const { groups, waiting, failed } = useSearchResults(query, tab);
  const localizedTabs = searchTabs.map((id) => ({ id, label: t(TAB_LABEL_KEY[id]) }));

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
            size={sizes.iconButton}
            borderRadius={radius.pill}
            backgroundColor={colors.surface}
            elevated
            accessibilityLabel={t('common.back')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          />
          <SearchField
            value={query}
            onChangeText={setQuery}
            onSubmit={() => saveSearch(query)}
            placeholder={t('search.placeholder')}
            accessibilityLabel={t('search.a11yLabel')}
            autoFocus
          />
        </View>

        <AppTabs tabs={localizedTabs} selected={tab} onSelect={setTab} />

        {!hasQuery ? <RecentSearches searches={recentSearches} onPick={(value) => { setQuery(value); saveSearch(value); }} onClear={clearSearches} /> : null}

        {hasQuery && waiting ? <ActivityIndicator accessibilityLabel={t('search.searching')} color={colors.link} /> : null}
        {failed ? <Text muted accessibilityLiveRegion="polite">{t('search.failed')}</Text> : null}

        {hasQuery && groups.length === 0 && !waiting && !failed ? (
          <View style={styles.empty}>
            <Text variant="heading">{t('search.noResults')}</Text>
            <Text muted>{t('search.noResultsHint', { query: query.trim() })}</Text>
          </View>
        ) : null}

        {groups.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text accessibilityRole="header" style={styles.groupTitle}>
              {t(GROUP_TITLE_KEY[group.id]).toUpperCase()}
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
    content: { paddingHorizontal: sizes.gutter, gap: sizes.sectionGap },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    group: { gap: spacing.sm },
    groupTitle: {
      ...typography.labelUppercase,
      marginBottom: spacing.xs,
      color: colors.textMuted,
    },
    empty: { gap: spacing.sm, paddingTop: spacing.lg },
  });
