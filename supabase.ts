import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  name: string;
  email: string;
  exam_target?: string;
  learning_type?: string;
  memory_style?: string;
  focus_duration?: string;
  peak_hours?: string;
  biggest_distraction?: string;
  stress_level?: string;
  weak_subject?: string;
  handle_difficult_topics?: string;
  daily_study_hours?: string;
  partner_id?: string;
  payment_status: string;
  payment_code?: string;
  is_admin: boolean;
  last_active?: string;
  created_at?: string;
}
