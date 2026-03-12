/*
  # Questions, Goals, and Community Tables
  
  1. New Tables
    - `question_sets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `topic` (text)
      - `status` (text) - pending/approved
      - `created_at` (timestamptz)
      
    - `questions`
      - `id` (uuid, primary key)
      - `set_id` (uuid, references question_sets)
      - `question` (text)
      - `option_a` (text)
      - `option_b` (text)
      - `option_c` (text)
      - `option_d` (text)
      - `correct_answer` (text) - 'a', 'b', 'c', or 'd'
      - `explanation` (text)
      - `created_at` (timestamptz)
      
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `week_of` (date)
      - `goal_1` (text)
      - `goal_2` (text)
      - `goal_3` (text)
      - `personal_goal` (text)
      - `checkins` (jsonb) - array of dates when checked in
      - `created_at` (timestamptz)
      
    - `community_posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `display_name` (text)
      - `content` (text)
      - `is_anonymous` (boolean, default false)
      - `likes` (integer, default 0)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on all tables
    - Appropriate policies for users and admins
*/

-- Question sets table
CREATE TABLE IF NOT EXISTS question_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own question sets"
  ON question_sets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create question sets"
  ON question_sets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all question sets"
  ON question_sets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage all question sets"
  ON question_sets FOR ALL
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

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid REFERENCES question_sets(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL,
  explanation text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view questions from own sets"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM question_sets
      WHERE question_sets.id = questions.set_id
      AND question_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all questions"
  ON questions FOR ALL
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

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_of date NOT NULL,
  goal_1 text,
  goal_2 text,
  goal_3 text,
  personal_goal text,
  checkins jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_of)
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view partner goals"
  ON goals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.partner_id = goals.user_id
    )
  );

CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all goals"
  ON goals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  display_name text NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all posts"
  ON community_posts FOR ALL
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