import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, spacing, typography, useThemedStyles, type Palette } from '@/theme';

const MAX_MINUTES = 23 * 60 + 59;

type StartTimeSlidersProps = {
  /** Minutes after midnight (0..1439). */
  value: number;
  onChange: (minutes: number) => void;
  /** Prefix for screen-reader labels, e.g. "Start" or "First match". */
  labelPrefix?: string;
};

type SliderRowProps = {
  label: string;
  valueLabel: string;
  accessibilityLabel: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
};

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function formatHour(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve} ${period}`;
}

function formatMinute(minute: number): string {
  return `${String(minute).padStart(2, '0')} min`;
}

/** Two Coral Daylight sliders (hour and minutes) for choosing any start time of day. */
export function StartTimeSliders({ value, onChange, labelPrefix = 'Start' }: StartTimeSlidersProps) {
  const styles = useThemedStyles(createStyles);
  const safeMinutes = clampInt(value, 0, MAX_MINUTES);
  const hour = Math.floor(safeMinutes / 60);
  const minute = safeMinutes % 60;

  return (
    <View style={styles.group}>
      <SliderRow
        label="Hour"
        valueLabel={formatHour(hour)}
        accessibilityLabel={`${labelPrefix} hour`}
        value={hour}
        min={0}
        max={23}
        onChange={(nextHour) => onChange(nextHour * 60 + minute)}
      />
      <SliderRow
        label="Minutes"
        valueLabel={formatMinute(minute)}
        accessibilityLabel={`${labelPrefix} minutes`}
        value={minute}
        min={0}
        max={59}
        onChange={(nextMinute) => onChange(hour * 60 + nextMinute)}
      />
    </View>
  );
}

function SliderRow({ label, valueLabel, accessibilityLabel, value, min, max, onChange }: SliderRowProps) {
  const styles = useThemedStyles(createStyles);
  const thumbSize = dp(24);
  const [trackWidth, setTrackWidth] = useState(0);
  const grantRef = useRef<{ pageX: number | null; value: number }>({ pageX: null, value });

  const span = Math.max(1, max - min);
  const usableWidth = Math.max(0, trackWidth - thumbSize);
  const ratio = Math.min(1, Math.max(0, (value - min) / span));
  const thumbLeft = Number.isFinite(usableWidth * ratio) ? Math.max(0, usableWidth * ratio) : 0;
  const fillWidth = trackWidth > 0 ? Math.min(trackWidth, thumbLeft + thumbSize / 2) : 0;

  function valueFromLocation(locationX: number): number {
    if (usableWidth <= 0) return value;
    const nextRatio = Math.min(1, Math.max(0, (locationX - thumbSize / 2) / usableWidth));
    return clampInt(min + nextRatio * span, min, max);
  }

  function handleGrant(evt: GestureResponderEvent) {
    const next = valueFromLocation(evt.nativeEvent.locationX);
    grantRef.current = {
      pageX: typeof evt.nativeEvent.pageX === 'number' ? evt.nativeEvent.pageX : null,
      value: next,
    };
    if (next !== value) onChange(next);
  }

  function handleMove(evt: GestureResponderEvent) {
    if (usableWidth <= 0) return;
    const { pageX, locationX } = evt.nativeEvent;
    const next =
      grantRef.current.pageX !== null && typeof pageX === 'number'
        ? clampInt(grantRef.current.value + ((pageX - grantRef.current.pageX) / usableWidth) * span, min, max)
        : valueFromLocation(locationX);
    if (next !== value) onChange(next);
  }

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text variant="caption" muted>
          {label}
        </Text>
        <Text style={styles.valueText}>{valueLabel}</Text>
      </View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: value, text: valueLabel }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const step = e.nativeEvent.actionName === 'increment' ? 1 : e.nativeEvent.actionName === 'decrement' ? -1 : 0;
          if (step === 0) return;
          const next = clampInt(value + step, min, max);
          if (next !== value) onChange(next);
        }}
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          if (Number.isFinite(width) && width >= 0) setTrackWidth(width);
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={handleGrant}
        onResponderMove={handleMove}
        style={styles.sliderTouch}
      >
        <View pointerEvents="none" style={styles.track} />
        <View pointerEvents="none" style={[styles.fill, { width: fillWidth }]} />
        <View pointerEvents="none" style={[styles.thumb, { left: thumbLeft }]} />
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) => {
  const thumbSize = dp(24);
  const trackHeight = dp(8);
  return StyleSheet.create({
    group: { gap: spacing.xs },
    row: { gap: 0 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    valueText: { ...typography.labelSm, color: colors.text, fontVariant: ['tabular-nums'] },
    sliderTouch: { height: dp(44), justifyContent: 'center' },
    track: { height: trackHeight, borderRadius: radius.pill, backgroundColor: colors.border },
    fill: { position: 'absolute', left: 0, height: trackHeight, borderRadius: radius.pill, backgroundColor: colors.primary },
    thumb: {
      position: 'absolute',
      width: thumbSize,
      height: thumbSize,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
      ...shadows.iconButton,
    },
  });
};
