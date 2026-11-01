// Test-only stand-in for the Supabase client, kept out of `__tests__` so Jest does not run it as a suite.
// Every query-builder method returns the same builder; awaiting it gives the result set for its table.
type Result = { data: unknown; error: { code?: string; message: string } | null };
type Step = [method: string, args: unknown[]];

export const fake = {
  results: {} as Record<string, Result>,
  rpcResult: { data: 'id', error: null } as Result,
  queries: [] as { table: string; steps: Step[] }[],
  rpc: jest.fn(async (_name: string, _args: unknown): Promise<Result> => fake.rpcResult),
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
    fake.queries = [];
    fake.rpc.mockClear();
  },
  /** The arguments of every call to one builder method on one table. */
  calls(table: string, method: string): unknown[][] {
    return fake.queries.filter((q) => q.table === table).flatMap((q) => q.steps.filter(([m]) => m === method).map(([, args]) => args));
  },
};
