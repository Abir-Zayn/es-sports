import { useState } from 'react';

import { Button, Text, TextField } from '@/components/ui';
import { useTheme } from '@/theme';

import { Sheet } from '../../roster/components/sheet';
import type { ScheduledMatch, SideRef } from '../types';
import { WhenChips } from './choice-chips';

const sideName = (side: SideRef) => (side.kind === 'team' ? side.team.name : side.label);

type Props = {
  match: ScheduledMatch | null;
  days: string[];
  /** Moves the match, resolving to why it cannot, or null once it has moved. */
  onSave: (date: string, startMin: number) => Promise<string | null>;
  /** Takes the match out of a schedule that is not published yet (hand-made schedules). */
  onRemove?: () => void;
  /** Calls off a published match; resolves to why it could not, or null. */
  onCancelMatch?: (reason: string) => Promise<string | null>;
  onClose: () => void;
};

/**
 * Moves one match to another tournament day or start time, and for a published schedule cancels it with a reason
 * the teams are shown. A started or cancelled match only shows what happened.
 */
export function EditMatchSheet(props: Props) {
  const { match, onClose } = props;
  return (
    <Sheet visible={match !== null} title={match ? `Match ${match.number}` : 'Match'} onClose={onClose}>
      {match ? <EditMatchBody key={match.id} {...props} match={match} /> : null}
    </Sheet>
  );
}

function EditMatchBody({ match, days, onSave, onRemove, onCancelMatch, onClose }: Props & { match: ScheduledMatch }) {
  const { colors } = useTheme();
  const [date, setDate] = useState(match.date);
  const [startMin, setStartMin] = useState(match.startMin);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const summary = `${sideName(match.home)} v ${sideName(match.away)} · ${match.stage}`;

  async function run(action: () => Promise<string | null>) {
    if (busy) return;
    setBusy(true);
    const refused = await action();
    setBusy(false);
    if (refused) setError(refused);
    else onClose();
  }

  if (match.cancelled || match.started) {
    return (
      <>
        <Text muted>{summary}</Text>
        <Text>{match.cancelled ? `Cancelled: ${match.cancelled.reason}` : 'This match has started, so it can no longer change.'}</Text>
      </>
    );
  }

  if (reason !== null && onCancelMatch) {
    const ok = reason.trim().length >= 3;
    return (
      <>
        <Text muted>{`${summary}. Both teams are told, with your reason.`}</Text>
        <TextField label="Reason" value={reason} onChangeText={(text) => { setReason(text); setError(null); }} maxLength={200}
          placeholder="e.g. Rain, ground not fit" error={error ?? undefined} />
        <Button label="Cancel match" loading={busy} disabled={!ok} onPress={() => void run(() => onCancelMatch(reason))} />
        <Button label="Keep the match" variant="secondary" disabled={busy} onPress={() => setReason(null)} />
      </>
    );
  }

  return (
    <>
      <Text muted>{summary}</Text>
      <WhenChips days={days} date={date} startMin={startMin}
        onDate={(next) => { setDate(next); setError(null); }} onStart={(next) => { setStartMin(next); setError(null); }} />
      {error ? <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>{error}</Text> : null}
      <Button label="Save" loading={busy} onPress={() => void run(() => onSave(date, startMin))} />
      {onCancelMatch ? <Button label="Cancel this match" variant="ghost" disabled={busy} onPress={() => { setError(null); setReason(''); }} /> : null}
      {onRemove ? <Button label="Remove match" variant="ghost" disabled={busy} onPress={() => { onRemove(); onClose(); }} /> : null}
    </>
  );
}
