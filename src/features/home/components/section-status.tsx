import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { radius, sizes, useThemedStyles, type Palette } from '@/theme';

import { HomeEmptyState } from './home-empty-state';

export type LoadStatus = 'loading' | 'error' | 'ready';

/** Maps a React Query result to the three states a Home section can be in. */
export const loadStatusOf = (query: { isLoading: boolean; isError: boolean; data?: unknown }): LoadStatus =>
  query.data !== undefined ? 'ready' : query.isError ? 'error' : query.isLoading ? 'loading' : 'ready';

type Props = {
  status: Exclude<LoadStatus, 'ready'>;
  /** What failed, e.g. "live matches". */
  what: string;
  /** Height of the placeholder, close to the content it stands in for so nothing jumps. */
  height: number;
  onRetry: () => void;
};

/** A section's loading placeholder or its error with a retry. The section header stays put either way. */
export function SectionStatus({ status, what, height, onRetry }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  if (status === 'error') {
    return (
      <HomeEmptyState
        title={t('home.status.loadErrorTitle', { what })}
        message={t('home.status.loadErrorMessage')}
        action={t('common.retry')}
        onAction={onRetry}
      />
    );
  }
  return <View style={[styles.placeholder, { height }]} accessible accessibilityLabel={t('home.status.loading', { what })} accessibilityRole="progressbar" />;
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    placeholder: { marginHorizontal: sizes.gutter, borderRadius: radius.lg, backgroundColor: colors.surfaceRaised },
  });
