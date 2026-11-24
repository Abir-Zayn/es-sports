import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Clock from 'lucide-react-native/icons/clock';
import MapPin from 'lucide-react-native/icons/map-pin';
import type { ComponentType, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { PersonRecord } from '../../data/tournament-repository';
import type { OverviewStatus } from './overview-status';

type Icon = ComponentType<{ size?: number; color?: string }>;

/** A plain card with a small uppercase heading; every Overview block sits in one. */
export function OverviewCard({ title, children }: { title: string; children: ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

/** Status chip and countdown, then dates, venue and the registration deadline as icon rows. */
export function StatusCard({ status, dates, venue, registration }: { status: OverviewStatus; dates: string; venue: string; registration: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const chip = {
    upcoming: { bg: colors.accentSoft, ink: colors.accent },
    live: { bg: colors.successSoft, ink: colors.success },
    ended: { bg: colors.surfaceRaised, ink: colors.textMuted },
    closed: { bg: colors.surfaceRaised, ink: colors.textMuted },
  }[status.kind];
  const line = (Glyph: Icon, text: string) => (
    <View style={styles.iconRow}>
      <Glyph size={sizes.iconSmall} color={colors.textMuted} />
      <Text style={styles.iconText}>{text}</Text>
    </View>
  );
  return (
    <View style={styles.card}>
      <View style={styles.statusRow} accessible accessibilityLabel={`${status.label}. ${status.detail}`}>
        <Text style={[styles.chip, { backgroundColor: chip.bg, color: chip.ink }]}>{status.label}</Text>
        <Text style={styles.detail}>{status.detail}</Text>
      </View>
      {line(CalendarDays, dates)}
      {line(MapPin, venue)}
      {registration ? line(Clock, registration) : null}
    </View>
  );
}

/** Equal tiles for the headline rules, e.g. overs, ball and format. */
export function FactTiles({ facts }: { facts: { label: string; value: string }[] }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.tiles}>
      {facts.map((fact) => (
        <View key={fact.label} style={styles.tile} accessible accessibilityLabel={`${fact.label}: ${fact.value}`}>
          <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>{fact.value}</Text>
          <Text style={styles.tileLabel}>{fact.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** "3 of 4 joined" with a bar; full when every planned team is in. */
export function TeamsProgress({ joined, planned }: { joined: number | null; planned: number }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const share = joined == null || planned <= 0 ? 0 : Math.min(1, joined / planned);
  const full = joined != null && joined >= planned;
  return (
    <View style={styles.progress}>
      <View style={styles.progressText}>
        <Text style={styles.value}>{joined == null ? `${planned} planned` : `${joined} of ${planned} joined`}</Text>
        {full ? <Text style={[styles.detail, { color: colors.success }]}>All teams are in</Text> : null}
      </View>
      <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel="Teams joined"
        accessibilityValue={{ min: 0, max: planned, now: joined ?? 0 }}>
        <View style={[styles.fill, { width: `${Math.round(share * 100)}%`, backgroundColor: full ? colors.success : colors.primary }]} />
      </View>
    </View>
  );
}

/** One staff member: their own photo (not a tournament image), name and role. */
export function PersonRow({ person, role }: { person: PersonRecord; role: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.person} accessible accessibilityLabel={`${person.name}, ${role}`}>
      <InitialsAvatar label={initialsOf(person.name)} imageUri={person.avatarUrl} size={dp(36)} />
      <View style={styles.personText}>
        <Text style={styles.value} numberOfLines={1}>{person.name}</Text>
        <Text style={styles.tileLabel}>{role}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: sizes.cardPaddingTight, gap: spacing.md, ...shadows.card },
  heading: { ...typography.labelUppercase, color: colors.textMuted },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  chip: { ...typography.labelSm, borderRadius: radius.pill, overflow: 'hidden', paddingHorizontal: spacing.md, paddingVertical: dp(4) },
  detail: { ...typography.bodySm, color: colors.textMuted },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconText: { ...typography.bodyMd, color: colors.text, flexShrink: 1 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, minWidth: 0, borderRadius: radius.md, backgroundColor: colors.surfaceRaised, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center', gap: dp(2) },
  tileValue: { ...typography.headlineMd, color: colors.text },
  tileLabel: { ...typography.bodySm, color: colors.textMuted },
  value: { ...typography.bodyMd, color: colors.text },
  progress: { gap: spacing.sm },
  progressText: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  track: { height: dp(8), borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  personText: { flex: 1, minWidth: 0 },
});
