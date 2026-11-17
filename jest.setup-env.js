// Placeholder public config so modules that read `@/lib/env` at import time load in tests. Tests mock the network.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_KEY ??= 'sb_publishable_test';
