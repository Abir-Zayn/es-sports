import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import type { StreamPlatform } from '@modules/live-stream';

/** RTMP(S) server URL + stream key: a bearer secret. Stored only in Keystore-backed SecureStore (§8.2). */
export type Destination = { url: string; key: string };

const destinationSchema = z.object({ url: z.string().min(1).max(300), key: z.string().min(1).max(512) });
const keyFor = (platform: StreamPlatform) => `broadcast.dest.${platform}`;
const REMEMBER_KEY = 'broadcast.remember-key';
const SECURE_STORE_LIMIT = 2048;

export async function loadDestination(platform: StreamPlatform): Promise<Destination | null> {
  const raw = await SecureStore.getItemAsync(keyFor(platform));
  if (raw === null) return null;
  const parsed = destinationSchema.safeParse(safeJson(raw));
  if (!parsed.success) {
    await SecureStore.deleteItemAsync(keyFor(platform));
    return null;
  }
  return parsed.data;
}

export async function saveDestination(platform: StreamPlatform, destination: Destination): Promise<void> {
  const value = JSON.stringify(destinationSchema.parse({ url: destination.url.trim(), key: destination.key.trim() }));
  if (new TextEncoder().encode(value).length > SECURE_STORE_LIMIT) throw new Error('Stream destination is too long to save.');
  await SecureStore.setItemAsync(keyFor(platform), value);
}

export async function clearDestination(platform?: StreamPlatform): Promise<void> {
  const platforms: StreamPlatform[] = platform ? [platform] : ['youtube', 'facebook'];
  await Promise.all(platforms.map((p) => SecureStore.deleteItemAsync(keyFor(p))));
}

/** "Remember stream key" defaults to on (confirmed decision); the user can opt out. */
export async function getRememberKey(): Promise<boolean> {
  return (await SecureStore.getItemAsync(REMEMBER_KEY)) !== 'false';
}

export async function setRememberKey(remember: boolean): Promise<void> {
  await SecureStore.setItemAsync(REMEMBER_KEY, remember ? 'true' : 'false');
}

/** Host for display only ("a.rtmp.youtube.com"); never the path, which can embed secrets. */
export function destinationHost(url: string): string {
  const match = /^rtmps?:\/\/([^/:\s]+)/i.exec(url.trim());
  return match?.[1]?.toLowerCase() ?? '';
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
