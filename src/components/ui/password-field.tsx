import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { sizes, useTheme } from '@/theme';

type Props = Omit<React.ComponentProps<typeof TextField>, 'secureTextEntry' | 'trailing' | 'label'> & { label?: string };

/** A TextField for passwords with its own show/hide eye button. */
export function PasswordField({ label = 'Password', ...rest }: Props) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <TextField
      label={label}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="current-password"
      textContentType="password"
      {...rest}
      secureTextEntry={!visible}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          hitSlop={sizes.hitSlop}
          onPress={() => setVisible((v) => !v)}
        >
          <Icon size={sizes.icon} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
      }
    />
  );
}
