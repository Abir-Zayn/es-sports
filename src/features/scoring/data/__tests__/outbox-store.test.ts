import { fileOutboxStore, type OutboxRecord } from '../outbox-store';

// A small in-memory disk with the parts of the expo-file-system API the store uses.
const mockDisk = new Map<string, string>();
jest.mock('expo-file-system', () => {
  const join = (parts: (string | { uri: string })[]) => parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
  return {
    Paths: { document: 'file:///documents' },
    Directory: class {
      uri: string;
      constructor(...parts: (string | { uri: string })[]) { this.uri = join(parts); }
      get exists() { return [...mockDisk.keys()].some((path) => path.startsWith(`${this.uri}/`)); }
      create() {}
      list() { return [...mockDisk.keys()].filter((path) => path.startsWith(`${this.uri}/`)).map((uri) => ({ uri })); }
    },
    File: class {
      uri: string;
      constructor(...parts: (string | { uri: string })[]) { this.uri = join(parts); }
      get exists() { return mockDisk.has(this.uri); }
      textSync() { return mockDisk.get(this.uri) ?? ''; }
      writeSync(text: string) { mockDisk.set(this.uri, text); }
      moveSync(target: { uri: string }) { mockDisk.set(target.uri, mockDisk.get(this.uri) ?? ''); mockDisk.delete(this.uri); }
      delete() { mockDisk.delete(this.uri); }
    },
  };
});

const MATCH = '22222222-2222-4222-8222-222222222222';
const record = (ops: OutboxRecord['ops']): OutboxRecord => ({
  version: 1, userId: 'user-1', matchId: MATCH, fixtureRef: 'friendly-1', base: ['b0'], ops,
});
const reopen = { kind: 'reopen' as const };

describe('fileOutboxStore', () => {
  beforeEach(() => mockDisk.clear());

  it('keeps each account in its own folder and writes through a temporary file', () => {
    fileOutboxStore.write(record([reopen]));
    expect([...mockDisk.keys()]).toEqual([`file:///documents/scoring-outbox/user-1/${MATCH}.json`]);
    expect(fileOutboxStore.read('user-1', MATCH)).toEqual(record([reopen]));
    expect(fileOutboxStore.read('user-2', MATCH)).toBeNull();
    expect(fileOutboxStore.list('user-1')).toHaveLength(1);
  });

  it('removes the file once nothing is left to send', () => {
    fileOutboxStore.write(record([reopen]));
    fileOutboxStore.write(record([]));
    expect(mockDisk.size).toBe(0);
  });

  it('moves an unreadable file aside instead of deleting it', () => {
    mockDisk.set(`file:///documents/scoring-outbox/user-1/${MATCH}.json`, '{"version":1,"ops":[');
    expect(fileOutboxStore.read('user-1', MATCH)).toBeNull();
    const kept = [...mockDisk.keys()];
    expect(kept).toHaveLength(1);
    expect(kept[0]).toMatch(/\.unreadable$/);
  });

  it('only accepts a stored match id as a file name', () => {
    expect(() => fileOutboxStore.write({ ...record([reopen]), matchId: '../escape' })).toThrow();
    expect(fileOutboxStore.read('user-1', '../escape')).toBeNull();
  });
});
