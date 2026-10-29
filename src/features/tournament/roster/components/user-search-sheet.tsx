import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button, SearchField, Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

import { searchUsers } from '../roster-repository';
import type { UserSummary } from '../types';
import { PersonRow } from './person-row';
import { Sheet } from './sheet';

const DEBOUNCE_MS = 300;

type Props = {
  visible: boolean;
  title: string;
  /** Shown above the search, e.g. what the invite gives them. */
  hint: string;
  /** People already in the roster, left out of the results. */
  excludeIds: string[];
  /** Sending an invite. The sheet closes once it succeeds. */
  inviting: boolean;
  error: string | null;
  onInvite: (user: UserSummary) => void;
  onClose: () => void;
  /** The button on each result. */
  actionLabel?: string;
  /** Fields shown under the hint that apply to whoever is picked, e.g. their playing role. */
  children?: ReactNode;
};

/** Finds a person by name and sends them an invite. Typing is debounced and stale searches are cancelled. */
export function UserSearchSheet({ visible, title, onClose, ...body }: Props) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose} fill>
      {/* Mounted only while open, so every opening starts with an empty search. */}
      {visible ? <SearchBody {...body} /> : null}
    </Sheet>
  );
}

function SearchBody({ hint, excludeIds, inviting, error, onInvite, actionLabel = 'Invite', children }: Omit<Props, 'visible' | 'title' | 'onClose'>) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const search = useQuery({
    queryKey: ['user-search', query, excludeIds],
    queryFn: ({ signal }) => searchUsers(query, excludeIds, signal),
    enabled: query.length >= 2,
  });
  const results = search.data ?? [];

  return (
    <>
      <Text muted>{hint}</Text>
      {children}
      {/* SearchField grows along its parent's main axis; a row makes that its width, not its height. */}
      <View style={styles.searchRow}>
        <SearchField value={text} onChangeText={setText} placeholder="Search players by name" accessibilityLabel="Search players by name" autoFocus />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>
          {error}
        </Text>
      ) : null}
      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.results}
      >
        {query.length < 2 ? (
          <Text muted>Type at least two letters of their name.</Text>
        ) : search.isPending ? (
          <ActivityIndicator color={colors.link} accessibilityLabel="Searching" style={styles.status} />
        ) : search.isError ? (
          <Text muted accessibilityLiveRegion="polite">
            Search failed. Check your connection and try again.
          </Text>
        ) : results.length === 0 ? (
          <Text muted accessibilityLiveRegion="polite">
            No one found for “{query}”.
          </Text>
        ) : (
          results.map((user) => (
            <PersonRow
              key={user.id}
              user={user}
              detail={user.area}
              trailing={
                <View>
                  <Button
                    label={actionLabel}
                    size="compact"
                    disabled={inviting}
                    accessibilityLabel={`${actionLabel} ${user.name}`}
                    onPress={() => onInvite(user)}
                  />
                </View>
              }
            />
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row' },
  // Takes the rest of the sheet and scrolls inside it.
  list: { flex: 1 },
  results: { paddingBottom: spacing.lg },
  status: { paddingVertical: spacing.lg },
});
