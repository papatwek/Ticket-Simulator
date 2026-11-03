import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null | undefined;

function getKnowledgeAdmin(): SupabaseClient | null {
  if (adminClient !== undefined) return adminClient;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('[Wyze Knowledge] Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Article retrieval is disabled.');
    adminClient = null;
    return null;
  }
  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return adminClient;
}

function makeSearchText(product: string, issue: string, latestMessage: string): string {
  const raw = `${product} ${issue} ${latestMessage}`
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // PostgreSQL websearch_to_tsquery handles natural-language terms; cap to avoid oversized queries.
  return raw.split(' ').filter(Boolean).slice(0, 35).join(' ');
}

/**
 * Retrieves approved public support-article excerpts for private model context.
 * This is background knowledge only. It must never turn the simulated customer into an agent.
 */
export async function getWyzeKnowledgeContext(
  product: string,
  issue: string,
  latestAgentMessage: string
): Promise<string> {
  const supabase = getKnowledgeAdmin();
  if (!supabase) return '';

  const query = makeSearchText(product, issue, latestAgentMessage);
  if (!query) return '';

  try {
    const { data, error } = await supabase
      .from('knowledge_article_chunks')
      .select('title, source_url, category, product_name, content')
      .eq('is_active', true)
      .textSearch('fts', query, { type: 'websearch', config: 'english' })
      .limit(5);

    if (error) {
      console.warn('[Wyze Knowledge] Search failed; continuing without article context:', error.message);
      return '';
    }
    if (!data?.length) return '';

    return data.map((row: any, index: number) => [
      `[Reference ${index + 1}] ${row.title || 'Wyze Support Article'}`,
      `Product/category: ${row.product_name || row.category || 'Wyze Support'}`,
      `Source: ${row.source_url}`,
      String(row.content || '').slice(0, 2600)
    ].join('\n')).join('\n\n---\n\n');
  } catch (error: any) {
    console.warn('[Wyze Knowledge] Retrieval unavailable; continuing without it:', error?.message || error);
    return '';
  }
}
