import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type TeamPhotoKind = 'profile' | 'cover';

/** Opens the photo library for a team profile (1:1) or cover (16:9), returning a validated URI or null if cancelled. */
export async function pickTeamImageAsset(kind: TeamPhotoKind): Promise<string | null> {
  const isProfile = kind === 'profile';
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: isProfile || Platform.OS === 'android',
    aspect: isProfile ? [1, 1] : [16, 9],
    quality: 0.75,
    base64: Platform.OS === 'web',
  });
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset?.uri) throw new Error('No image was returned. Please choose another photo.');
  const limit = Platform.OS === 'web' ? 2_000_000 : 8_000_000;
  if ((asset.fileSize ?? 0) > limit) throw new Error(`Choose an image smaller than ${limit / 1_000_000} MB.`);
  const nextUri = Platform.OS === 'web' && asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
  if (Platform.OS === 'web' && !nextUri.startsWith('data:')) {
    throw new Error('This image could not be saved. Please choose another.');
  }
  return nextUri;
}
