import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

import { MatchNotFoundError } from '../use-live-match-data';

type Props = {
  /** The spectator query while it has no match to show yet. */
  query: { error: unknown; isError: boolean; isFetching: boolean; refetch: () => unknown };
  /** What is loading, read aloud with the spinner, for example "Loading scorecard". */
  label: string;
};

/** Stands in for a match screen's content until the match loads: a spinner, or why it failed and a retry. */
export function MatchLoadState({ query, label }: Props) {
  const { colors } = useTheme();
  if (!query.isError) return <ActivityIndicator accessibilityLabel={label} color={colors.link} />;
  const missing = query.error instanceof MatchNotFoundError;
  return <View style={styles.box} accessibilityLiveRegion="polite">
    <Text muted>{missing ? 'This match could not be found. It may have been removed, or this account cannot see it.'
      : 'Could not load this match. Check your connection and try again.'}</Text>
    {missing ? null : <Button label="Try again" loading={query.isFetching} onPress={() => void query.refetch()} />}
  </View>;
}

/** Shown above a match that loaded earlier when the latest refresh failed, so an old score is not taken as live. */
export function StaleMatchNote({ query }: { query: { isRefetchError: boolean } }) {
  if (!query.isRefetchError) return null;
  return <Text muted accessibilityLiveRegion="polite">Could not refresh. Showing the last saved score.</Text>;
}

const styles = StyleSheet.create({ box: { gap: spacing.md } });
