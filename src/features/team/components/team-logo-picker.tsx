import * as ImagePicker from 'expo-image-picker';
import Camera from 'lucide-react-native/icons/camera';
import Users from 'lucide-react-native/icons/users';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, spacing, typography, useTheme, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

type Props = {
  /** The picked image (a local uri) or the saved logo; empty shows the short name. */
  uri: string | null;
  shortName: string;
  tone: AvatarTone;
  onPick: (uri: string) => void;
  onError: (message: string) => void;
  /** True while the picked image uploads; the picker shows a spinner and does not open again. */
  saving?: boolean;
  size?: number;
};

const LIMIT = Platform.OS === 'web' ? 2_000_000 : 8_000_000;

/** The team's profile picture with a camera badge; tap to choose a square photo from the library. */
export function TeamLogoPicker({ uri, shortName, tone, onPick, onError, saving = false, size = dp(88) }: Props) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const [opening, setOpening] = useState(false);
  const pending = useRef(false);

  async function pick() {
    if (pending.current || saving) return;
    pending.current = true;
    setOpening(true);
    onError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.75, base64: Platform.OS === 'web',
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) throw new Error('No image was returned. Please choose another photo.');
      if ((asset.fileSize ?? 0) > LIMIT) throw new Error(`Choose an image smaller than ${LIMIT / 1_000_000} MB.`);
      onPick(Platform.OS === 'web' && asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Could not open your photos. Please try again.');
    } finally {
      pending.current = false;
      setOpening(false);
    }
  }

  const busy = opening || saving;
  return (
    <View style={s.wrap}>
      <Pressable accessibilityRole="button" accessibilityLabel={uri ? 'Change team picture' : 'Add team picture'}
        accessibilityState={{ busy }} onPress={() => void pick()} style={({ pressed }) => [pressed && s.pressed]}>
        {uri || shortName ? <InitialsAvatar label={shortName || 'T'} tone={tone} imageUri={uri || undefined} size={size} /> : (
          // Before a picture or a short name there is nothing to show yet: a team icon, not a question mark.
          <View style={[s.empty, { width: size, height: size }]}><Users size={size * 0.4} color={colors.link} /></View>
        )}
        <View style={[s.badge, { borderColor: colors.background }]}>
          {busy ? <ActivityIndicator size="small" color={colors.primaryText} /> : <Camera size={dp(16)} color={colors.primaryText} />}
        </View>
      </Pressable>
      <Text style={s.hint}>{uri ? 'Tap to change the team picture' : 'Add a team picture'}</Text>
    </View>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.8 },
  empty: { borderRadius: radius.pill, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', right: -dp(2), bottom: -dp(2), width: dp(32), height: dp(32), borderRadius: radius.pill,
    backgroundColor: c.primary, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  hint: { ...typography.bodySm, color: c.textMuted },
});
