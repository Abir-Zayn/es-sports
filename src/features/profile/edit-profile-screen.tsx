import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { useThemedStyles } from '@/theme';

import { ScreenHeader } from './components/screen-header';
import { EditProfileForm } from './edit-profile-form';
import { createEditProfileStyles } from './edit-profile-styles';
import { useProfile } from './profile-provider';

/** Waits for the stored profile, so the form never starts from placeholder values. */
export function EditProfileScreen() {
  const { status, reload } = useProfile();
  const styles = useThemedStyles(createEditProfileStyles);
  if (status === 'ready') return <EditProfileForm />;
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Edit Profile" />
      <View style={styles.centered}>
        {status === 'loading' ? (
          <ActivityIndicator accessibilityLabel="Loading your profile" />
        ) : (
          <>
            <Text muted>Couldn’t load your profile.</Text>
            <Button label="Try again" size="compact" onPress={reload} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
