import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Share2 from 'lucide-react-native/icons/share-2';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, InitialsAvatar, Text } from '@/components/ui';
import { useToneColors } from '@/features/tournament/use-tone-colors';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { TeamInfo } from '@/types/cricket';

type Props = {
  team: TeamInfo;
  captain: string;
  location: string;
  following: boolean;
  onToggleFollow: () => void;
  onBack: () => void;
  onShare: () => void;
};

/** Top of the team page: banner in the team's colour, avatar, name, captain and location, and a follow button. */
export function TeamHero({ team, captain, location, following, onToggleFollow, onBack, onShare }: Props) {
  const { colors } = useTheme();
  const toneColors = useToneColors();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const tint = toneColors(team.tone).fill;
  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
      <Svg width="100%" height={340} viewBox="0 0 390 340" preserveAspectRatio="xMidYMin slice" style={styles.art}>
        <Path d="M-20 300 C110 270 250 170 420 100 L420 150 C270 210 130 300 -20 330 Z" fill={tint} opacity={0.18} />
        <Path d="M-20 336 C130 304 272 206 420 156 L420 172 C282 222 140 322 -20 352 Z" fill={tint} opacity={0.1} />
      </Svg>

      <View style={styles.actions}>
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
          iconSize={18}
          accessibilityLabel="Share team"
          onPress={onShare}
        />
      </View>

      <View style={styles.identity}>
        <InitialsAvatar
          label={team.short}
          tone={team.tone}
          imageUri={team.avatarUri}
          size={96}
          borderColor={tint}
          borderWidth={3}
        />
        <Text accessibilityRole="header" style={styles.name}>
          {team.name}
        </Text>
        <Text muted style={styles.meta}>
          Captain {captain} · {location}
        </Text>
        <Button
          size="compact"
          variant={following ? 'secondary' : 'primary'}
          label={following ? 'Following' : 'Follow team'}
          accessibilityState={{ selected: following }}
          onPress={onToggleFollow}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    hero: { paddingHorizontal: sizes.gutter, paddingBottom: 22, backgroundColor: colors.primarySoft, overflow: 'hidden' },
    art: { position: 'absolute', top: 0, left: 0 },
    actions: { flexDirection: 'row', justifyContent: 'space-between' },
    identity: { marginTop: 8, alignItems: 'center', gap: 12 },
    name: { fontSize: 28, lineHeight: 32, fontWeight: '800', textAlign: 'center' },
    meta: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  });
