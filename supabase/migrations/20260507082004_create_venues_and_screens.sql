/*
  # Create venues and screens tables

  1. New Tables
    - `venues`
      - `id` (uuid, primary key)
      - `name` (text, unique) - venue display name
      - `created_at` (timestamptz)
    - `screens`
      - `id` (uuid, primary key)
      - `venue_id` (uuid, references venues) - which venue this screen is at
      - `name` (text) - optional screen identifier
      - `is_active` (boolean) - whether the screen is currently active
      - `created_at` (timestamptz)
      - `last_seen_at` (timestamptz) - last heartbeat from the screen

  2. Security
    - Enable RLS on both tables
    - Venues are readable by all authenticated users
    - Screens are readable/writable by authenticated users
*/

CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venues are readable by authenticated users"
  ON venues
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id),
  name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now()
);

ALTER TABLE screens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Screens are readable by authenticated users"
  ON screens
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Screens can be inserted by authenticated users"
  ON screens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Screens can be updated by authenticated users"
  ON screens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Seed some initial venues
INSERT INTO venues (name) VALUES
  ('The Arrow Lounge'),
  ('Bull''s Eye Bar'),
  ('Triple 20 Sports Club'),
  ('The Oche'),
  ('Dart & Pint')
ON CONFLICT (name) DO NOTHING;