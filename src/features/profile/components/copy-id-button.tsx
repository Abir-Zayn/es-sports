import Check from 'lucide-react-native/icons/check';
import Copy from 'lucide-react-native/icons/copy';
import { useEffect, useRef, useState } from 'react';

import { AppIconTile } from '@/components/ui';
import { copyText } from '@/lib/copy-text';
import { useTheme } from '@/theme';

const RESET_MS = 2000;

type Props = { userId: string };

/** Copies the account's user id, which other players paste into a search to find this person. */
export function CopyIdButton({ userId }: Props) {
  const { colors } = useTheme();
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    const ok = await copyText(userId);
    setState(ok ? 'copied' : 'failed');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), RESET_MS);
  }

  const label = state === 'copied' ? 'User ID copied' : state === 'failed' ? 'Could not copy the user ID' : 'Copy user ID';
  return (
    <AppIconTile
      icon={state === 'copied' ? Check : Copy}
      size={32}
      borderRadius={16}
      backgroundColor={colors.surface}
      borderColor={state === 'failed' ? colors.danger : colors.border}
      borderWidth={1}
      accessibilityLabel={label}
      onPress={() => void copy()}
    />
  );
}
