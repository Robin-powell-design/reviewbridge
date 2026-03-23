-- ReviewBridge Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/qjnbqtqivmtsbftiwqmx/sql)

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  context TEXT DEFAULT '',
  embed_url TEXT DEFAULT '',
  embed_type TEXT DEFAULT 'prototype' CHECK (embed_type IN ('prototype', 'figma', 'upload')),
  loom_url TEXT DEFAULT '',
  questions JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reviewer_name TEXT DEFAULT 'Anonymous',
  vibe_score REAL NOT NULL,
  quick_take TEXT DEFAULT '',
  answers JSONB DEFAULT '[]'::jsonb,
  pins JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_responses_review_id ON responses(review_id);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Reviews: anyone can read (needed for public /r/[id] links)
CREATE POLICY "Reviews are publicly readable"
  ON reviews FOR SELECT USING (true);

-- Reviews: anyone can insert (for now — we'll add auth later)
CREATE POLICY "Anyone can create reviews"
  ON reviews FOR INSERT WITH CHECK (true);

-- Reviews: anyone can update (for now — we'll add auth later)
CREATE POLICY "Anyone can update reviews"
  ON reviews FOR UPDATE USING (true);

-- Reviews: anyone can delete (for now — we'll add auth later)
CREATE POLICY "Anyone can delete reviews"
  ON reviews FOR DELETE USING (true);

-- Responses: anyone can read
CREATE POLICY "Responses are publicly readable"
  ON responses FOR SELECT USING (true);

-- Responses: anyone can submit a response (reviewers don't log in)
CREATE POLICY "Anyone can submit a response"
  ON responses FOR INSERT WITH CHECK (true);

-- Responses: anyone can update (for now)
CREATE POLICY "Anyone can update responses"
  ON responses FOR UPDATE USING (true);

-- Responses: anyone can delete (for now)
CREATE POLICY "Anyone can delete responses"
  ON responses FOR DELETE USING (true);

-- Seed demo data
INSERT INTO reviews (id, title, context, embed_url, embed_type, loom_url, questions, status, created_at) VALUES
  ('demo_shipment', 'Shipment Tracker Redesign', 'Reworked the shipment tracking dashboard — new timeline view, better status indicators, and real-time map.', '', 'prototype', '', '[{"text": "Does this layout make the key information easy to scan?", "type": "Rating"}, {"text": "Is anything confusing or unclear?", "type": "Text"}, {"text": "How does this compare to the current version?", "type": "Rating"}]', 'active', now() - interval '2 hours'),
  ('demo_website', 'Website Hero Section', 'New hero section for the marketing site rebrand. Two variations — dark and light themes with animated elements.', '', 'figma', '', '[{"text": "Which variation do you prefer — dark or light?", "type": "Text"}, {"text": "Does this feel on-brand?", "type": "Rating"}]', 'active', now() - interval '1 day'),
  ('demo_analytics', 'Analytics Dashboard v2', 'Early wireframes for the new analytics module. Needs feedback on data hierarchy and chart types.', '', 'figma', '', '[{"text": "Is the data hierarchy clear?", "type": "Rating"}, {"text": "Any chart types you think would work better?", "type": "Text"}]', 'active', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- Seed demo responses
INSERT INTO responses (id, review_id, reviewer_name, vibe_score, quick_take, answers, pins, submitted_at) VALUES
  ('r1', 'demo_shipment', 'Jake Kim', 9.2, 'Love the new timeline view', '[{"question": "Easy to scan?", "answer": "Very much"}]', '[]', now() - interval '45 minutes'),
  ('r2', 'demo_shipment', 'Maria Chen', 7.5, 'Big improvement, map needs work', '[{"question": "Easy to scan?", "answer": "Yes"}]', '[]', now() - interval '30 minutes'),
  ('r3', 'demo_shipment', 'Alex Santos', 8.8, 'Ship it', '[]', '[]', now() - interval '20 minutes'),
  ('r4', 'demo_website', 'Dan Lee', 9.0, 'Dark theme is fire', '[{"question": "Which variation?", "answer": "Dark, 100%"}]', '[]', now() - interval '20 hours'),
  ('r5', 'demo_website', 'Robin Powell', 9.4, '', '[]', '[]', now() - interval '18 hours')
ON CONFLICT (id) DO NOTHING;
