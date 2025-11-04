// Central app-level types to keep a stable shape across the app
export interface UserProfile {
  id: string;
  email?: string | null;
  phone?: string | null;
  full_name?: string | null;
  profile_picture_url?: string | null;
  roles?: string[];
  status?: 'pending' | 'active' | 'suspended' | 'deactivated' | 'deleted';
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  onboarding_completed?: boolean;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  [key: string]: any;
}

// AppUser is the shape the UI components expect. Keep it fairly permissive so
// migration can be incremental.
export interface AppUser {
  id: string;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  roles?: string[];
  onboarding_completed?: boolean;
  // include any profile fields commonly used by components
  [key: string]: any;
}

// A small mock user export that some components referenced previously
export const MockUser: AppUser = {
  id: 'mock-user',
  email: 'mock@example.com',
  fullName: 'Mock User',
  avatarUrl: '',
  roles: ['buyer'],
};
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          full_name: string | null
          profile_picture_url: string | null
          bio: string | null
          address: string | null
          city: string | null
          country: string | null
          postcode: string | null
          roles: string[] | null
          status: 'pending' | 'active' | 'suspended' | 'deactivated' | 'deleted'
          verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
          email_verified: boolean
          phone_verified: boolean
          created_at: string
          updated_at: string | null
          auth_user_id: string
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          full_name?: string | null
          profile_picture_url?: string | null
          bio?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          postcode?: string | null
          roles?: string[] | null
          status?: 'pending' | 'active' | 'suspended' | 'deactivated' | 'deleted'
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          email_verified?: boolean
          phone_verified?: boolean
          created_at?: string
          updated_at?: string | null
          auth_user_id: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          full_name?: string | null
          profile_picture_url?: string | null
          bio?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          postcode?: string | null
          roles?: string[] | null
          status?: 'pending' | 'active' | 'suspended' | 'deactivated' | 'deleted'
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          email_verified?: boolean
          phone_verified?: boolean
          created_at?: string
          updated_at?: string | null
          auth_user_id?: string
        }
      }
      products: {
        Row: {
          id: string
          seller_id: string
          category_id: string | null
          title: string
          description: string
          price: number | null
          is_free: boolean
          currency: string
          quantity_available: number
          condition: string | null
          images: Json | null
          tags: string[] | null
          location: string | null
          is_active: boolean
          average_rating: number
          review_count: number
          created_at: string
          updated_at: string | null
          specifications: Json | null
          shipping_policy: Json | null
        }
        Insert: {
          id?: string
          seller_id: string
          category_id?: string | null
          title: string
          description: string
          price?: number | null
          is_free?: boolean
          currency?: string
          quantity_available?: number
          condition?: string | null
          images?: Json | null
          tags?: string[] | null
          location?: string | null
          is_active?: boolean
          average_rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          seller_id?: string
          category_id?: string | null
          title?: string
          description?: string
          price?: number | null
          is_free?: boolean
          currency?: string
          quantity_available?: number
          condition?: string | null
          images?: Json | null
          tags?: string[] | null
          location?: string | null
          is_active?: boolean
          average_rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          parent_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          parent_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
            id: string;
            buyer_id: string;
            created_at: string;
            status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "failed";
            total_amount: number;
            shipping_address: Json | null;
            actual_delivery_date: string | null;
            courier_name: string | null;
            tracking_number: string | null;
            payment_method: string | null;
        };
        Insert: {
            id?: string;
            buyer_id: string;
            created_at?: string;
            status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "failed";
            total_amount: number;
            shipping_address?: Json | null;
        };
        Update: {
            id?: string;
            status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "failed";
            actual_delivery_date?: string | null;
            courier_name?: string | null;
            tracking_number?: string | null;
        };
      };
      order_items: {
            Row: {
                id: string;
                order_id: string;
                product_id: string;
                quantity: number;
                price_at_purchase: number;
                seller_id: string;
            };
            Insert: {
                id?: string;
                order_id: string;
                product_id: string;
                quantity: number;
                price_at_purchase: number;
                seller_id: string;
            };
      };
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          reviewee_id: string
          order_id: string
          product_id: string
          rating: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          reviewee_id: string
          order_id: string
          product_id: string
          rating: number
          comment: string
        }
      },
      transactions: {
        Row: {
            id: string;
            profile_id: string;
            order_id: string | null;
            type: string;
            status: string;
            amount: number;
            provider: string | null;
            description: string | null;
            metadata: Json | null;
            created_at: string;
        };
        Insert: {
            profile_id: string;
            order_id?: string | null;
            type: string;
            status: string;
            amount: number;
            provider?: string | null;
            description?: string | null;
            metadata?: Json | null;
        };
       };
       user_onboarding_progress: {
        Row: {
          id: string
          user_id: string
          walkthrough_completed: boolean
        }
       },
       activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          changes: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        },
        Insert: {
          user_id: string
          action: string
          entity_type?: string
          entity_id?: string
          changes?: Json
          ip_address?: string | null
          user_agent?: string | null
        }
       },
       notifications: {
         Row: {
            id: string;
            user_id: string;
            type: "order" | "delivery" | "promotion" | "system" | "barter" | "payment";
            title: string;
            message: string;
            link_url: string | null;
            read: boolean;
            created_at: string;
            priority: 'high' | 'medium' | 'low';
         };
         Insert: {
            user_id: string;
            type: "order" | "delivery" | "promotion" | "system" | "barter" | "payment";
            title: string;
            message: string;
            link_url?: string | null;
            priority?: 'high' | 'medium' | 'low';
         };
         Update: {
            read?: boolean;
         };
       }
       barter_proposals: {
         Row: {
            id: string;
            proposer_id: string;
            recipient_id: string;
            proposer_product_id: string;
            recipient_product_id: string;
            notes: string | null;
            status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
            created_at: string;
         };
         Insert: {
            proposer_id: string;
            recipient_id: string;
            proposer_product_id: string;
            recipient_product_id: string;
            notes?: string | null;
            status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
         };
         Update: {
            status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
         };
       };
       escrow_transactions: {
          Row: {
            id: string;
            order_id: string;
            amount: number;
            status: 'funded' | 'released' | 'refunded' | 'disputed';
            created_at: string;
            updated_at: string;
          };
          Insert: {
            order_id: string;
            amount: number;
            status?: 'funded' | 'released' | 'refunded' | 'disputed';
          };
          Update: {
            status?: 'funded' | 'released' | 'refunded' | 'disputed';
            updated_at?: string;
          };
       }
    }
  }
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  parent_id?: string | null;
  children?: Category[];
  image?: string | null; // Legacy field - deprecated
  image_url?: string | null; // Firebase Storage URL - preferred
  is_active?: boolean;
  order?: number;
  count?: number; // Product count (optional, computed)
  created_at?: any;
  updated_at?: any;
}
