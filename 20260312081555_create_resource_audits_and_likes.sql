/*
  # Resource Audits and Post Likes Tables
  
  1. New Tables
    - `resource_audits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `exam_target` (text)
      - `current_resources` (text)
      - `weakest_subject` (text)
      - `time_to_exam` (text)
      - `resource_guide` (text) - AI generated guide
      - `created_at` (timestamptz)
      
    - `post_likes`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references community_posts)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - Unique constraint on (post_id, user_id)
      
    - `question_attempts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `question_id` (uuid, references questions)
      - `selected_answer` (text)
      - `is_correct` (boolean)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on all tables
    - Appropriate policies for users and admins
*/

-- Resource audits table
CREATE TABLE IF NOT EXISTS resource_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exam_target text NOT NULL,
  current_resources text NOT NULL,
  weakest_subject text NOT NULL,
  time_to_exam text NOT NULL,
  resource_guide text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resource_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resource audits"
  ON resource_audits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own resource audits"
  ON resource_audits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all resource audits"
  ON resource_audits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update resource audits"
  ON resource_audits FOR UPDATE
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

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
  ON post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON post_likes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Question attempts table
CREATE TABLE IF NOT EXISTS question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON question_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attempts"
  ON question_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts"
  ON question_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );