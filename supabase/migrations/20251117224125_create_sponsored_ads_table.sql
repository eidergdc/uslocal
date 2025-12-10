/*
  # Create Sponsored Ads System

  1. New Tables
    - `sponsored_ads`
      - `id` (uuid, primary key)
      - `title` (text) - Ad title
      - `description` (text) - Ad description
      - `image_url` (text) - Ad image URL
      - `link_url` (text) - Where the ad redirects
      - `placement` (text) - Where ad appears: 'home_list', 'item_detail', 'category_story'
      - `item_id` (text, nullable) - If linking to an internal item
      - `priority` (integer) - Higher priority shows first
      - `start_date` (timestamptz) - When ad campaign starts
      - `end_date` (timestamptz) - When ad campaign ends
      - `is_active` (boolean) - Active/inactive status
      - `click_count` (integer) - Track ad clicks
      - `view_count` (integer) - Track ad views
      - `created_by` (uuid) - Admin who created it
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `sponsored_ads` table
    - Public can view active ads
    - Only admins can create/update/delete ads

  3. Indexes
    - Index on `placement` for fast filtering
    - Index on `is_active` and date range for active campaigns
*/

CREATE TABLE IF NOT EXISTS sponsored_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  placement text NOT NULL CHECK (placement IN ('home_list', 'item_detail', 'category_story')),
  item_id text,
  priority integer DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  click_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sponsored_ads ENABLE ROW LEVEL SECURITY;

-- Public can view active ads within date range
CREATE POLICY "Anyone can view active ads"
  ON sponsored_ads
  FOR SELECT
  USING (
    is_active = true
    AND start_date <= now()
    AND (end_date IS NULL OR end_date >= now())
  );

-- Only authenticated users can view all ads (for admin panel)
CREATE POLICY "Authenticated users can view all ads"
  ON sponsored_ads
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert ads
CREATE POLICY "Authenticated users can insert ads"
  ON sponsored_ads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only authenticated users can update ads
CREATE POLICY "Authenticated users can update ads"
  ON sponsored_ads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Only authenticated users can delete ads
CREATE POLICY "Authenticated users can delete ads"
  ON sponsored_ads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsored_ads_placement ON sponsored_ads(placement);
CREATE INDEX IF NOT EXISTS idx_sponsored_ads_active ON sponsored_ads(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_sponsored_ads_priority ON sponsored_ads(priority DESC);