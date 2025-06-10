export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          product_id: string
          last_message: string | null
          last_message_at: string | null
          last_message_sender_id: string | null
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          product_id: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_sender_id?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          product_id?: string
          last_message?: string | null
          last_message_at?: string | null
          last_message_sender_id?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_buyer_id_fkey"
            columns: ["buyer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_seller_id_fkey"
            columns: ["seller_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_last_message_sender_id_fkey"
            columns: ["last_message_sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string
          message_type: string
          media_url: string | null
          offer_amount: number | null
          offer_status: string | null
          is_read: boolean
          is_edited: boolean
          edited_at: string | null
          reply_to_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content: string
          message_type?: string
          media_url?: string | null
          offer_amount?: number | null
          offer_status?: string | null
          is_read?: boolean
          is_edited?: boolean
          edited_at?: string | null
          reply_to_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          content?: string
          message_type?: string
          media_url?: string | null
          offer_amount?: number | null
          offer_status?: string | null
          is_read?: boolean
          is_edited?: boolean
          edited_at?: string | null
          reply_to_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          type: string
          priority: string
          is_read: boolean
          action_url: string | null
          data: Json | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          type: string
          priority?: string
          is_read?: boolean
          action_url?: string | null
          data?: Json | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          type?: string
          priority?: string
          is_read?: boolean
          action_url?: string | null
          data?: Json | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: string
          buyer_id: string
          seller_id: string
          product_id: string
          status: string
          payment_method: string
          payment_status: string
          total_amount: number
          delivery_method: string
          delivery_address_id: string | null
          delivery_notes: string | null
          meetup_location: string | null
          meetup_time: string | null
          tracking_number: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          buyer_id: string
          seller_id: string
          product_id: string
          status?: string
          payment_method?: string
          payment_status?: string
          total_amount: number
          delivery_method?: string
          delivery_address_id?: string | null
          delivery_notes?: string | null
          meetup_location?: string | null
          meetup_time?: string | null
          tracking_number?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          buyer_id?: string
          seller_id?: string
          product_id?: string
          status?: string
          payment_method?: string
          payment_status?: string
          total_amount?: number
          delivery_method?: string
          delivery_address_id?: string | null
          delivery_notes?: string | null
          meetup_location?: string | null
          meetup_time?: string | null
          tracking_number?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            referencedRelation: "user_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          reviewer_id: string
          seller_id: string
          order_id: string | null
          rating: number
          title: string | null
          comment: string | null
          images: string[] | null
          is_verified_purchase: boolean
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          reviewer_id: string
          seller_id: string
          order_id?: string | null
          rating: number
          title?: string | null
          comment?: string | null
          images?: string[] | null
          is_verified_purchase?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          reviewer_id?: string
          seller_id?: string
          order_id?: string | null
          rating?: number
          title?: string | null
          comment?: string | null
          images?: string[] | null
          is_verified_purchase?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_seller_id_fkey"
            columns: ["seller_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      product_views: {
        Row: {
          id: string
          product_id: string
          viewer_id: string | null
          ip_address: unknown | null
          user_agent: string | null
          referrer: string | null
          session_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          viewer_id?: string | null
          ip_address?: unknown | null
          user_agent?: string | null
          referrer?: string | null
          session_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          viewer_id?: string | null
          ip_address?: unknown | null
          user_agent?: string | null
          referrer?: string | null
          session_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_views_viewer_id_fkey"
            columns: ["viewer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          category_id: string
          category: string
          condition: string
          images: string[] | null
          specifications: Json | null
          seller_id: string
          is_sold: boolean
          is_featured: boolean
          is_promoted: boolean
          view_count: number
          save_count: number
          location: string | null
          tags: string[] | null
          availability_status: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          category_id: string
          category: string
          condition: string
          images?: string[] | null
          specifications?: Json | null
          seller_id: string
          is_sold?: boolean
          is_featured?: boolean
          is_promoted?: boolean
          view_count?: number
          save_count?: number
          location?: string | null
          tags?: string[] | null
          availability_status?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          category_id?: string
          category?: string
          condition?: string
          images?: string[] | null
          specifications?: Json | null
          seller_id?: string
          is_sold?: boolean
          is_featured?: boolean
          is_promoted?: boolean
          view_count?: number
          save_count?: number
          location?: string | null
          tags?: string[] | null
          availability_status?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string | null
          reported_product_id: string | null
          reported_message_id: string | null
          type: string
          reason: string
          description: string | null
          evidence_urls: string[] | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id?: string | null
          reported_product_id?: string | null
          reported_message_id?: string | null
          type: string
          reason: string
          description?: string | null
          evidence_urls?: string[] | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string | null
          reported_product_id?: string | null
          reported_message_id?: string | null
          type?: string
          reason?: string
          description?: string | null
          evidence_urls?: string[] | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_message_id_fkey"
            columns: ["reported_message_id"]
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_product_id_fkey"
            columns: ["reported_product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_products: {
        Row: {
          id: string
          user_id: string
          product_id: string
          collection_name: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          collection_name?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          collection_name?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_products_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_products_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      search_history: {
        Row: {
          id: string
          user_id: string | null
          query: string
          filters: Json | null
          results_count: number | null
          clicked_product_id: string | null
          ip_address: unknown | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          query: string
          filters?: Json | null
          results_count?: number | null
          clicked_product_id?: string | null
          ip_address?: unknown | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          query?: string
          filters?: Json | null
          results_count?: number | null
          clicked_product_id?: string | null
          ip_address?: unknown | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_clicked_product_id_fkey"
            columns: ["clicked_product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_addresses: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          address_line_1: string
          address_line_2: string | null
          city: string
          state: string | null
          postal_code: string | null
          country: string
          phone: string | null
          is_default: boolean
          delivery_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type?: string
          address_line_1: string
          address_line_2?: string | null
          city: string
          state?: string | null
          postal_code?: string | null
          country?: string
          phone?: string | null
          is_default?: boolean
          delivery_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          state?: string | null
          postal_code?: string | null
          country?: string
          phone?: string | null
          is_default?: boolean
          delivery_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_categories: string[] | null
          notifications_enabled: boolean
          email_notifications: boolean
          push_notifications: boolean
          sms_notifications: boolean
          marketing_emails: boolean
          price_alerts: boolean
          new_message_notifications: boolean
          order_updates: boolean
          product_recommendations: boolean
          weekly_digest: boolean
          language: string
          currency: string
          timezone: string
          privacy_level: string
          show_online_status: boolean
          show_last_seen: boolean
          allow_contact_from: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_categories?: string[] | null
          notifications_enabled?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          marketing_emails?: boolean
          price_alerts?: boolean
          new_message_notifications?: boolean
          order_updates?: boolean
          product_recommendations?: boolean
          weekly_digest?: boolean
          language?: string
          currency?: string
          timezone?: string
          privacy_level?: string
          show_online_status?: boolean
          show_last_seen?: boolean
          allow_contact_from?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_categories?: string[] | null
          notifications_enabled?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          marketing_emails?: boolean
          price_alerts?: boolean
          new_message_notifications?: boolean
          order_updates?: boolean
          product_recommendations?: boolean
          weekly_digest?: boolean
          language?: string
          currency?: string
          timezone?: string
          privacy_level?: string
          show_online_status?: boolean
          show_last_seen?: boolean
          allow_contact_from?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          university: string | null
          avatar_url: string | null
          phone: string | null
          bio: string | null
          is_verified: boolean
          verification_status: string
          rating: number | null
          total_reviews: number
          total_sales: number
          total_earnings: number
          last_active: string
          is_online: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          university?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          is_verified?: boolean
          verification_status?: string
          rating?: number | null
          total_reviews?: number
          total_sales?: number
          total_earnings?: number
          last_active?: string
          is_online?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          university?: string | null
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          is_verified?: boolean
          verification_status?: string
          rating?: number | null
          total_reviews?: number
          total_sales?: number
          total_earnings?: number
          last_active?: string
          is_online?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      verification_requests: {
        Row: {
          id: string
          user_id: string
          student_id_image_url: string
          university: string
          student_id_number: string | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          verification_code: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          student_id_image_url: string
          university: string
          student_id_number?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          verification_code?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          student_id_image_url?: string
          university?: string
          student_id_number?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          verification_code?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_body: string
          p_type: string
          p_data?: Json
        }
        Returns: string
      }
      get_category_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          count: number
        }[]
      }
      get_flash_deals: {
        Args: {
          max_price?: number
          limit_count?: number
        }
        Returns: {
          id: string
          title: string
          price: number
          category: string
          images: string[]
          seller_id: string
          seller_name: string
          seller_verified: boolean
        }[]
      }
      get_new_arrivals: {
        Args: {
          days_ago?: number
          limit_count?: number
        }
        Returns: {
          id: string
          title: string
          price: number
          category: string
          images: string[]
          seller_id: string
          seller_name: string
          seller_verified: boolean
          created_at: string
        }[]
      }
      get_product_details: {
        Args: {
          product_id: string
        }
        Returns: {
          id: string
          title: string
          description: string
          price: number
          category: string
          condition: string
          images: string[]
          specifications: Json
          seller_id: string
          seller_name: string
          seller_avatar: string
          seller_university: string
          seller_verified: boolean
          seller_rating: number
          seller_reviews: number
          is_sold: boolean
          is_featured: boolean
          view_count: number
          save_count: number
          created_at: string
        }[]
      }
      get_product_reviews: {
        Args: {
          product_id: string
        }
        Returns: {
          id: string
          rating: number
          title: string
          comment: string
          images: string[]
          reviewer_id: string
          reviewer_name: string
          reviewer_avatar: string
          is_verified_purchase: boolean
          helpful_count: number
          created_at: string
        }[]
      }
      get_related_products: {
        Args: {
          product_id: string
          limit_count?: number
        }
        Returns: {
          id: string
          title: string
          price: number
          category: string
          images: string[]
          seller_id: string
          seller_name: string
          seller_verified: boolean
        }[]
      }
      get_seller_products: {
        Args: {
          seller_id: string
          limit_count?: number
        }
        Returns: {
          id: string
          title: string
          price: number
          category: string
          images: string[]
          is_sold: boolean
          view_count: number
          created_at: string
        }[]
      }
      get_trending_products: {
        Args: {
          limit_count?: number
        }
        Returns: {
          id: string
          title: string
          price: number
          category: string
          images: string[]
          seller_id: string
          seller_name: string
          seller_verified: boolean
          view_count: number
          save_count: number
        }[]
      }
      get_unread_message_count: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      get_unread_notification_count: {
        Args: {
          user_id: string
        }
        Returns: number
      }
      get_user_chats: {
        Args: {
          user_id: string
        }
        Returns: {
          id: string
          product_title: string
          product_image: string
          other_party_name: string
          other_party_id: string
          other_party_avatar: string
          other_party_verified: boolean
          last_message: string
          last_message_at: string
          is_unread: boolean
          is_buyer: boolean
        }[]
      }
      get_user_earnings: {
        Args: {
          user_id: string
        }
        Returns: {
          total_earnings: number
          this_month: number
          last_month: number
          total_sales: number
          average_price: number
          top_category: string
        }[]
      }
      get_user_notifications: {
        Args: {
          user_id: string
        }
        Returns: {
          id: string
          title: string
          body: string
          type: string
          is_read: boolean
          data: Json
          created_at: string
        }[]
      }
      get_user_orders: {
        Args: {
          user_id: string
          role: string
        }
        Returns: {
          id: string
          order_number: string
          product_title: string
          product_image: string
          total_amount: number
          status: string
          created_at: string
          other_party_name: string
          other_party_id: string
        }[]
      }
      get_user_profile: {
        Args: {
          user_id: string
        }
        Returns: {
          id: string
          name: string
          email: string
          university: string
          avatar_url: string
          is_verified: boolean
          rating: number
          total_reviews: number
          total_sales: number
          total_earnings: number
          active_listings: number
          sold_listings: number
          joined_days: number
        }[]
      }
      get_user_saved_products: {
        Args: {
          user_id: string
        }
        Returns: {
          id: string
          product_id: string
          title: string
          price: number
          category: string
          images: string[]
          seller_name: string
          seller_verified: boolean
          saved_at: string
        }[]
      }
      increment_view_count: {
        Args: {
          product_id: string
        }
        Returns: undefined
      }
      is_product_saved: {
        Args: {
          p_product_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      mark_messages_read: {
        Args: {
          p_chat_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      search_products: {
        Args: {
          search_query?: string
          category_filter?: string
          min_price?: number
          max_price?: number
          condition_filter?: string
          sort_by?: string
          limit_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          price: number
          category: string
          condition: string
          images: string[]
          specifications: Json
          seller_id: string
          is_sold: boolean
          is_featured: boolean
          view_count: number
          created_at: string
          updated_at: string
          rank: number
        }[]
      }
      submit_verification_request: {
        Args: {
          user_id: string
          student_id_image_url: string
          university: string
          student_id_number?: string
        }
        Returns: string
      }
      update_product_images: {
        Args: {
          product_id: string
          image_urls: string[]
        }
        Returns: string[]
      }
      upload_avatar_url: {
        Args: {
          user_id: string
          avatar_url: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}