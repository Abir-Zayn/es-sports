import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { Tournament } from '../sample-data';

export const TOURNAMENT_CARD_WIDTH = 250;
const BANNER_HEIGHT = 96;

type Props = { tournament: Tournament; onPress?: () => void };

export function TournamentCard({ tournament, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tournament.name}, ${tournament.meta}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.banner}>
        <Svg width={TOURNAMENT_CARD_WIDTH} height={BANNER_HEIGHT} viewBox="0 0 250 96" style={styles.art}>
          <Path d="M-10 80 C70 60 150 20 260 -6 L260 22 C160 44 80 82 -10 100 Z" fill={colors.primary} />
          <Path d="M-10 104 C80 86 166 50 260 28 L260 40 C170 62 86 96 -10 112 Z" fill={colors.primaryDeep} />
        </Svg>
        <View style={styles.logo}>
          <Text style={styles.logoText}>{tournament.short}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.info}>
          <Text style={styles.name}>{tournament.name}</Text>
          <Text style={styles.meta}>{tournament.meta}</Text>
        </View>
        <View style={styles.view}>
          <Text style={styles.viewText}>View</Text>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      width: TOURNAMENT_CARD_WIDTH,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    pressed: { opacity: 0.85 },
    banner: { height: BANNER_HEIGHT, backgroundColor: colors.primarySoft },
    art: { position: 'absolute', top: 0, left: 0 },
    logo: {
      position: 'absolute',
      left: 14,
      bottom: -22,
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: { fontSize: 18, lineHeight: 22, fontWeight: '800', fontStyle: 'italic', color: colors.link },
    body: { paddingTop: 30, paddingHorizontal: 14, paddingBottom: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    info: { flex: 1, minWidth: 0, gap: spacing.xs },
    name: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
    meta: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
    view: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.primary,
      justifyContent: 'center',
    },
    viewText: { fontSize: 13, lineHeight: 16, fontWeight: '700', color: colors.link },
  });
