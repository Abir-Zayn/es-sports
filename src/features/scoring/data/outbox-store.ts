import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { z } from 'zod';

import type { OutboxOp } from './outbox-ops';
import { isUuid } from './uuid';

/** The unsent changes of one match, for one account, as written to the phone. */
export type OutboxRecord = {
  version: 1;
  userId: string;
  matchId: string;
  fixtureRef: string;
  /** Live event ids on the server before the first op in `ops`, in order. */
  base: readonly string[];
  ops: readonly OutboxOp[];
};

export type OutboxStore = {
  read(userId: string, matchId: string): OutboxRecord | null;
  /** Writes the record, or removes it when it has no ops left. */
  write(record: OutboxRecord): void;
  list(userId: string): OutboxRecord[];
};

// Only the outline is checked: the file is written by this app, and this catches truncation or an old format.
const row = z.looseObject({});
const persistOp = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('insert'), row: z.looseObject({ id: z.string() }) }),
  z.object({ kind: z.literal('angle'), id: z.string(), angle: z.number() }),
  z.object({ kind: z.literal('void'), fromId: z.string() }),
]);
const outboxOp = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('create'), match: z.looseObject({ id: z.string() }), players: z.array(row), scorers: z.array(z.string()) }),
  z.object({ kind: z.literal('start'), recordShots: z.boolean(), startedAt: z.string() }),
  z.object({ kind: z.literal('event'), op: persistOp }),
  z.object({ kind: z.literal('result'), result: row }),
  z.object({ kind: z.literal('reopen') }),
]);
const recordSchema = z.object({
  version: z.literal(1), userId: z.string(), matchId: z.string(), fixtureRef: z.string(),
  base: z.array(z.string()), ops: z.array(outboxOp),
});

const parse = (text: string): OutboxRecord | null => {
  try {
    const parsed = recordSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data as OutboxRecord : null;
  } catch {
    return null;
  }
};

const folder = (userId: string) => new Directory(Paths.document, 'scoring-outbox', encodeURIComponent(userId));

/**
 * Keeps each account's unsent changes in its own folder, one file per match. A write goes to a temporary file
 * that then replaces the real one, so a crash mid-write leaves the previous complete copy. A file that cannot
 * be read is renamed aside rather than deleted, so nothing is thrown away without a person deciding to.
 */
export const fileOutboxStore: OutboxStore = {
  read(userId, matchId) {
    if (!isUuid(matchId)) return null;
    const file = new File(folder(userId), `${matchId}.json`);
    if (!file.exists) return null;
    const record = parse(file.textSync());
    if (!record || record.userId !== userId || record.matchId !== matchId) {
      file.moveSync(new File(folder(userId), `${matchId}.${Date.now()}.unreadable`), { overwrite: true });
      return null;
    }
    return record;
  },
  write(record) {
    if (!isUuid(record.matchId)) throw new Error('Unsaved changes need a stored match id.');
    const directory = folder(record.userId);
    const target = new File(directory, `${record.matchId}.json`);
    if (record.ops.length === 0) {
      if (target.exists) target.delete();
      return;
    }
    directory.create({ intermediates: true, idempotent: true });
    const temporary = new File(directory, `${record.matchId}.tmp`);
    temporary.writeSync(JSON.stringify(record));
    temporary.moveSync(target, { overwrite: true });
  },
  list(userId) {
    const directory = folder(userId);
    if (!directory.exists) return [];
    return directory.list()
      .map((entry) => entry.uri.match(/([0-9a-f-]{36})\.json$/i)?.[1])
      .filter((id): id is string => Boolean(id))
      .map((id) => this.read(userId, id))
      .filter((record): record is OutboxRecord => record !== null);
  },
};

/** For the web build and tests: the same contract, kept in memory. */
export function memoryOutboxStore(): OutboxStore {
  const records = new Map<string, OutboxRecord>();
  const key = (userId: string, matchId: string) => `${userId}/${matchId}`;
  return {
    read: (userId, matchId) => records.get(key(userId, matchId)) ?? null,
    write: (record) => {
      if (record.ops.length === 0) records.delete(key(record.userId, record.matchId));
      else records.set(key(record.userId, record.matchId), record);
    },
    list: (userId) => [...records.values()].filter((record) => record.userId === userId),
  };
}

export const defaultOutboxStore = (): OutboxStore => (Platform.OS === 'web' ? memoryOutboxStore() : fileOutboxStore);
