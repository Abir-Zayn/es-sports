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
  onInvite?: (user: UserSummary) => void;
  /** When provided, lets the user select multiple people before confirming. */
  onInviteMany?: (users: UserSummary[]) => void;
  /** Maximum number of people that can be selected in multi-select mode. */
  maxSelect?: number;
  onClose: () => void;
  /** The button on each result. */
  actionLabel?: string;
  search?: (query: string, excludeIds: string[], signal?: AbortSignal) => Promise<UserSummary[]>;
  suggest?: (excludeIds: string[], signal?: AbortSignal) => Promise<UserSummary[]>;
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

function SearchBody({ hint, excludeIds, inviting, error, onInvite, onInviteMany, maxSelect, actionLabel = 'Invite', children, suggest, search: findUsers = searchUsers }: Omit<Props, 'visible' | 'title' | 'onClose'>) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<UserSummary[]>([]);
  const multi = Boolean(onInviteMany);
  const pickedIds = new Set(picked.map((u) => u.id));
  const atLimit = maxSelect !== undefined && picked.length >= maxSelect;

  function togglePick(user: UserSummary) {
    setPicked((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev.filter((u) => u.id !== user.id);
      if (maxSelect !== undefined && prev.length >= maxSelect) return prev;
      return [...prev, user];
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const search = useQuery({
    queryKey: ['user-search', findUsers === searchUsers ? 'sample' : 'profiles', query, excludeIds],
    queryFn: ({ signal }) => findUsers(query, excludeIds, signal),
    enabled: query.length >= 2,
  });
  const suggestions = useQuery({
    queryKey: ['owner-suggestions', findUsers === searchUsers ? 'sample' : 'profiles', excludeIds],
    queryFn: ({ signal }) => suggest!(excludeIds, signal),
    enabled: Boolean(suggest) && text.trim().length === 0,
    staleTime: 60_000,
  });
  const showingSuggestions = Boolean(suggest) && text.trim().length === 0;
  const active = showingSuggestions ? suggestions : search;
  const results = active.data ?? [];

  return (
    <>
      <Text muted>{hint}</Text>
      {children}
      {/* SearchField grows along its parent's main axis; a row makes that its width, not its height. */}
      <View style={styles.searchRow}>
        <SearchField value={text} onChangeText={setText} placeholder="Search players by name" accessibilityLabel="Search players by name" autoFocus={!suggest} />
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
        {showingSuggestions ? <Text muted>Suggested players</Text> : null}
        {!showingSuggestions && (text.trim().length < 2 || query !== text.trim()) ? (
          <Text muted>Type at least two letters of their name.</Text>
        ) : active.isPending ? (
          <ActivityIndicator color={colors.link} accessibilityLabel="Searching" style={styles.status} />
        ) : active.isError ? (
          <Text muted accessibilityLiveRegion="polite">
            Search failed. Check your connection and try again.
          </Text>
        ) : results.length === 0 ? (
          <Text muted accessibilityLiveRegion="polite">
            {showingSuggestions ? 'No suggestions available. Search for a player by name.' : `No one found for “${query}”.`}
          </Text>
        ) : (
          results.map((user) => {
            const isSelected = multi && pickedIds.has(user.id);
            return (
              <PersonRow
                key={user.id}
                user={user}
                detail={user.area}
                trailing={
                  <View>
                    {multi ? (
                      <Button
                        label={isSelected ? 'Selected' : 'Select'}
                        variant={isSelected ? 'primary' : 'secondary'}
                        size="compact"
                        disabled={inviting || (!isSelected && atLimit)}
                        accessibilityLabel={isSelected ? `Deselect ${user.name}` : `Select ${user.name}`}
                        onPress={() => togglePick(user)}
                      />
                    ) : (
                      <Button
                        label={actionLabel}
                        size="compact"
                        disabled={inviting}
                        accessibilityLabel={`${actionLabel} ${user.name}`}
                        onPress={() => onInvite?.(user)}
                      />
                    )}
                  </View>
                }
              />
            );
          })
        )}
      </ScrollView>
      {multi ? (
        <View style={styles.footer}>
          <Text variant="caption" muted>
            {maxSelect !== undefined ? `${picked.length} of ${maxSelect} selected` : `${picked.length} selected`}
          </Text>
          <Button
            label={picked.length === 0 ? `${actionLabel} players` : `${actionLabel} ${picked.length} ${picked.length === 1 ? 'player' : 'players'}`}
            loading={inviting}
            disabled={picked.length === 0 || inviting}
            onPress={() => onInviteMany?.(picked)}
          />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row' },
  // Takes the rest of the sheet and scrolls inside it.
  list: { flex: 1 },
  results: { paddingBottom: spacing.lg },
  status: { paddingVertical: spacing.lg },
  footer: { gap: spacing.sm, paddingTop: spacing.sm },
});
