import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Share2 from 'lucide-react-native/icons/share-2';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBadge, AppIconTile, Button, InitialsAvatar, Text } from '@/components/ui';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { TournamentOverview } from '@/types/cricket';

const WASH_HEIGHT = 260;
const LOGO_SIZE = 88;
const FOLLOW_MIN_WIDTH = 140;

type Props = {
  tournament: TournamentOverview;
  following: boolean;
  onToggleFollow: () => void;
  onBack: () => void;
  onShare: () => void;
};

/**
 * A soft colour wash with back and share, then everything centred: the logo, the name, the format and venue
 * as chips, the status, and a follow button.
 */
export function TournamentHeader({ tournament, following, onToggleFollow, onBack, onShare }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  // "League + Knockout · T20 · 8 teams · Halishahar Ground" becomes one chip per part.
  const chips = tournament.meta.split(' · ').filter(Boolean);

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <Svg width="100%" height={WASH_HEIGHT} style={styles.wash} accessibilityElementsHidden importantForAccessibility="no">
        <Defs>
          <LinearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.background} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height={WASH_HEIGHT} fill="url(#wash)" />
      </Svg>

      <View style={styles.actions}>
        <AppIconTile icon={ChevronLeft} size={44} borderRadius={radius.pill} backgroundColor={colors.overlay} accessibilityLabel="Back" onPress={onBack} />
        <AppIconTile icon={Share2} size={44} borderRadius={radius.pill} backgroundColor={colors.overlay} accessibilityLabel="Share tournament" onPress={onShare} />
      </View>

      <View style={styles.identity}>
        <InitialsAvatar
          label={tournament.short}
          tone={tournament.tone}
          imageUri={tournament.avatarUri}
          size={LOGO_SIZE}
          shape="square"
          borderColor={colors.background}
          borderWidth={3}
        />
        <Text accessibilityRole="header" style={styles.name}>
          {tournament.name}
        </Text>
        <View style={styles.chips}>
          {chips.map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {chip}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.follow}>
          {/* AppBadge aligns itself to the start, so its wrapper is what gets centred. */}
          <View>
            <AppBadge dot label={tournament.statusLabel} backgroundColor={colors.primarySoft} color={colors.link} />
          </View>
          <View style={styles.followButton}>
            <Button
              size="compact"
              variant={following ? 'secondary' : 'primary'}
              label={following ? 'Following' : 'Follow'}
              accessibilityState={{ selected: following }}
              onPress={onToggleFollow}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    header: { gap: spacing.md },
    wash: { position: 'absolute', top: 0, left: 0 },
    actions: { paddingHorizontal: sizes.gutter, flexDirection: 'row', justifyContent: 'space-between' },
    identity: { paddingHorizontal: sizes.gutter, alignItems: 'center', gap: spacing.md },
    name: { fontSize: 24, lineHeight: 30, fontWeight: '800', textAlign: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: colors.textMuted },
    // The status sits just above the button, closer to it than to the chips, so the two read as one group.
    follow: { alignItems: 'center', gap: spacing.sm },
    followButton: { minWidth: FOLLOW_MIN_WIDTH },
  });
