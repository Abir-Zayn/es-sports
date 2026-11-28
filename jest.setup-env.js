// Placeholder public config so modules that read `@/lib/env` at import time load in tests. Tests mock the network.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_KEY ??= 'sb_publishable_test';

// Reanimated's worklets runtime does not exist under Jest, so any screen that imports an animation (the live match
// screen does, and team and search screens reach it) loads this stand-in. A test can still mock it its own way.
jest.mock('react-native-reanimated', () => require('./src/features/match/__fixtures__/reanimated-stub'));
