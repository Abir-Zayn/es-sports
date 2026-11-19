// Test-only stand-in for the Supabase client, kept out of `__tests__` so Jest does not run it as a suite.
// Every query-builder method returns the same builder; awaiting it gives the result set for its table.
type Result = { data: unknown; error: { code?: string; message: string } | null };
type Step = [method: string, args: unknown[]];
type StorageResult = { data?: unknown; error: { message: string } | null };

export const fake = {
  results: {} as Record<string, Result>,
  rpcResult: { data: 'id', error: null } as Result,
  storageUploadResult: { error: null } as StorageResult,
  storageRemoveResult: { error: null } as StorageResult,
  storageUploads: [] as { bucket: string; path: string; contentType?: string }[],
  storageRemovals: [] as { bucket: string; paths: string[] }[],
  queries: [] as { table: string; steps: Step[] }[],
  rpc: jest.fn(async (_name: string, _args: unknown): Promise<Result> => fake.rpcResult),
  storage: {
    from(bucket: string) {
      return {
        upload: jest.fn(async (path: string, _bytes: unknown, opts?: { contentType?: string }) => {
          fake.storageUploads.push({ bucket, path, contentType: opts?.contentType });
          return fake.storageUploadResult;
        }),
        remove: jest.fn(async (paths: string[]) => {
          fake.storageRemovals.push({ bucket, paths });
          return fake.storageRemoveResult;
        }),
        getPublicUrl: jest.fn((path: string) => ({
          data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/${bucket}/${path}` },
        })),
      };
    },
  },
  from(table: string) {
    const query = { table, steps: [] as Step[] };
    fake.queries.push(query);
    const builder: unknown = new Proxy({}, {
      get(_target, method: string) {
        if (method === 'then') {
          return (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) =>
            Promise.resolve(fake.results[table] ?? { data: [], error: null }).then(resolve, reject);
        }
        return (...args: unknown[]) => {
          query.steps.push([method, args]);
          return builder;
        };
      },
    });
    return builder;
  },
  reset() {
    fake.results = {};
    fake.rpcResult = { data: 'id', error: null };
    fake.storageUploadResult = { error: null };
    fake.storageRemoveResult = { error: null };
    fake.storageUploads = [];
    fake.storageRemovals = [];
    fake.queries = [];
    fake.rpc.mockClear();
  },
  /** The arguments of every call to one builder method on one table. */
  calls(table: string, method: string): unknown[][] {
    return fake.queries.filter((q) => q.table === table).flatMap((q) => q.steps.filter(([m]) => m === method).map(([, args]) => args));
  },
};
