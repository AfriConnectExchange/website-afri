// Comprehensive product and listing types for AfriConnect Exchange

export type ListingType = 'sale' | 'barter' | 'freebie';
export type ProductType = 'product' | 'service';
export type ProductStatus = 'draft' | 'active' | 'sold' | 'delisted' | 'pending_review';
export type ConditionType = 'new' | 'like_new' | 'used_good' | 'used_fair' | 'refurbished';

export interface ShippingPolicy {
  domestic_shipping_cost: number;
  international_shipping_cost: number;
  free_shipping_threshold?: number; // Free shipping if order total exceeds this
  estimated_delivery_days?: {
    domestic_min: number;
    domestic_max: number;
    international_min: number;
    international_max: number;
  };
  shipping_regions?: string[]; // Regions where seller ships
}

export interface ProductSpecifications {
  [key: string]: string | number | boolean;
  // Examples:
  // material?: string;
  // dimensions?: string;
  // weight?: string;
  // color?: string;
  // size?: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
  order: number; // For sorting images
  is_primary?: boolean;
}

export interface ProductLocation {
  city?: string;
  region?: string; // State/Province
  country: string;
  postal_code?: string;
  // Future: lat/long when user profile has it
  latitude?: number;
  longitude?: number;
}

export interface BarterPreferences {
  looking_for?: string[]; // Categories or items they want in exchange
  notes?: string;
}

export interface Product {
  // Identity
  id: string;
  seller_id: string;
  
  // Basic Information
  title: string;
  description: string;
  product_type: ProductType; // 'product' or 'service'
  
  // Category & Classification
  category_id: string;
  tags: string[];
  
  // Listing Type & Pricing
  listing_type: ListingType; // 'sale', 'barter', or 'freebie'
  price: number; // 0 for freebie
  currency: string; // 'GBP', 'USD', etc.
  barter_preferences?: BarterPreferences; // Only if listing_type is 'barter'
  
  // Inventory & Condition
  quantity_available: number;
  sku?: string; // Stock Keeping Unit (optional)
  condition?: ConditionType;
  
  // Media
  images: ProductImage[];
  video_url?: string; // Optional product video
  
  // Specifications & Details
  specifications?: ProductSpecifications;
  
  // Location
  location: ProductLocation;
  location_text: string; // Display string like "London, UK"
  
  // Shipping (only for physical products)
  shipping_policy?: ShippingPolicy;
  is_local_pickup_only?: boolean;
  
  // Status & Moderation
  status: ProductStatus;
  rejection_reason?: string; // If status is rejected
  
  // Seller Information (denormalized for quick access)
  seller_name?: string;
  seller_avatar?: string;
  seller_verified?: boolean;
  
  // Engagement
  view_count: number;
  favorite_count: number;
  
  // Reviews & Ratings
  average_rating?: number;
  review_count: number;
  
  // Timestamps
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  published_at?: string; // When it went from draft to active
  sold_at?: string; // When it was marked as sold
  
  // SEO & Search
  slug?: string; // URL-friendly version of title
  search_keywords?: string[]; // Generated from title, description, tags
}

// Form data types for creating/editing products
export interface CreateProductFormData {
  // Step 1: Basic Info
  title: string;
  description: string;
  product_type: ProductType;
  category_id: string;
  tags: string[];
  
  // Step 2: Pricing & Listing Type
  listing_type: ListingType;
  price: number;
  currency: string;
  barter_preferences?: BarterPreferences;
  
  // Step 3: Inventory & Details
  quantity_available: number;
  sku?: string;
  condition?: ConditionType;
  specifications?: ProductSpecifications;
  
  // Step 4: Images & Media
  images: File[] | ProductImage[]; // Files when uploading, URLs when editing
  video_url?: string;
  
  // Step 5: Shipping & Location
  location: ProductLocation;
  shipping_policy?: ShippingPolicy;
  is_local_pickup_only?: boolean;
  
  // Status
  status: 'draft' | 'active'; // User can save as draft or publish
}

// Category type
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  product_count: number;
  is_active: boolean;
  parent_category_id?: string; // For subcategories in the future
  created_at: any; // Firestore Timestamp
  updated_at: any;
}
