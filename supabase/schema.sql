-- ==============================================================================
-- EMBROIDERY STUDIO - COMPLETE DATABASE SCHEMA
-- Supabase PostgreSQL Setup
-- ==============================================================================

-- 1. Enable pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Sequence for Sequential EMB-0001 Design IDs
CREATE SEQUENCE IF NOT EXISTS public.emb_design_seq START WITH 1 INCREMENT BY 1;

-- 4. Create Designs Table
CREATE TABLE IF NOT EXISTS public.designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    cloudinary_public_id TEXT NOT NULL,
    cloudinary_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_hash TEXT NOT NULL UNIQUE,
    file_size BIGINT NOT NULL DEFAULT 0,
    width INTEGER,
    height INTEGER,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Trigger Function to automatically assign sequential EMB-XXXX IDs if not provided
CREATE OR REPLACE FUNCTION public.set_design_id_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.design_id IS NULL OR NEW.design_id = '' THEN
        NEW.design_id := 'EMB-' || LPAD(nextval('public.emb_design_seq')::text, 4, '0');
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_design_id ON public.designs;
CREATE TRIGGER tr_set_design_id
    BEFORE INSERT OR UPDATE ON public.designs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_design_id_fn();

-- 6. Indexes for ultra-fast searches and duplicate detection
CREATE INDEX IF NOT EXISTS idx_designs_file_hash ON public.designs(file_hash);
CREATE INDEX IF NOT EXISTS idx_designs_design_id ON public.designs(design_id);
CREATE INDEX IF NOT EXISTS idx_designs_category_id ON public.designs(category_id);
CREATE INDEX IF NOT EXISTS idx_designs_created_at ON public.designs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_is_favorite ON public.designs(is_favorite);
CREATE INDEX IF NOT EXISTS idx_designs_name ON public.designs USING gin(to_tsvector('english', name));

-- 7. Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to designs and categories (Customer Catalog & Presentation)
CREATE POLICY "Public Read Categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Public Read Designs" ON public.designs
    FOR SELECT USING (true);

-- Allow authenticated users (Admin) full access to insert, update, and delete
CREATE POLICY "Admin All Categories" ON public.categories
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin All Designs" ON public.designs
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 8. Seed Initial Standard Categories
INSERT INTO public.categories (name)
VALUES
    ('Floral'),
    ('Bridal'),
    ('Saree'),
    ('Blouse'),
    ('Kids'),
    ('Neck Designs'),
    ('Border'),
    ('Traditional'),
    ('Modern'),
    ('Arabic'),
    ('Custom'),
    ('Other')
ON CONFLICT (name) DO NOTHING;
