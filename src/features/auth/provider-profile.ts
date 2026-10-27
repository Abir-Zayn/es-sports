/** The name and photo a sign-in provider such as Google shares. Both are optional. */
export type ProviderProfile = { fullName?: string; avatarUrl?: string };

const MAX_NAME_LENGTH = 40;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/**
 * Reads the display name and photo from a provider's metadata: an identity's `identity_data` or a user's `user_metadata`.
 * Google uses `full_name` and `avatar_url`, with `name` and `picture` as fallbacks. Photos must be https.
 */
export function providerProfileFromMetadata(metadata: Record<string, unknown> | null | undefined): ProviderProfile {
  const name = (text(metadata?.full_name) || text(metadata?.name)).slice(0, MAX_NAME_LENGTH);
  const picture = text(metadata?.avatar_url) || text(metadata?.picture);
  return {
    fullName: name.length >= 2 ? name : undefined,
    avatarUrl: picture.startsWith('https://') ? picture : undefined,
  };
}
