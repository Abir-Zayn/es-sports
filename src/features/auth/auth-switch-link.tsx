import { Link, type Href } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

type Props = { prompt: string; action: string; href: Href; replace?: boolean };

/** "Don't have an account? Create one!" style footer line. */
export function AuthSwitchLink({ prompt, action, href, replace }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <Text muted style={styles.line}>
      {prompt}{' '}
      <Link href={href} replace={replace} style={styles.action}>
        {action}
      </Link>
    </Text>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    line: { textAlign: 'center', paddingVertical: spacing.sm },
    action: { color: colors.link, fontWeight: '700' },
  });
