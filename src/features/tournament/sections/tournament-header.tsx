import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Share2 from 'lucide-react-native/icons/share-2';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBadge, AppIconTile, Button, InitialsAvatar, Text } from '@/components/ui';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { TournamentOverview } from '@/types/cricket';

const BANNER_HEIGHT = 210;
const LOGO_SIZE = 80;

type Props = {
  tournament: TournamentOverview;
  following: boolean;
  onToggleFollow: () => void;
  onBack: () => void;
  onShare: () => void;
};

/** Banner with back and share, the tournament logo and name, a follow button, and its status. */
export function TournamentHeader({ tournament, following, onToggleFollow, onBack, onShare }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  return (
    <View>
      <View style={styles.banner}>
        <Svg width="100%" height={BANNER_HEIGHT} viewBox="0 0 390 210" preserveAspectRatio="xMidYMid slice" style={styles.art}>
          <Path d="M-20 190 C110 160 250 70 420 10 L420 70 C270 120 130 200 -20 236 Z" fill={colors.primary} />
          <Path d="M-20 244 C130 206 272 128 420 78 L420 100 C282 146 140 224 -20 262 Z" fill={colors.primaryDeep} />
          <SvgText x={372} y={150} textAnchor="end" fontSize={96} fontWeight="800" fontStyle="italic" fill={colors.text} opacity={0.06}>
            {tournament.short}
          </SvgText>
        </Svg>
        <View style={[styles.bannerActions, { top: insets.top + spacing.sm }]}>
          <AppIconTile
            icon={ChevronLeft}
            size={44}
            borderRadius={radius.pill}
            backgroundColor={colors.overlay}
            accessibilityLabel="Back"
            onPress={onBack}
          />
          <AppIconTile
            icon={Share2}
            size={44}
            borderRadius={radius.pill}
            backgroundColor={colors.overlay}
            accessibilityLabel="Share tournament"
            onPress={onShare}
          />
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.logoRow}>
          <InitialsAvatar
            label={tournament.short}
            tone={tournament.tone}
            imageUri={tournament.avatarUri}
            size={LOGO_SIZE}
            shape="square"
            borderColor={colors.primary}
            borderWidth={2}
          />
          <Button
            size="compact"
            variant={following ? 'secondary' : 'primary'}
            label={following ? 'Following' : 'Follow'}
            accessibilityState={{ selected: following }}
            onPress={onToggleFollow}
          />
        </View>
        <View style={styles.titles}>
          <Text accessibilityRole="header" style={styles.name}>
            {tournament.name}
          </Text>
          <Text style={styles.meta}>{tournament.meta}</Text>
        </View>
        <View style={styles.status}>
          <AppBadge dot label={tournament.statusLabel} backgroundColor={colors.primarySoft} color={colors.link} />
          <Text style={styles.progress}>{tournament.progress}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    banner: { height: BANNER_HEIGHT, backgroundColor: colors.primarySoft, overflow: 'hidden' },
    art: { position: 'absolute', top: 0, left: 0 },
    bannerActions: {
      position: 'absolute',
      left: sizes.gutter,
      right: sizes.gutter,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    info: { paddingHorizontal: sizes.gutter, marginTop: -40, gap: 14 },
    logoRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    titles: { gap: 6 },
    name: { fontSize: 28, lineHeight: 32, fontWeight: '800' },
    meta: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
    status: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    progress: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  });
