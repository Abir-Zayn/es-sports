import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';

type Props = {
  short: string;
  size?: number;
  badgeBg?: string;
  badgeText?: string;
  borderWidth?: number;
};

/** Compact team badge circle with authentic team colors. */
export function KnockoutTeamBadge({
  short,
  size = 18,
  badgeBg = '#1E3A8A',
  badgeText = '#FFFFFF',
  borderWidth = 1,
}: Props) {
  const fontSize = Math.max(7, Math.round(size * 0.42));
  const borderRadius = size / 2;

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: badgeBg,
          borderWidth,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize,
            lineHeight: fontSize + 2,
            color: badgeText,
          },
        ]}
        numberOfLines={1}
      >
        {short.slice(0, 3)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  text: {
    fontWeight: '800',
    textAlign: 'center',
  },
});

