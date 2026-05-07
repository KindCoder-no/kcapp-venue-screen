/*
  # Allow anonymous access for venues and screens

  Screens are public display devices that don't require authentication.
  Matches are started remotely from a backend, so screens just need to read
  venues and register themselves.

  1. Security Changes
    - Allow anon role to SELECT venues
    - Allow anon role to SELECT, INSERT, UPDATE screens
*/

CREATE POLICY "Venues are readable by anon"
  ON venues
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Screens can be read by anon"
  ON screens
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Screens can be registered by anon"
  ON screens
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Screens can be updated by anon"
  ON screens
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);