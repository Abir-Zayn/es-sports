import * as Clipboard from 'expo-clipboard';

import { traceFlow } from './api-log';

/** Puts `text` on the clipboard. False when the device refused, so the screen can say so instead of claiming it copied. */
export async function copyText(text: string): Promise<boolean> {
  try {
    const ok = await Clipboard.setStringAsync(text);
    traceFlow('clipboard.copy', { length: text.length, ok });
    return ok;
  } catch (error) {
    traceFlow('clipboard.copy failed', { message: String((error as Error)?.message ?? error) });
    return false;
  }
}
