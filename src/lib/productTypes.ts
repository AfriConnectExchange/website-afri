// Comprehensive product and listing types for AfriConnect Exchange

export type ListingType = 'sale' | 'barter' | 'freebie';
export type ProductType = 'product' | 'service';
export type ProductStatus = 'draft' | 'active' | 'sold' | 'delisted' | 'pending_review';
export type ConditionType = 'new' | 'like_new' | 'used_good' | 'used_fair' | 'refurbished';

export interface ShippingOption {
  id: string;
  method_name: string;        // "Royal Mail 1st Class", "DPD Next Day", "Local Pickup"
  type: 'standard' | 'express' | 'pickup' | 'international';
  price: number;              // In pence (100 = £1.00)
  estimated_days_min?: number;
  estimated_days_max?: number;
  regions?: string[];         // ['UK', 'EU', 'Worldwide'] or specific UK regions
}

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

// Category-specific specification types
export interface ElectronicsSpecifications {
  brand?: string;
  model?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  screen_size?: string;
  battery_life?: string;
  color?: string;
  warranty?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface FashionSpecifications {
  brand?: string;
  size?: string;
  color?: string;
  material?: string;
  style?: string;
  season?: string;
  gender?: 'male' | 'female' | 'unisex';
  [key: string]: string | number | boolean | undefined;
}

export interface VehicleSpecifications {
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  fuel_type?: string;
  transmission?: string;
  engine_size?: string;
  body_type?: string;
  color?: string;
  doors?: number;
  seats?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface HomeGardenSpecifications {
  material?: string;
  dimensions?: string;
  weight?: string;
  color?: string;
  room?: string;
  style?: string;
  [key: string]: string | number | boolean | undefined;
}

// Generic specification type (fallback for any category)
export interface ProductSpecifications {
  [key: string]: string | number | boolean;
}

export interface ProductImage {
  url: string;
  alt?: string;
  order: number; // For sorting images
  is_primary?: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  option_values: Record<string, string>;
  price: number; // In pence
  quantity: number;
  sku?: string;
  is_primary?: boolean;
}

export interface ProductLocation {
  address?: string;            // Full street address
  city?: string;
  region?: string;             // State/Province
  country: string;
  postal_code?: string;
  // Coordinates for distance calculation
  coordinates?: {
    lat: number;               // Latitude (-90 to 90)
    lng: number;               // Longitude (-180 to 180)
  };
  // Delivery options
  delivery_radius_km?: number; // Max delivery distance (0-50km)
  pickup_available?: boolean;  // Allow local pickup
  // Legacy support
  latitude?: number;
  longitude?: number;
}

export interface BarterPreferences {
  looking_for?: string[]; // Categories or items they want in exchange
  notes?: string;
}

export interface Product {
  // Identity & Relations
  id: string;
  seller_id: string;          // REFERENCE - fetch seller from users/{seller_id}
  
  // Basic Information
  title: string;
  description: string;
  product_type: ProductType; // 'product' or 'service'
  
  // Category & Classification
  category_id: string;        // REFERENCE - fetch category from categories/{category_id}
  tags: string[];
  
  // Listing Type & Pricing
  listing_type: ListingType; // 'sale', 'barter', or 'freebie'
  price: number; // In pence (100 = £1.00), 0 for freebie
  currency: string; // 'GBP'
  original_price?: number; // For discount display
  discount?: number; // Percentage
  
  // Barter System
  accepts_barter?: boolean;
  barter_preferences?: BarterPreferences; // Only if accepts_barter is true
  
  // Inventory & Condition
  quantity_available: number;
  sku?: string; // Stock Keeping Unit (optional)
  condition?: ConditionType;
  
  // Media
  images: ProductImage[];
  video_url?: string; // Optional product video
  
  // Specifications & Details (flexible based on category)
  specifications?: ProductSpecifications | ElectronicsSpecifications | FashionSpecifications | VehicleSpecifications | HomeGardenSpecifications;
  options?: ProductOption[];
  variants?: ProductVariant[];
  
  // Location
  location: ProductLocation;
  location_text: string; // Display string like "London, UK"
  
  // Shipping (UK-focused with proper options)
  shipping_options?: ShippingOption[];
  free_shipping_threshold?: number; // In pence
  is_local_pickup_only?: boolean;
  shipping_policy?: ShippingPolicy; // Legacy support
  
  // Status & Moderation
  status: ProductStatus;
  featured?: boolean;
  rejection_reason?: string; // If status is rejected
  
  // Engagement
  view_count: number;
  favorite_count: number;
  click_count?: number;
  
  // Reviews & Ratings (aggregated from reviews collection)
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
  
  // MAPPED FIELDS (added by API for UI compatibility - NOT in database)
  name?: string; // Mapped from title
  seller?: string; // Mapped from seller user doc
  sellerVerified?: boolean; // Mapped from seller user doc
  image?: string; // First image URL extracted
  sellerDetails?: {
    id: string;
    name: string;
    avatar: string;
    location: string;
    verified: boolean;
    rating: number;
    totalSales: number;
    memberSince: string;
  };
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
  price: number; // In pence
  currency: string; // 'GBP'
  original_price?: number; // For discount display
  accepts_barter?: boolean;
  barter_preferences?: BarterPreferences;
  
  // Step 3: Inventory & Details
  quantity_available: number;
  sku?: string;
  condition?: ConditionType;
  specifications?: ProductSpecifications | ElectronicsSpecifications | FashionSpecifications | VehicleSpecifications | HomeGardenSpecifications;
  options?: ProductOption[];
  variants?: ProductVariant[];
  
  // Step 4: Images & Media
  images: File[] | ProductImage[]; // Files when uploading, URLs when editing
  video_url?: string;
  
  // Step 5: Shipping & Location
  location: ProductLocation;
  shipping_options?: ShippingOption[]; // Proper UK shipping options
  free_shipping_threshold?: number;
  is_local_pickup_only?: boolean;
  shipping_policy?: ShippingPolicy; // Legacy support
  
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
