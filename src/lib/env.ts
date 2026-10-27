import { z } from 'zod';

const schema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url(),
  EXPO_PUBLIC_SUPABASE_KEY: z.string().startsWith('sb_publishable_', 'Use the Supabase publishable key.'),
  /** OAuth "Web application" client ID from Google Cloud. Public by design. Google sign-in stays off until it is set. */
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().endsWith('.apps.googleusercontent.com', 'Use the Web client ID from Google Cloud.').optional(),
});

// Expo inlines EXPO_PUBLIC_* only for static `process.env.NAME` access.
export const env = schema.parse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
});
