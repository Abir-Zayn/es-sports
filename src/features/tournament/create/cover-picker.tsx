import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import ImagePlus from 'lucide-react-native/icons/image-plus';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

export function CoverPicker({ uri, onChange, onBusyChange }: { uri: string; onChange: (uri: string) => void; onBusyChange: (busy: boolean) => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failedUri, setFailedUri] = useState('');
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function pick() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    onBusyChange(true);
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: Platform.OS === 'android', aspect: [16, 9], quality: 0.75, base64: Platform.OS === 'web',
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
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Could not open your photos. Please try again.');
    } finally {
      pending.current = false;
      if (mounted.current) { setBusy(false); onBusyChange(false); }
    }
  }
  return <View style={styles.wrap}>
    <Pressable accessibilityRole="button" accessibilityLabel={uri ? 'Change tournament cover' : 'Add tournament cover'}
      accessibilityState={{ busy, disabled: busy }} disabled={busy} onPress={() => { void pick(); }}
      style={({ pressed }) => [styles.cover, pressed && styles.pressed]}>
      {uri && uri !== failedUri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Tournament cover"
        onError={() => { setFailedUri(uri); setError('This cover is unavailable. Tap to choose another photo.'); }} /> : <>
        <Svg viewBox="0 0 360 200" width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Circle cx="65" cy="210" r="190" stroke={colors.primaryDeep} strokeWidth="1" fill="none" opacity="0.4" />
          <Circle cx="65" cy="210" r="135" stroke={colors.primaryDeep} strokeWidth="1" fill="none" opacity="0.4" />
          <Circle cx="330" cy="-25" r="125" fill={colors.primaryDeep} opacity="0.12" />
          <Rect x="155" y="53" width="48" height="94" rx="3" stroke={colors.link} strokeWidth="1.5" fill="none" opacity="0.5" transform="rotate(22 180 100)" />
          <Path d="M146 65L190 83M119 132L163 150" stroke={colors.link} strokeWidth="1.5" opacity="0.4" />
        </Svg>
        <Text style={styles.coverLabel}>Add tournament cover</Text>
      </>}
      <View style={styles.add}>{busy ? <ActivityIndicator color={colors.primaryText} /> : <ImagePlus size={21} color={colors.primaryText} />}</View>
    </Pressable>
    {error ? <Text variant="caption" accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>;
}
const createStyles = (colors: Palette) => StyleSheet.create({
  wrap: { gap: spacing.sm }, cover: { width: '100%', aspectRatio: 1.88, backgroundColor: colors.primarySoft, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end' },
  coverLabel: { padding: spacing.lg, paddingRight: 80, color: colors.link, fontSize: 13, fontWeight: '500' },
  add: { position: 'absolute', right: spacing.md, bottom: spacing.md, width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8 }, error: { color: colors.dangerSoftText },
});
