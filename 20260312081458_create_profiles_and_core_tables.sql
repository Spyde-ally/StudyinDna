/*
  # StudyDNA OS Database Schema
  
  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `exam_target` (text) - NEET/JEE and year
      - `learning_type` (text) - from quiz
      - `memory_style` (text)
      - `focus_duration` (text)
      - `peak_hours` (text)
      - `biggest_distraction` (text)
      - `stress_level` (text)
      - `weak_subject` (text)
      - `handle_difficult_topics` (text)
      - `daily_study_hours` (text)
      - `partner_id` (uuid, nullable) - links to another user
      - `payment_status` (text) - pending/verified
      - `payment_code` (text, nullable)
      - `is_admin` (boolean, default false)
      - `last_active` (timestamptz)
      - `created_at` (timestamptz)
      
    - `schedules`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `week_of` (date) - start date of the week
      - `monday` through `sunday` (jsonb) - stores {subject, topic, duration, completed}
      - `notes` (text)
      - `created_at` (timestamptz)
      
    - `flashcard_sets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `topic` (text)
      - `status` (text) - pending/approved
      - `created_at` (timestamptz)
      
    - `flashcards`
      - `id` (uuid, primary key)
      - `set_id` (uuid, references flashcard_sets)
      - `front` (text) - question
      - `back` (text) - answer
      - `difficulty` (text)
      - `known` (boolean, default false)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to access their own data
    - Admin policies for full access
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  exam_target text,
  learning_type text,
  memory_style text,
  focus_duration text,
  peak_hours text,
  biggest_distraction text,
  stress_level text,
  weak_subject text,
  handle_difficult_topics text,
  daily_study_hours text,
  partner_id uuid REFERENCES profiles(id),
  payment_status text DEFAULT 'pending',
  payment_code text,
  is_admin boolean DEFAULT false,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin = true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_of date NOT NULL,
  monday jsonb DEFAULT '[]'::jsonb,
  tuesday jsonb DEFAULT '[]'::jsonb,
  wednesday jsonb DEFAULT '[]'::jsonb,
  thursday jsonb DEFAULT '[]'::jsonb,
  friday jsonb DEFAULT '[]'::jsonb,
  saturday jsonb DEFAULT '[]'::jsonb,
  sunday jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_of)
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own schedules"
  ON schedules FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage all schedules"
  ON schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Flashcard sets table
CREATE TABLE IF NOT EXISTS flashcard_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flashcard sets"
  ON flashcard_sets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create flashcard sets"
  ON flashcard_sets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all flashcard sets"
  ON flashcard_sets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage all flashcard sets"
  ON flashcard_sets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid REFERENCES flashcard_sets(id) ON DELETE CASCADE NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  difficulty text,
  known boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view flashcards from own sets"
  ON flashcards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE flashcard_sets.id = flashcards.set_id
      AND flashcard_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update flashcards from own sets"
  ON flashcards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE flashcard_sets.id = flashcards.set_id
      AND flashcard_sets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flashcard_sets
      WHERE flashcard_sets.id = flashcards.set_id
      AND flashcard_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all flashcards"
  ON flashcards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );