// Sends queued in-app notifications as Expo pushes (FCM on Android) and reads Expo receipts to drop dead tokens.
//
// Called each minute by pg_cron (see migration 20261118214856_push_notifications.sql). It takes no input: it sends
// only what `claim_push_batch` hands it, so the URL needs no secret. A claimed notification is never sent twice; if a
// send fails it is not retried (the in-app notification is still there).
import { createClient } from 'npm:@supabase/supabase-js@2';

const EXPO = 'https://exp.host/--/api/v2/push';
const SEND_CHUNK = 100; // Expo's limit per send request
const RECEIPT_CHUNK = 1000; // Expo's limit per receipts request
const TIMEOUT_MS = 10_000;

type Claimed = { notification_id: string; token: string; title: string; message: string; data: Record<string, unknown> | null };
type Ticket = { status: 'ok'; id: string } | { status: 'error'; message?: string; details?: { error?: string } };
type Receipt = { status: 'ok' } | { status: 'error'; details?: { error?: string } };

const secretKey = (): string => {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  return keys ? JSON.parse(keys).default : Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
};
const db = createClient(Deno.env.get('SUPABASE_URL')!, secretKey(), { auth: { persistSession: false } });

const chunks = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

async function expo<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${EXPO}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`expo ${path} ${res.status}`);
  return (await res.json()).data as T;
}

/** Only in-app paths may be opened from a tap, so a notification cannot send the app elsewhere. */
const urlOf = (data: Record<string, unknown> | null): string => {
  const url = data?.url;
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : '/notifications';
};

async function deleteTokens(tokens: string[]) {
  if (tokens.length > 0) await db.from('push_tokens').delete().in('token', tokens);
}

async function send(): Promise<{ sent: number; dropped: number }> {
  const { data, error } = await db.rpc('claim_push_batch', { p_limit: 100 });
  if (error) throw error;
  const rows = (data ?? []) as Claimed[];
  let sent = 0;
  const dead: string[] = [];
  for (const batch of chunks(rows, SEND_CHUNK)) {
    const messages = batch.map((r) => ({
      to: r.token, title: r.title, body: r.message, sound: 'default', channelId: 'default',
      data: { url: urlOf(r.data), notificationId: r.notification_id },
    }));
    const tickets = await expo<Ticket[]>('send', messages);
    const ok: { id: string; token: string }[] = [];
    tickets.forEach((t, i) => {
      if (t.status === 'ok') ok.push({ id: t.id, token: batch[i].token });
      else if (t.details?.error === 'DeviceNotRegistered') dead.push(batch[i].token);
      else console.warn('push ticket error', t.details?.error ?? 'unknown');
    });
    sent += ok.length;
    if (ok.length > 0) await db.from('push_tickets').insert(ok);
  }
  await deleteTokens(dead);
  return { sent, dropped: dead.length };
}

/** Receipts are ready about 15 minutes after sending; tickets with no receipt yet stay for the next run. */
async function readReceipts(): Promise<number> {
  const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data, error } = await db.from('push_tickets').select('id, token').lt('created_at', cutoff).limit(RECEIPT_CHUNK);
  if (error) throw error;
  const tickets = data ?? [];
  if (tickets.length === 0) return 0;
  const receipts = await expo<Record<string, Receipt>>('getReceipts', { ids: tickets.map((t) => t.id) });
  const dead = tickets.filter((t) => {
    const r = receipts[t.id];
    return r?.status === 'error' && r.details?.error === 'DeviceNotRegistered';
  }).map((t) => t.token);
  await deleteTokens(dead);
  const done = tickets.filter((t) => receipts[t.id] != null).map((t) => t.id);
  if (done.length > 0) await db.from('push_tickets').delete().in('id', done);
  return dead.length;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  try {
    const result = await send();
    const receiptDrops = await readReceipts();
    return Response.json({ ...result, receiptDrops });
  } catch (err) {
    console.error('send-push failed', err instanceof Error ? err.message : 'unknown');
    return Response.json({ message: 'Something went wrong' }, { status: 500 });
  }
});
