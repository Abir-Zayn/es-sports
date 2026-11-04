import { File, Paths } from 'expo-file-system';

import { sessionDescriptorSchema, type SessionDescriptor } from './session-descriptor';

const FILE_NAME = 'broadcast-session.json';
const TEMP_NAME = 'broadcast-session.json.tmp';

const target = () => new File(Paths.document, FILE_NAME);

/** Null when missing or unreadable (a corrupt file is discarded rather than crashing the console). */
export function readSession(): SessionDescriptor | null {
  const file = target();
  if (!file.exists) return null;
  try {
    return sessionDescriptorSchema.parse(JSON.parse(file.textSync()));
  } catch {
    try { file.delete(); } catch {}
    return null;
  }
}

/** Atomic replace: write a temp file, then move over the real one, so a crash mid-write never corrupts it. */
export async function writeSession(descriptor: SessionDescriptor): Promise<void> {
  const value = JSON.stringify(sessionDescriptorSchema.parse(descriptor));
  const temp = new File(Paths.document, TEMP_NAME);
  if (temp.exists) temp.delete();
  temp.create();
  await temp.write(value);
  await temp.move(target(), { overwrite: true });
}

export function clearSession(): void {
  const file = target();
  if (file.exists) file.delete();
}
