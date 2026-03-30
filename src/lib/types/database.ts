export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ListingStatus = "draft" | "active" | "sold" | "archived" | "moderation";

export type ListingCategory =
  | "clothing"
  | "shoes"
  | "accessories"
  | "electronics"
  | "books"
  | "toys"
  | "furniture";

export type ModerationStatus = "pending" | "approved" | "rejected" | "flagged";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          location: Json | null;
          preferences: Json | null;
          style_examples: string[] | null;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          location?: Json | null;
          preferences?: Json | null;
          style_examples?: string[] | null;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          location?: Json | null;
          preferences?: Json | null;
          style_examples?: string[] | null;
          locale?: string;
          updated_at?: string;
        };
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          title_en: string | null;
          description: string;
          description_en: string | null;
          price: number;
          suggested_price: number | null;
          currency: string;
          status: ListingStatus;
          category: ListingCategory;
          tags: string[];
          location: Json | null;
          ai_metadata: Json | null;
          voice_transcript: string | null;
          views_count: number;
          favorites_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          title_en?: string | null;
          description: string;
          description_en?: string | null;
          price: number;
          suggested_price?: number | null;
          currency?: string;
          status?: ListingStatus;
          category: ListingCategory;
          tags?: string[];
          location?: Json | null;
          ai_metadata?: Json | null;
          voice_transcript?: string | null;
          views_count?: number;
          favorites_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          title_en?: string | null;
          description?: string;
          description_en?: string | null;
          price?: number;
          suggested_price?: number | null;
          status?: ListingStatus;
          category?: ListingCategory;
          tags?: string[];
          location?: Json | null;
          ai_metadata?: Json | null;
          updated_at?: string;
        };
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          url_original: string;
          url_enhanced: string | null;
          order: number;
          ai_analysis: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          url_original: string;
          url_enhanced?: string | null;
          order: number;
          ai_analysis?: Json | null;
          created_at?: string;
        };
        Update: {
          url_enhanced?: string | null;
          order?: number;
          ai_analysis?: Json | null;
        };
      };
      chats: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          messages: Json;
          last_message_at: string | null;
          is_claw_managed: boolean;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          messages?: Json;
          last_message_at?: string | null;
          is_claw_managed?: boolean;
          status?: string;
          created_at?: string;
        };
        Update: {
          messages?: Json;
          last_message_at?: string | null;
          is_claw_managed?: boolean;
          status?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      moderation_logs: {
        Row: {
          id: string;
          listing_id: string;
          status: ModerationStatus;
          ai_score: number | null;
          ai_reason: string | null;
          reviewer_id: string | null;
          reviewer_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          status: ModerationStatus;
          ai_score?: number | null;
          ai_reason?: string | null;
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          created_at?: string;
        };
        Update: {
          status?: ModerationStatus;
          ai_score?: number | null;
          ai_reason?: string | null;
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
        };
      };
    };
  };
}
