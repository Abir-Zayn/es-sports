import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, spacing, typography, useTheme, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

export type Tournament = { id: string; short: string; name: string; meta: string; tone: AvatarTone; avatarUri?: string };

export const TOURNAMENT_CARD_WIDTH = dp(250);
const BANNER_HEIGHT = dp(96);

type Props = { tournament: Tournament; onPress?: () => void };

export function TournamentCard({ tournament, onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tournament.name}, ${tournament.meta}`}
      accessibilityHint={t('home.tournamentCard.openHint')}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.banner}>
        <Svg width={TOURNAMENT_CARD_WIDTH} height={BANNER_HEIGHT} viewBox="0 0 250 96" style={styles.art}>
          <Path d="M-10 80 C70 60 150 20 260 -6 L260 22 C160 44 80 82 -10 100 Z" fill={colors.primary} />
          <Path d="M-10 104 C80 86 166 50 260 28 L260 40 C170 62 86 96 -10 112 Z" fill={colors.primaryDeep} />
        </Svg>
      </View>
      <View style={styles.logo}>
        <InitialsAvatar
          label={tournament.short}
          tone={tournament.tone}
          imageUri={tournament.avatarUri}
          size={dp(48)}
          shape="square"
          borderColor={colors.surface}
          borderWidth={2}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {tournament.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {tournament.meta}
          </Text>
        </View>
        <View style={styles.view}>
          <Text style={styles.viewText}>{t('home.tournamentCard.view')}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      width: TOURNAMENT_CARD_WIDTH,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    // The banner clips the artwork; the card itself stays unclipped so its shadow shows.
    banner: { height: BANNER_HEIGHT, backgroundColor: colors.primarySoft, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: 'hidden' },
    art: { position: 'absolute', top: 0, left: 0 },
    logo: { position: 'absolute', left: spacing.lg, top: BANNER_HEIGHT - dp(26) },
    body: { paddingTop: dp(30), paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
    info: { flex: 1, minWidth: 0, gap: spacing.xs },
    name: { ...typography.headlineMd, color: colors.text },
    meta: { ...typography.bodySm, color: colors.textMuted },
    view: {
      height: dp(36),
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
    },
    viewText: { ...typography.labelMd, color: colors.link },
  });
