import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Trophy from 'lucide-react-native/icons/trophy';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

type PhotoProps = { uri: string; onChange: (uri: string) => void; onBusyChange: (busy: boolean) => void; onError: (message: string) => void };

export function CoverPicker(props: PhotoProps) {
  return <TournamentPhotoPicker {...props} kind="cover" />;
}

export function ProfilePhotoPicker(props: PhotoProps) {
  return <TournamentPhotoPicker {...props} kind="profile photo" />;
}

function TournamentPhotoPicker({ uri, onChange, onBusyChange, onError, kind }: PhotoProps & { kind: 'cover' | 'profile photo' }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [busy, setBusy] = useState(false);
  const [failedUri, setFailedUri] = useState('');
  const profile = kind === 'profile photo';
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function pick() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    onBusyChange(true);
    onError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: profile || Platform.OS === 'android', aspect: profile ? [1, 1] : [16, 9], quality: 0.75, base64: Platform.OS === 'web',
      });
      if (!mounted.current || result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) throw new Error('No image was returned. Please choose another photo.');
      const limit = Platform.OS === 'web' ? 2_000_000 : 8_000_000;
      if ((asset.fileSize ?? 0) > limit) throw new Error(`Choose an image smaller than ${limit / 1_000_000} MB.`);
      const nextUri = Platform.OS === 'web' && asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      if (Platform.OS === 'web' && !nextUri.startsWith('data:')) throw new Error('This image could not be saved. Please choose another.');
      onChange(nextUri);
    } catch (cause) {
      if (mounted.current) onError(cause instanceof Error ? cause.message : 'Could not open your photos. Please try again.');
    } finally {
      pending.current = false;
      if (mounted.current) { setBusy(false); onBusyChange(false); }
    }
  }

  function handlePress() {
    if (busy) return;
    if (uri && uri !== failedUri) {
      Alert.alert(
        `Tournament ${profile ? 'profile photo' : 'cover'}`,
        'Choose an action for this image',
        [
          { text: 'Change photo', onPress: () => { void pick(); } },
          { text: 'Remove', style: 'destructive', onPress: () => onChange('') },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } else {
      void pick();
    }
  }

  return <View style={profile ? styles.profileWrap : styles.wrap}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${uri ? 'Change' : 'Add'} tournament ${kind}`}
      accessibilityState={{ busy, disabled: busy }} disabled={busy} onPress={handlePress}
      style={({ pressed }) => [profile ? styles.profile : styles.cover, pressed && styles.pressed]}>
      {uri && uri !== failedUri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`Tournament ${kind}`}
        onError={() => { setFailedUri(uri); onError(`This ${kind} is unavailable. Tap to choose another photo.`); }} /> : profile ? <Trophy size={28} color={colors.link} strokeWidth={1.5} /> : (
        <Svg viewBox="0 0 360 200" width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Circle cx="65" cy="210" r="190" stroke={colors.primaryDeep} strokeWidth="1" fill="none" opacity="0.4" />
          <Circle cx="65" cy="210" r="135" stroke={colors.primaryDeep} strokeWidth="1" fill="none" opacity="0.4" />
          <Circle cx="330" cy="-25" r="125" fill={colors.primaryDeep} opacity="0.12" />
          <Rect x="155" y="53" width="48" height="94" rx="3" stroke={colors.link} strokeWidth="1.5" fill="none" opacity="0.5" transform="rotate(22 180 100)" />
          <Path d="M146 65L190 83M119 132L163 150" stroke={colors.link} strokeWidth="1.5" opacity="0.4" />
        </Svg>
      )}
      {busy ? <ActivityIndicator size="small" color={colors.link} style={styles.loading} /> : null}
    </Pressable>
  </View>;
}
const createStyles = (colors: Palette) => StyleSheet.create({
  wrap: { gap: spacing.sm }, cover: { width: '100%', aspectRatio: 1.88, backgroundColor: colors.primarySoft, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end' },
  profileWrap: { position: 'absolute', right: spacing.lg, bottom: 0, width: 88, height: 88, padding: 4, borderRadius: 44, backgroundColor: colors.background },
  profile: { flex: 1, borderRadius: 40, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  loading: { position: 'absolute', alignSelf: 'center', top: '50%' },
  pressed: { opacity: 0.8 },
});
