import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      decks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      cards: {
        Row: {
          id: string;
          deck_id: string;
          user_id: string;
          front: string;
          back: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          user_id: string;
          front: string;
          back: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          deck_id?: string;
          user_id?: string;
          front?: string;
          back?: string;
          created_at?: string;
        };
      };
      card_reviews: {
        Row: {
          id: string;
          card_id: string;
          user_id: string;
          easiness_factor: number;
          interval: number;
          repetitions: number;
          next_review: string;
          last_review: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          user_id: string;
          easiness_factor?: number;
          interval?: number;
          repetitions?: number;
          next_review?: string;
          last_review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          user_id?: string;
          easiness_factor?: number;
          interval?: number;
          repetitions?: number;
          next_review?: string;
          last_review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      review_history: {
        Row: {
          id: string;
          card_id: string;
          user_id: string;
          quality: number;
          reviewed_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          user_id: string;
          quality: number;
          reviewed_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          user_id?: string;
          quality?: number;
          reviewed_at?: string;
        };
      };
    };
  };
}
