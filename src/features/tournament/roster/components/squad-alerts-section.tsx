import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { RosterAuditEvent } from '../types';

function headline(event: RosterAuditEvent): string {
  const verb = event.action === 'player_removed' ? 'removed' : 'added';
  return `${event.teamName} ${verb} ${event.playerName} during the tournament`;
}

function when(at: string): string {
  const date = new Date(at);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Squad changes made after the rosters locked, newest first, for the tournament owner and moderators. */
export function SquadAlertsSection({ events }: { events: RosterAuditEvent[] }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Squad alerts
      </Text>
      {events.length === 0 ? (
        <Text variant="caption" muted>
          No squad changes since the rosters locked.
        </Text>
      ) : (
        events.map((event) => (
          <View key={event.id} style={styles.card}>
            <TriangleAlert size={18} color={colors.accent} />
            <View style={styles.copy}>
              <Text style={styles.headline}>{headline(event)}</Text>
              <Text variant="caption" muted>
                Reason: {event.reason}
              </Text>
              <Text variant="caption" muted>
                By {event.byName} · {when(event.at)}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    title: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
    card: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accentSoft },
    copy: { flex: 1, gap: 2 },
    headline: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  });
