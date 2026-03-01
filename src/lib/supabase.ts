import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PostStatus = 'pending' | 'idea' | 'planned' | 'in_progress' | 'completed' | 'closed';
export type PostCategory = 'feature' | 'bug' | 'improvement' | 'other';
export type UserRole = 'admin' | 'member';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  settings: Record<string, unknown>;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Post {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  status: PostStatus;
  category: PostCategory;
  votes: number;
  sort_order: number;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostVote {
  id: string;
  post_id: string;
  voter_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_name: string;
  author_id: string | null;
  content: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  organization_id: string;
  title: string;
  content: string;
  published_at: string | null;
  created_at: string;
}

export interface WidgetSettings {
  id: string;
  organization_id: string;
  accent_color: string;
  position: 'bottom_right' | 'bottom_left';
  enabled: boolean;
}
