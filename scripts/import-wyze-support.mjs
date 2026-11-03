/**
 * Imports public Wyze Help Center articles discovered from the supplied Markdown index.
 * Requires the project's existing @supabase/supabase-js dependency.
 *
 * Run:
 * node lib/import-wyze-support.mjs ./wyze_support_links_final.md
 */
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const inputPath = process.argv[2] || './wyze_support_links_final.md';
const base = 'https://support.wyze.com';
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const markdown = await fs.readFile(inputPath, 'utf8');

const categoryIds = new Set();
const sectionIds = new Set();
const articleIds = new Set();

for (const match of markdown.matchAll(
  /https?:\/\/support\.wyze\.com\/hc\/en-us\/(categories|sections|articles)\/(\d+)/g
)) {
  const id = Number(match[2]);
  if (!Number.isFinite(id)) continue;

  if (match[1] === 'categories') categoryIds.add(id);
  if (match[1] === 'sections') sectionIds.add(id);
  if (match[1] === 'articles') articleIds.add(id);
}

function cleanHtml(html = '') {
  return html
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Wyze-ECE-Knowledge-Importer/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.json();
}

async function collectPages(firstUrl, key) {
  const items = [];
  let url = firstUrl;
  let pageGuard = 0;

  while (url && pageGuard++ < 100) {
    const json = await getJson(url);
    items.push(...(json[key] || []));
    url = json.next_page || null;
  }

  return items;
}

const sections = new Map();

for (const id of sectionIds) {
  try {
    const json = await getJson(
      `${base}/api/v2/help_center/sections/${id}.json`
    );

    if (json.section) sections.set(id, json.section);
  } catch (e) {
    console.warn(`Section ${id} skipped: ${e.message}`);
  }
}

for (const id of categoryIds) {
  try {
    const found = await collectPages(
      `${base}/api/v2/help_center/categories/${id}/sections.json?per_page=100`,
      'sections'
    );

    for (const section of found) {
      sections.set(section.id, section);
    }
  } catch (e) {
    console.warn(`Category ${id} sections skipped: ${e.message}`);
  }
}

const articles = new Map();

for (const id of articleIds) {
  try {
    const json = await getJson(
      `${base}/api/v2/help_center/articles/${id}.json`
    );

    if (json.article) articles.set(id, json.article);
  } catch (e) {
    console.warn(`Article ${id} skipped: ${e.message}`);
  }
}

for (const [sectionId] of sections) {
  try {
    const found = await collectPages(
      `${base}/api/v2/help_center/sections/${sectionId}/articles.json?per_page=100`,
      'articles'
    );

    for (const article of found) {
      articles.set(article.id, article);
    }
  } catch (e) {
    console.warn(`Articles for section ${sectionId} skipped: ${e.message}`);
  }
}

function classify(title) {
  const t = title.toLowerCase();

  if (/troubleshoot|offline|connect|error|reset|not working|won't|can't|unable/.test(t)) {
    return 'troubleshooting';
  }

  if (/getting started|setup|install|pair|add .*app/.test(t)) {
    return 'getting_started';
  }

  if (/faq|what is|how does|can i|does .* support/.test(t)) {
    return 'faq';
  }

  if (/warranty|return|refund|shipping|order|cancel/.test(t)) {
    return 'orders_returns';
  }

  return 'support_reference';
}

function splitChunks(text, size = 3600, overlap = 350) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + size, text.length);

    if (end < text.length) {
      const boundary = text.lastIndexOf('\n', end);

      if (boundary > start + size * 0.65) {
        end = boundary;
      }
    }

    const chunk = text.slice(start, end).trim();

    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

let imported = 0;
let skipped = 0;

for (const article of articles.values()) {
  const title = String(article.title || '').trim();

  const sourceUrl = String(
    article.html_url ||
    `${base}/hc/en-us/articles/${article.id}`
  ).trim();

  const body = cleanHtml(article.body || '');

  if (!title || body.length < 80) {
    skipped++;
    continue;
  }

  const section = sections.get(Number(article.section_id));
  const category = section?.name || 'Wyze Support';

  const contentHash = crypto
    .createHash('sha256')
    .update(body)
    .digest('hex');

  const record = {
    zendesk_article_id: Number(article.id),
    title,
    source_url: sourceUrl,
    category,
    section: section?.name || null,
    product_name: null,
    article_type: classify(title),
    source_updated_at: article.edited_at || article.updated_at || null,
    source_hash: contentHash,
    is_active: !article.draft,
    imported_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: saved, error } = await supabase
    .from('knowledge_articles')
    .upsert(record, { onConflict: 'source_url' })
    .select('id')
    .single();

  if (error || !saved?.id) {
    console.warn(`Article save failed: ${title}: ${error?.message}`);
    skipped++;
    continue;
  }

  const chunks = splitChunks(body).map((content, index) => ({
    article_id: saved.id,
    chunk_index: index,
    title,
    source_url: sourceUrl,
    category,
    product_name: null,
    content,
    is_active: !article.draft
  }));

  const { error: deleteError } = await supabase
    .from('knowledge_article_chunks')
    .delete()
    .eq('article_id', saved.id);

  if (deleteError) {
    console.warn(`Could not refresh chunks for ${title}: ${deleteError.message}`);
    skipped++;
    continue;
  }

  const { error: insertError } = await supabase
    .from('knowledge_article_chunks')
    .insert(chunks);

  if (insertError) {
    console.warn(`Chunk import failed for ${title}: ${insertError.message}`);
    skipped++;
    continue;
  }

  imported++;
  console.log(`Imported: ${title} (${chunks.length} chunks)`);
}

console.log(
  `\nFinished. Imported ${imported} articles; skipped ${skipped}; discovered ${articles.size} articles and ${sections.size} sections.`
);
