-- ==============================================================================
-- VIHARI'S EMBROIDERY - INITIAL SEED DATA
-- Run in Supabase SQL Editor after running schema.sql
-- ==============================================================================

-- 1. Ensure categories exist
INSERT INTO public.categories (id, name) VALUES
  ('c1111111-1111-1111-1111-111111111101', 'Floral'),
  ('c1111111-1111-1111-1111-111111111102', 'Bridal'),
  ('c1111111-1111-1111-1111-111111111103', 'Saree'),
  ('c1111111-1111-1111-1111-111111111104', 'Blouse'),
  ('c1111111-1111-1111-1111-111111111105', 'Kids'),
  ('c1111111-1111-1111-1111-111111111106', 'Neck Designs'),
  ('c1111111-1111-1111-1111-111111111107', 'Border'),
  ('c1111111-1111-1111-1111-111111111108', 'Traditional'),
  ('c1111111-1111-1111-1111-111111111109', 'Modern'),
  ('c1111111-1111-1111-1111-111111111110', 'Arabic'),
  ('c1111111-1111-1111-1111-111111111111', 'Custom'),
  ('c1111111-1111-1111-1111-111111111112', 'Other')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed initial demo designs
INSERT INTO public.designs (
  design_id, name, description, category_id, cloudinary_public_id,
  cloudinary_url, thumbnail_url, original_filename, file_hash, file_size, is_favorite
) VALUES
('EMB-0001', 'Floral Vine', 'Delicate botanical silk thread embroidery with golden accents.', (SELECT id FROM public.categories WHERE name = 'Floral'), 'demo_floral_vine', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=500&q=80', 'IMG_2026_Floral_Vine.jpg', '8f481a5a7b6e92f1b0a51c4a92e10459c7f1a3028bfe7e8264d1f2a1789c0a01', 2450320, true),
('EMB-0002', 'Royal Paisley', 'Classic Indian mango motif embroidered with fine zari thread.', (SELECT id FROM public.categories WHERE name = 'Traditional'), 'demo_royal_paisley', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=500&q=80', 'IMG_2026_Royal_Paisley.jpg', '2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d02', 3120400, true),
('EMB-0003', 'Bridal Rose', 'Heavy bridal zardozi embroidery with crimson and gold bullion wire work.', (SELECT id FROM public.categories WHERE name = 'Bridal'), 'demo_bridal_rose', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=500&q=80', 'IMG_2026_Bridal_Rose.jpg', '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a03', 4210900, true),
('EMB-0004', 'Peacock Motif', 'Majestic peacock featuring shaded emerald, sapphire, and gold silk thread plumage.', (SELECT id FROM public.categories WHERE name = 'Traditional'), 'demo_peacock_motif', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=500&q=80', 'IMG_2026_Peacock_Motif.jpg', '4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b04', 2890100, false),
('EMB-0005', 'Traditional Border', 'Continuous geometric and leafy border suitable for sarees and dupatta hems.', (SELECT id FROM public.categories WHERE name = 'Border'), 'demo_traditional_border', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=500&q=80', 'IMG_2026_Border_01.jpg', '5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c05', 1980300, false),
('EMB-0006', 'Arabic Pattern', 'Intricate Moroccan and Arabesque interlocking floral geometry in metallic thread.', (SELECT id FROM public.categories WHERE name = 'Arabic'), 'demo_arabic_pattern', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&q=80', 'IMG_2026_Arabic_01.jpg', '6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d06', 3450200, true)
ON CONFLICT (file_hash) DO NOTHING;

-- Reset sequence to continue after the seeded IDs
SELECT setval('public.emb_design_seq', 25, true);
