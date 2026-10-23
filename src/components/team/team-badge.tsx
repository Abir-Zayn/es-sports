import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

type Props = { short: string; color: string; size?: number };

/** A team's colour circle with its initials. */
export function TeamBadge({ short, color, size = 36 }: Props) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ color: colors.primaryText, fontSize: Math.round(size * 0.4), lineHeight: Math.round(size * 0.5), fontWeight: '800' }}>
        {short}
      </Text>
    </View>
  );
}
