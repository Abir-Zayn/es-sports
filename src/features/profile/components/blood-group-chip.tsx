import { Pressable } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles } from '@/theme';
import type { BloodGroup } from '@/types/profile';

import { createEditProfileStyles } from '../edit-profile-styles';

export function BloodGroupChip({ id, selected, onPress }: { id: BloodGroup; selected: boolean; onPress: () => void }) {
  const styles = useThemedStyles(createEditProfileStyles);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={id}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>{id}</Text>
    </Pressable>
  );
}
