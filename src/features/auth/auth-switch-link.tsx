import { Link, type Href } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

type Props = { prompt: string; action: string; href: Href; replace?: boolean };

/** "Don't have an account? Create one!" style footer line. */
export function AuthSwitchLink({ prompt, action, href, replace }: Props) {
  return (
    <Text muted style={styles.line}>
      {prompt}{' '}
      <Link href={href} replace={replace} style={styles.action}>
        {action}
      </Link>
    </Text>
  );
}

const styles = StyleSheet.create({
  line: { textAlign: 'center', paddingVertical: spacing.sm },
  action: { color: colors.primary, fontWeight: '700' },
});
