import { Button, Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { Sheet } from './sheet';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

/** Asks before a change that cannot be undone, such as disbanding a team. */
export function ConfirmSheet({ visible, title, message, confirmLabel, busy, error, onConfirm, onClose }: Props) {
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <Text muted>{message}</Text>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>
          {error}
        </Text>
      ) : null}
      <Button label={confirmLabel} loading={busy} onPress={onConfirm} />
      <Button label="Keep it" variant="secondary" disabled={busy} onPress={onClose} />
    </Sheet>
  );
}
