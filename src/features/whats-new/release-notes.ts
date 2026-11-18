import { z } from 'zod';

import { supabase } from '@/lib/supabase';

const highlightSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(500),
});

const releaseNotesSchema = z.object({
  title: z.string().trim().min(1).max(100),
  published_at: z.iso.datetime({ offset: true }),
  highlights: z.array(highlightSchema).min(1).max(8)
    .refine((items) => new Set(items.map((item) => item.title)).size === items.length),
});

export type ReleaseNotes = z.infer<typeof releaseNotesSchema>;

export async function fetchReleaseNotes(updateId: string, signal: AbortSignal): Promise<ReleaseNotes | null> {
  const { data, error } = await supabase
    .from('app_release_notes')
    .select('title, published_at, highlights')
    .eq('update_id', updateId)
    .limit(1)
    .abortSignal(signal)
    .maybeSingle();

  if (error) throw error;
  return data === null ? null : releaseNotesSchema.parse(data);
}
