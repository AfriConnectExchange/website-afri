// Firestore collection types and recommended indexes for AfriConnect Exchange

/**
 * users collection: users/{uid}
 * - Stores profile and onboarding state separate from Firebase Auth user record
 * Indexes:
 * - email (single-field)
 * - roles (single-field)
 * - onboarding_completed (single-field)
 * - Composite examples: (roles, status), (onboarding_completed, created_at)
 */
export interface UserDoc {
  auth_user_id: string; // same as document id
  email: string;
  email_verified?: boolean;
  
  // KYC Verification
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  kyc_completed?: boolean;
  kyc_submitted_at?: FirebaseFirestore.Timestamp | null;
  kyc_verified_at?: FirebaseFirestore.Timestamp | null;
  kyc_documents?: {
    id_type?: 'passport' | 'drivers_license' | 'national_id';
    id_number?: string;
    id_front_url?: string;
    id_back_url?: string;
    selfie_url?: string;
  };
  
  // Profile
  onboarding_completed?: boolean;
  profile_completed?: boolean; // Name, address, phone required
  full_name?: string | null;
  phone?: string | null;
  phone_verified?: boolean;
  address?: {
    formatted_address: string;
    latitude: number;
    longitude: number;
  } | null;
  city?: string | null;
  country?: string | null;
  postal_code?: string | null;
  profile_picture_url?: string | null;
  
  // Roles: 'buyer', 'seller', 'sme', 'admin'
  // 'seller' = basic seller (orders, reviews, payouts)
  // 'sme' = advanced seller (adds adverts, analytics) - NOT YET IMPLEMENTED
  roles?: string[];
  seller_type?: 'seller' | 'sme'; // Only set if 'seller' or 'sme' in roles
  
  // Seller specific
  business_name?: string | null;
  seller_bio?: string | null;
  
  // Payment methods (how seller ACCEPTS payments from buyers)
  payment_methods?: {
    accepts_cash?: boolean;
    accepts_card?: boolean;
    accepts_bank_transfer?: boolean;
    accepts_mobile_money?: boolean;
  };
  
  // Payout settings (how seller RECEIVES money from escrow)
  payout_method?: 'bank_transfer' | 'mobile_money' | 'paypal';
  bank_account?: {
    bank_name?: string;
    account_name?: string;
    account_number?: string;
    sort_code?: string;
  };
  mobile_money?: {
    provider?: string;
    phone_number?: string;
  };
  paypal_email?: string;
  
  // Status
  status?: 'pending' | 'active' | 'suspended' | 'deactivated' | 'deleted';
  
  // Timestamps
  created_at?: FirebaseFirestore.Timestamp | null;
  updated_at?: FirebaseFirestore.Timestamp | null;
  
  [key: string]: any;
}

/**
 * user_onboarding_progress (subcollection or top-level)
 */
export interface OnboardingProgress {
  walkthrough_completed?: boolean;
  completed_steps?: string[];
  skipped?: boolean;
  completed_at?: FirebaseFirestore.Timestamp | null;
}

/**
 * products collection
 */
export interface ProductDoc {
  id?: string;
  seller_id: string; // uid
  category_id?: string | null;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  currency?: string;
  is_active?: boolean;
  tags?: string[];
  created_at?: FirebaseFirestore.Timestamp | null;
}

/**
 * orders collection
 * Order statuses: pending → confirmed → shipped → delivered → completed
 * or: pending → cancelled
 */
export interface OrderDoc {
  id?: string;
  order_number?: string;
  
  // Parties
  buyer_id: string;
  seller_id: string;
  buyer_name?: string;
  seller_name?: string;
  
  // Order details
  items?: Array<{
    product_id: string;
    product_title: string;
    product_image?: string;
    quantity: number;
    price: number;
    listing_type: 'sale' | 'barter' | 'freebie';
  }>;
  
  // Pricing
  subtotal?: number;
  shipping_cost?: number;
  total_amount?: number;
  currency?: string;
  
  // Status tracking
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  
  // Shipping
  shipping_address?: {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    postal_code: string;
    country: string;
  };
  tracking_number?: string;
  
  // Payment
  payment_method?: 'card' | 'bank_transfer' | 'cash_on_delivery' | 'mobile_money';
  payment_status?: 'pending' | 'paid' | 'refunded' | 'failed';
  escrow_status?: 'held' | 'released' | 'refunded';
  
  // Timestamps
  created_at?: FirebaseFirestore.Timestamp | null;
  confirmed_at?: FirebaseFirestore.Timestamp | null;
  shipped_at?: FirebaseFirestore.Timestamp | null;
  delivered_at?: FirebaseFirestore.Timestamp | null;
  completed_at?: FirebaseFirestore.Timestamp | null;
  
  // Notes
  buyer_notes?: string;
  seller_notes?: string;
}

/**
 * transactions collection
 */
export interface TransactionDoc {
  id?: string;
  transaction_ref?: string;
  profile_id: string;
  order_id?: string | null;
  type?: string;
  status?: string;
  amount?: number;
  created_at?: FirebaseFirestore.Timestamp | null;
}

/**
 * reviews collection
 * Buyers can review sellers/products, sellers can reply
 */
export interface ReviewDoc {
  id?: string;
  
  // Parties
  reviewer_id: string; // buyer
  reviewer_name: string;
  reviewer_avatar?: string;
  
  seller_id: string;
  product_id?: string;
  order_id?: string;
  
  // Review content
  rating: number; // 1-5
  title?: string;
  comment: string;
  
  // Seller reply
  seller_reply?: {
    message: string;
    replied_at: FirebaseFirestore.Timestamp;
  };
  
  // Status
  is_verified_purchase?: boolean;
  is_flagged?: boolean;
  status?: 'active' | 'hidden' | 'deleted';
  
  // Timestamps
  created_at?: FirebaseFirestore.Timestamp | null;
  updated_at?: FirebaseFirestore.Timestamp | null;
}

/**
 * kyc_submissions collection
 * Separate collection for KYC verification workflow
 */
export interface KYCSubmissionDoc {
  id?: string;
  user_id: string;
  
  // Documents
  id_type: 'passport' | 'drivers_license';
  id_number: string;
  id_front_url: string;
  id_back_url?: string;
  selfie_url: string;
  proof_of_address_url?: string;
  
  // Additional info
  date_of_birth?: string;
  nationality?: string;
  
  // Review
  status: 'pending' | 'approved' | 'rejected' | 'requires_resubmission';
  reviewed_by?: string; // admin user id
  reviewed_at?: FirebaseFirestore.Timestamp | null;
  rejection_reason?: string;
  
  // Timestamps
  submitted_at: FirebaseFirestore.Timestamp;
  updated_at?: FirebaseFirestore.Timestamp | null;
}

/**
 * adverts collection (SME only)
 * Paid advertising system for SME sellers
 */
export interface AdvertDoc {
  id?: string;
  
  // Owner
  seller_id: string;
  seller_type: 'sme'; // Only SMEs can create adverts
  
  // Ad content
  title: string;
  description: string;
  image_url: string;
  cta_text?: string;
  cta_url?: string;
  
  // Targeting
  target_categories?: string[];
  target_locations?: string[];
  
  // Budget & Performance
  budget: number;
  cost_per_click?: number;
  total_impressions?: number;
  total_clicks?: number;
  total_spent?: number;
  
  // Schedule
  start_date: FirebaseFirestore.Timestamp;
  end_date?: FirebaseFirestore.Timestamp;
  
  // Status
  status: 'draft' | 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
  
  // Timestamps
  created_at: FirebaseFirestore.Timestamp;
  updated_at?: FirebaseFirestore.Timestamp | null;
}

// NOTE: Firestore index definitions depend on the exact queries used. Add composite
// indexes in the Firebase console as needed. The types here help TypeScript callers
// and make it explicit what fields we expect to store/read.
