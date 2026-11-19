import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { spacing, useTheme } from '@/theme';

import { MatchNotFoundError } from '../server/use-live-match-data';

type Props = {
  /** The spectator query while it has no match to show yet. */
  query: { error: unknown; isError: boolean; isFetching: boolean; refetch: () => unknown };
  /** What is loading, read aloud with the spinner, for example "Loading scorecard". */
  label: string;
};

/** Stands in for a match screen's content until the match loads: a spinner, or why it failed and a retry. */
export function MatchLoadState({ query, label }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (!query.isError) return <ActivityIndicator accessibilityLabel={label} color={colors.link} />;
  const missing = query.error instanceof MatchNotFoundError;
  return <View style={styles.box} accessibilityLiveRegion="polite">
    <Text muted>{missing ? t('match.notFoundDetail') : t('match.loadError')}</Text>
    {missing ? null : <Button label={t('common.retry')} loading={query.isFetching} onPress={() => void query.refetch()} />}
  </View>;
}

/** Shown above a match that loaded earlier when the latest refresh failed, so an old score is not taken as live. */
export function StaleMatchNote({ query }: { query: { isRefetchError: boolean } }) {
  const { t } = useTranslation();
  if (!query.isRefetchError) return null;
  return <Text muted accessibilityLiveRegion="polite">{t('match.staleNote')}</Text>;
}

const styles = StyleSheet.create({ box: { gap: spacing.md } });
