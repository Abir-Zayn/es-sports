import { supabase } from '@/lib/supabase';

import type { HandoverRow } from './types';

type Failure = { code?: string; message: string } | null;
type Answer<T> = PromiseLike<{ data: T | null; error: Failure }>;

/** The small slice of the query builder the handover reads use, typed here until the generated types know the table. */
export interface HandoverQuery extends Answer<HandoverRow[]> {
  eq(column: string, value: string): HandoverQuery;
  neq(column: string, value: string): HandoverQuery;
  order(column: string, options: { ascending: boolean }): HandoverQuery;
  limit(count: number): HandoverQuery;
}

type RpcName = 'offer_scorer_handover' | 'accept_scorer_handover' | 'decline_scorer_handover' | 'cancel_scorer_handover';
type Untyped = {
  from(table: 'scorer_handover'): { select(columns: string): HandoverQuery };
  rpc(name: RpcName, args: Record<string, string>): Answer<string | null>;
};

// Until `database.types.ts` is regenerated from the migration, the client does not know this table or these functions.
const client = supabase as unknown as Untyped;

export const HANDOVER_COLUMNS = 'id, match_id, from_user, to_user, initiated_by, status, expires_at, created_at, resolved_at';

export const handoverTable = () => client.from('scorer_handover').select(HANDOVER_COLUMNS);

/** Calls one handover function. Resolves to its return value (the new id for an offer) and throws the server's error. */
export async function callHandover(name: RpcName, args: Record<string, string>): Promise<string | null> {
  const { data, error } = await client.rpc(name, args);
  if (error) throw error;
  return data;
}
