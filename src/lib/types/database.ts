export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ListingStatus = "draft" | "active" | "sold" | "archived" | "moderation" | "rejected";

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
    Views: Record<string, {
      Row: Record<string, unknown>;
      Relationships: unknown[];
    }>;
    Functions: Record<string, {
      Args: Record<string, unknown>;
      Returns: unknown;
    }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, unknown>;
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
          country_code: string | null;
          city: string | null;
          latitude: number | null;
          longitude: number | null;
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
          country_code?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
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
          country_code?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketplace_platforms: {
        Row: {
          id: string;
          country_code: string;
          name: string;
          slug: string;
          is_api_available: boolean;
          posting_method: "api" | "template" | "manual";
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          country_code: string;
          name: string;
          slug: string;
          is_api_available?: boolean;
          posting_method?: "api" | "template" | "manual";
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          country_code?: string;
          name?: string;
          slug?: string;
          is_api_available?: boolean;
          posting_method?: "api" | "template" | "manual";
          description?: string | null;
          sort_order?: number;
        };
        Relationships: [];
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
          views_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
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
          pending_ai_suggestion: Json | null;
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
          pending_ai_suggestion?: Json | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          messages?: Json;
          last_message_at?: string | null;
          is_claw_managed?: boolean;
          pending_ai_suggestion?: Json | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chats_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
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
          reviewed_at: string | null;
          human_notes: string | null;
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
          reviewed_at?: string | null;
          human_notes?: string | null;
          created_at?: string;
        };
        Update: {
          status?: ModerationStatus;
          ai_score?: number | null;
          ai_reason?: string | null;
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          reviewed_at?: string | null;
          human_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_logs_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
  };
}
