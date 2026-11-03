-- Wyze Support Article Knowledge Store
-- Separate from knowledge_cases: articles are factual reference material, not training answers.
-- Run once in Supabase SQL Editor.

BEGIN;

CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zendesk_article_id BIGINT UNIQUE,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  category TEXT,
  section TEXT,
  product_name TEXT,
  article_type TEXT,
  source_updated_at TIMESTAMPTZ,
  source_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.knowledge_article_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  category TEXT,
  product_name TEXT,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  fts TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_active ON public.knowledge_articles(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON public.knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_article_chunks_fts ON public.knowledge_article_chunks USING GIN(fts);
CREATE INDEX IF NOT EXISTS idx_knowledge_article_chunks_article ON public.knowledge_article_chunks(article_id, chunk_index);

CREATE OR REPLACE FUNCTION public.set_knowledge_article_chunk_fts()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.fts := to_tsvector('english', coalesce(NEW.title, '') || ' ' || coalesce(NEW.product_name, '') || ' ' || coalesce(NEW.category, '') || ' ' || coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_knowledge_article_chunk_fts ON public.knowledge_article_chunks;
CREATE TRIGGER trg_knowledge_article_chunk_fts
BEFORE INSERT OR UPDATE OF title, product_name, category, content
ON public.knowledge_article_chunks
FOR EACH ROW EXECUTE FUNCTION public.set_knowledge_article_chunk_fts();

ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_article_chunks ENABLE ROW LEVEL SECURITY;

-- No client-facing policies. The browser anon/authenticated roles cannot read article content.
REVOKE ALL ON public.knowledge_articles FROM anon, authenticated, public;
REVOKE ALL ON public.knowledge_article_chunks FROM anon, authenticated, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_articles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_article_chunks TO service_role;

COMMIT;
