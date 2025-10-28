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
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  onboarding_completed?: boolean;
  full_name?: string | null;
  phone?: string | null;
  address?: string | null;
  roles?: string[];
  status?: 'pending' | 'active' | 'suspended' | 'deactivated' | 'deleted';
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
 */
export interface OrderDoc {
  id?: string;
  order_number?: string;
  buyer_id: string;
  seller_id: string;
  status?: string;
  total_amount?: number;
  created_at?: FirebaseFirestore.Timestamp | null;
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

// NOTE: Firestore index definitions depend on the exact queries used. Add composite
// indexes in the Firebase console as needed. The types here help TypeScript callers
// and make it explicit what fields we expect to store/read.
