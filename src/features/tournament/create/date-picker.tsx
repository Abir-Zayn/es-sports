import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { radius, spacing, useThemedStyles, type Palette } from '@/theme';

import { formatDate, localDateKey } from './draft';

export function DatePicker({ label = 'Start date', value, onChange, error, minimumDate }: {
  label?: string; value: string; onChange: (value: string) => void; error?: string; minimumDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const styles = useThemedStyles(createStyles);
  const today = localDateKey(new Date());
  const minimum = minimumDate && formatDate(minimumDate) !== 'Choose a date' && minimumDate > today ? minimumDate : today;
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const previousDisabled = localDateKey(first).slice(0, 7) <= minimum.slice(0, 7);
  function showCalendar() {
    setMonth(new Date(`${value && formatDate(value) !== 'Choose a date' && value >= minimum ? value : minimum}T12:00:00`));
    setOpen(true);
  }
  return <View style={styles.wrap}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${formatDate(value)}`} onPress={showCalendar}
      style={({ pressed }) => [styles.field, Boolean(error) && styles.invalid, pressed && styles.pressed]}>
      <View style={styles.marker} />
      <Text muted style={styles.flex}>{label}</Text>
      <Text style={styles.value} muted={!value}>{value ? formatDate(value) : 'Select date'}</Text>
    </Pressable>
    {error ? <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <SafeAreaView edges={['bottom']} style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.month}>
            <AppIconTile icon={ChevronLeft} size={48} accessibilityLabel="Previous month" onPress={previousDisabled ? undefined : () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} />
            <Text variant="heading" accessibilityRole="header">{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</Text>
            <AppIconTile icon={ChevronRight} size={48} accessibilityLabel="Next month" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} />
          </View>
          <ScrollView horizontal contentContainerStyle={styles.calendarScroll}>
            <View style={styles.grid}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <View key={`weekday-${index}`} style={styles.day}><Text muted>{day}</Text></View>)}
              {Array.from({ length: offset }, (_, index) => <View key={`empty-${index}`} style={styles.day} />)}
              {Array.from({ length: days }, (_, index) => {
                const day = index + 1;
                const key = localDateKey(new Date(month.getFullYear(), month.getMonth(), day));
                return <Pressable key={key} accessibilityRole="button" accessibilityLabel={formatDate(key)}
                  accessibilityState={{ selected: key === value, disabled: key < minimum }} disabled={key < minimum}
                  onPress={() => { onChange(key); setOpen(false); }}
                  style={({ pressed }) => [styles.day, key === value && styles.selected, key < minimum && styles.disabled, pressed && styles.pressed]}>
                  <Text style={key === value ? styles.selectedText : undefined}>{day}</Text>
                </Pressable>;
              })}
            </View>
          </ScrollView>
          <View style={styles.cancel}><Button label="Cancel" variant="secondary" onPress={() => setOpen(false)} /></View>
        </SafeAreaView>
      </View>
    </Modal>
  </View>;
}
const createStyles = (colors: Palette) => StyleSheet.create({
  wrap: { gap: spacing.xs }, flex: { flex: 1 },
  field: { minHeight: 64, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  marker: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: colors.outline },
  value: { fontWeight: '500' },
  invalid: { borderColor: colors.danger }, error: { color: colors.dangerSoftText },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingTop: spacing.xl },
  month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  calendarScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.md },
  grid: { width: 336, flexDirection: 'row', flexWrap: 'wrap' }, day: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  selected: { backgroundColor: colors.primary }, selectedText: { color: colors.primaryText, fontWeight: '700' },
  disabled: { opacity: 0.3 }, pressed: { opacity: 0.7 }, cancel: { padding: spacing.lg },
});
