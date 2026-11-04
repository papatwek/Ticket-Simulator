import { getSupabaseAdmin } from './supabase';

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
 * Bounded by a 1500ms timeout to guarantee zero blocking impact on conversational latency.
 * This is background knowledge only. It must never turn the simulated customer into an agent.
 */
export async function getWyzeKnowledgeContext(
  product: string,
  issue: string,
  latestAgentMessage: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return '';

  const query = makeSearchText(product, issue, latestAgentMessage);
  if (!query) return '';

  try {
    const searchPromise = (async () => {
      const { data, error } = await supabase
        .from('knowledge_article_chunks')
        .select('title, source_url, category, product_name, content')
        .eq('is_active', true)
        .textSearch('fts', query, { type: 'websearch', config: 'english' })
        .limit(4);

      if (error) {
        console.warn('[Wyze Knowledge] Search query notice:', error.message);
        return '';
      }
      if (!data?.length) return '';

      return data.map((row: any, index: number) => [
        `[Reference ${index + 1}] ${row.title || 'Wyze Support Article'}`,
        `Product/category: ${row.product_name || row.category || 'Wyze Support'}`,
        `Source: ${row.source_url}`,
        String(row.content || '').slice(0, 2200)
      ].join('\n')).join('\n\n---\n\n');
    })();

    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve(''), 1500);
    });

    return await Promise.race([searchPromise, timeoutPromise]);
  } catch (error: any) {
    console.warn('[Wyze Knowledge] Retrieval unavailable; continuing without it:', error?.message || error);
    return '';
  }
}
