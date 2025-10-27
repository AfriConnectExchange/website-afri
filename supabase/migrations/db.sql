-- ============================================================================
-- AfriConnect Exchange - Clean Supabase Database Schema
-- Version: 2.0 (Simplified)
-- ============================================================================
-- 
-- WHAT SUPABASE HANDLES (DON'T DUPLICATE):
-- - User authentication (email, phone, password, OAuth)
-- - Session management (tokens, refresh, expiry)
-- - Email/phone verification
-- - Password reset flows
-- - Rate limiting on auth endpoints
-- 
-- WHAT THIS SCHEMA HANDLES:
-- - User profiles and business data
-- - Marketplace (products, services, orders)
-- - Payments and transactions
-- - Reviews and ratings
-- - Support system
-- - Analytics
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'sme', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deleted');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'wallet', 'paypal', 'escrow');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE transaction_type AS ENUM ('purchase', 'barter', 'escrow', 'refund');
CREATE TYPE escrow_status AS ENUM ('held', 'released', 'disputed', 'refunded');
CREATE TYPE barter_status AS ENUM ('proposed', 'counter_offered', 'accepted', 'rejected', 'cancelled', 'completed');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'disputed');
CREATE TYPE notification_type AS ENUM ('order', 'delivery', 'promotional', 'system', 'security');
CREATE TYPE advert_status AS ENUM ('draft', 'active', 'expired', 'deleted');
CREATE TYPE dispute_status AS ENUM ('open', 'investigating', 'resolved', 'closed');
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- ============================================================================
-- CORE TABLES - User Management
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255),
    profile_picture_url TEXT,
    bio TEXT,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'United Kingdom',
    postcode VARCHAR(20),
    roles user_role[] DEFAULT ARRAY['buyer']::user_role[],
    status user_status DEFAULT 'pending',
    verification_status verification_status DEFAULT 'unverified',
    free_access_expires_at TIMESTAMP WITH TIME ZONE,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Europe/London',
    
    -- KYC fields (only set when user submits verification)
    kyc_documents JSONB,
    kyc_submitted_at TIMESTAMP WITH TIME ZONE,
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth. Auth handles passwords/sessions.';
COMMENT ON COLUMN users.id IS 'References auth.users(id) - managed by Supabase Auth';

-- User preferences (separated for clarity)
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    privacy_settings JSONB DEFAULT '{}'::jsonb,
    display_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Marketplace - Categories
-- ============================================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    icon_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- ============================================================================
-- Marketplace - Products
-- ============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Basic info
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    
    -- Pricing
    price DECIMAL(10, 2),
    is_free BOOLEAN DEFAULT FALSE,
    currency VARCHAR(3) DEFAULT 'GBP',
    
    -- Inventory
    quantity_available INTEGER DEFAULT 1,
    condition VARCHAR(50), -- new, used, refurbished
    
    -- Media & metadata
    images JSONB DEFAULT '[]'::jsonb, -- [{url: string, alt: string}]
    tags TEXT[],
    
    -- Location (optional for local pickup)
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Status & stats
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- Search
    search_vector tsvector,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- ============================================================================
-- Marketplace - Services
-- ============================================================================

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Basic info
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    
    -- Pricing (services can have ranges)
    price_from DECIMAL(10, 2),
    price_to DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'GBP',
    pricing_model VARCHAR(50), -- hourly, fixed, per_day
    duration_minutes INTEGER,
    
    -- Media & metadata
    images JSONB DEFAULT '[]'::jsonb,
    tags TEXT[],
    
    -- Location
    location VARCHAR(255),
    is_remote BOOLEAN DEFAULT FALSE,
    
    -- Status & stats
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- Search
    search_vector tsvector,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_search_vector ON services USING GIN(search_vector);

-- ============================================================================
-- Payments & Transactions
-- ============================================================================

CREATE SEQUENCE transaction_ref_seq START 1;

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_ref VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    type transaction_type NOT NULL,
    payment_method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    
    -- Amounts
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    fee DECIMAL(10, 2) DEFAULT 0.00,
    net_amount DECIMAL(10, 2),
    
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Payment provider info
    payment_provider VARCHAR(50), -- stripe, paystack, flutterwave
    provider_transaction_id VARCHAR(255),
    provider_response JSONB,
    
    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ============================================================================
-- Escrow System (Buyer Protection)
-- ============================================================================

CREATE TABLE escrow_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_id UUID, -- Will reference orders.id (FK added after orders table)
    
    amount DECIMAL(10, 2) NOT NULL,
    status escrow_status DEFAULT 'held',
    
    held_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auto_release_at TIMESTAMP WITH TIME ZONE, -- Auto-release after X days
    released_at TIMESTAMP WITH TIME ZONE,
    
    -- Dispute handling
    disputed_at TIMESTAMP WITH TIME ZONE,
    dispute_reason TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_escrow_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_seller_id ON escrow_transactions(seller_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);

-- ============================================================================
-- Barter System (Cashless Exchange)
-- ============================================================================

CREATE TABLE barter_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- What proposer offers
    offered_item_type VARCHAR(20) NOT NULL, -- 'product' or 'service'
    offered_item_id UUID NOT NULL,
    
    -- What proposer wants
    requested_item_type VARCHAR(20) NOT NULL, -- 'product' or 'service'
    requested_item_id UUID NOT NULL,
    
    offer_description TEXT,
    status barter_status DEFAULT 'proposed',
    
    -- Counter offers
    counter_offer_description TEXT,
    
    -- Lifecycle
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_barter_proposer ON barter_proposals(proposer_id);
CREATE INDEX idx_barter_recipient ON barter_proposals(recipient_id);
CREATE INDEX idx_barter_status ON barter_proposals(status);

-- ============================================================================
-- Orders
-- ============================================================================

CREATE SEQUENCE order_number_seq START 1;

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    
    -- What was ordered
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    
    status order_status DEFAULT 'pending',
    
    -- Pricing
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    
    -- Delivery info
    delivery_address TEXT,
    delivery_notes TEXT,
    tracking_number VARCHAR(255),
    courier_name VARCHAR(100),
    
    -- Timestamps
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Add FK to escrow_transactions now that orders exists
ALTER TABLE escrow_transactions 
ADD CONSTRAINT fk_escrow_order 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- ============================================================================
-- Delivery Tracking
-- ============================================================================

CREATE TABLE delivery_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tracking_number VARCHAR(255) NOT NULL,
    courier_name VARCHAR(100) NOT NULL,
    current_status VARCHAR(100) NOT NULL,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    tracking_history JSONB DEFAULT '[]'::jsonb,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_delivery_order ON delivery_tracking(order_id);

-- ============================================================================
-- Adverts (SME Promotion)
-- ============================================================================

CREATE TABLE adverts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    images JSONB DEFAULT '[]'::jsonb,
    target_url TEXT,
    
    -- Campaign duration
    duration_days INTEGER DEFAULT 30,
    status advert_status DEFAULT 'draft',
    
    -- Analytics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,
    
    -- Lifecycle
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_adverts_sme ON adverts(sme_id);
CREATE INDEX idx_adverts_status ON adverts(status);
CREATE INDEX idx_adverts_dates ON adverts(start_date, end_date);

-- ============================================================================
-- Notifications
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb, -- Additional context (order_id, etc.)
    
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- Reviews & Ratings
-- ============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- What's being reviewed
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    status review_status DEFAULT 'pending',
    
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    
    -- Community feedback
    helpful_count INTEGER DEFAULT 0,
    unhelpful_count INTEGER DEFAULT 0,
    flagged_count INTEGER DEFAULT 0,
    
    -- Seller response
    seller_response TEXT,
    seller_responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Moderation
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_service ON reviews(service_id);
CREATE INDEX idx_reviews_status ON reviews(status);

-- ============================================================================
-- Disputes
-- ============================================================================

CREATE SEQUENCE dispute_ref_seq START 1;

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_ref VARCHAR(50) UNIQUE NOT NULL,
    
    -- Related entities
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    escrow_id UUID REFERENCES escrow_transactions(id) ON DELETE SET NULL,
    barter_id UUID REFERENCES barter_proposals(id) ON DELETE SET NULL,
    
    complainant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    respondent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    status dispute_status DEFAULT 'open',
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '[]'::jsonb, -- [{type: 'image'|'document', url: string}]
    
    -- Admin handling
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_disputes_complainant ON disputes(complainant_id);
CREATE INDEX idx_disputes_respondent ON disputes(respondent_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_assigned ON disputes(assigned_to);

-- ============================================================================
-- Support System
-- ============================================================================

CREATE SEQUENCE ticket_number_seq START 1;

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    category VARCHAR(50) NOT NULL, -- 'payment', 'order', 'account', 'technical', 'other'
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    status support_ticket_status DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    
    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Resolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    resolution TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_assigned ON support_tickets(assigned_to);

CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_internal BOOLEAN DEFAULT FALSE, -- Admin notes
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);

-- ============================================================================
-- KYC Submissions
-- ============================================================================

CREATE TABLE kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    document_type VARCHAR(50) NOT NULL, -- 'passport', 'drivers_license', 'national_id'
    document_number VARCHAR(100),
    document_url TEXT,
    proof_of_address_url TEXT,
    selfie_url TEXT,
    
    status verification_status DEFAULT 'pending',
    
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    verification_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kyc_user ON kyc_submissions(user_id);
CREATE INDEX idx_kyc_status ON kyc_submissions(status);

-- ============================================================================
-- Admin & Moderation
-- ============================================================================

CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    action_type VARCHAR(100) NOT NULL, -- 'suspend_user', 'approve_product', 'delete_review'
    target_type VARCHAR(50) NOT NULL, -- 'user', 'product', 'review'
    target_id UUID NOT NULL,
    
    reason TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at);

CREATE TABLE moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    content_type VARCHAR(50) NOT NULL, -- 'product', 'service', 'review', 'user'
    content_id UUID NOT NULL,
    
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(255) NOT NULL,
    details TEXT,
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, reviewing, resolved, dismissed
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    action_taken VARCHAR(100), -- 'approved', 'removed', 'edited', 'no_action'
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_moderation_status ON moderation_queue(status);
CREATE INDEX idx_moderation_content ON moderation_queue(content_type, content_id);

-- ============================================================================
-- Analytics (Simple Event Tracking)
-- ============================================================================

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    event_type VARCHAR(100) NOT NULL, -- 'page_view', 'product_view', 'search', 'purchase'
    event_name VARCHAR(255) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    
    page_url TEXT,
    referrer_url TEXT,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);

-- ============================================================================
-- Help & Onboarding
-- ============================================================================

CREATE TABLE help_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    category VARCHAR(100) NOT NULL, -- 'getting_started', 'payments', 'selling'
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    unhelpful_count INTEGER DEFAULT 0,
    
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_help_category ON help_articles(category);
CREATE INDEX idx_help_slug ON help_articles(slug);

CREATE TABLE user_onboarding_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    walkthrough_completed BOOLEAN DEFAULT FALSE,
    completed_steps JSONB DEFAULT '[]'::jsonb, -- ['profile_setup', 'first_listing', ...]
    skipped BOOLEAN DEFAULT FALSE,
    
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ESSENTIAL FUNCTIONS (Only What We Need)
-- ============================================================================

-- 1. Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Calculate transaction net amount
CREATE OR REPLACE FUNCTION calculate_net_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.net_amount = NEW.amount - COALESCE(NEW.fee, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update product search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Update service search vector
CREATE OR REPLACE FUNCTION update_service_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Update product ratings
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.product_id IS NOT NULL AND NEW.status = 'approved' THEN
        UPDATE products
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM reviews
                WHERE product_id = NEW.product_id AND status = 'approved'
            ),
            review_count = (
                SELECT COUNT(*)
                FROM reviews
                WHERE product_id = NEW.product_id AND status = 'approved'
            )
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Update service ratings
CREATE OR REPLACE FUNCTION update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.service_id IS NOT NULL AND NEW.status = 'approved' THEN
        UPDATE services
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM reviews
                WHERE service_id = NEW.service_id AND status = 'approved'
            ),
            review_count = (
                SELECT COUNT(*)
                FROM reviews
                WHERE service_id = NEW.service_id AND status = 'approved'
            )
        WHERE id = NEW.service_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Auto-generate reference numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_transaction_ref()
RETURNS TRIGGER AS $$
BEGIN
    NEW.transaction_ref := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('transaction_ref_seq')::TEXT, 8, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('ticket_number_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_dispute_ref()
RETURNS TRIGGER AS $$
BEGIN
    NEW.dispute_ref := 'DSP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('dispute_ref_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Set free access period (3 months for new users)
CREATE OR REPLACE FUNCTION set_free_access_period()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' AND NEW.free_access_expires_at IS NULL THEN
        NEW.free_access_expires_at := NOW() + INTERVAL '3 months';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Auto-expire adverts
CREATE OR REPLACE FUNCTION auto_expire_adverts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' AND NEW.end_date IS NOT NULL AND NEW.end_date < NOW() THEN
        NEW.status := 'expired';
        NEW.expired_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS (Only Essential Ones)
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER trg_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_services_updated_at 
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at 
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_transactions_updated_at 
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_reviews_updated_at 
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_adverts_updated_at 
    BEFORE UPDATE ON adverts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_disputes_updated_at 
    BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tickets_updated_at 
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Search vector updates
CREATE TRIGGER trg_products_search_vector 
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

CREATE TRIGGER trg_services_search_vector 
    BEFORE INSERT OR UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_service_search_vector();

-- Rating updates
CREATE TRIGGER trg_update_product_rating 
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER trg_update_service_rating 
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_service_rating();

-- Auto-generate reference numbers
CREATE TRIGGER trg_generate_order_number 
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

CREATE TRIGGER trg_generate_transaction_ref 
    BEFORE INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION generate_transaction_ref();

CREATE TRIGGER trg_generate_ticket_number 
    BEFORE INSERT ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

CREATE TRIGGER trg_generate_dispute_ref 
    BEFORE INSERT ON disputes
    FOR EACH ROW EXECUTE FUNCTION generate_dispute_ref();

-- Business logic triggers
CREATE TRIGGER trg_calculate_net_amount 
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION calculate_net_amount();

CREATE TRIGGER trg_set_free_access_period 
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_free_access_period();

CREATE TRIGGER trg_auto_expire_adverts 
    BEFORE UPDATE ON adverts
    FOR EACH ROW EXECUTE FUNCTION auto_expire_adverts();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE barter_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE adverts ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Sellers can insert own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products" ON products
    FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products" ON products
    FOR DELETE USING (auth.uid() = seller_id);

-- Services policies
CREATE POLICY "Anyone can view active services" ON services
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Providers can insert own services" ON services
    FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own services" ON services
    FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own services" ON services
    FOR DELETE USING (auth.uid() = provider_id);

-- Orders policies
CREATE POLICY "Users can view their orders" ON orders
    FOR SELECT USING (
        auth.uid() = buyer_id OR auth.uid() = seller_id
    );

CREATE POLICY "Buyers can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Involved users can update orders" ON orders
    FOR UPDATE USING (
        auth.uid() = buyer_id OR auth.uid() = seller_id
    );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Escrow policies
CREATE POLICY "Involved users can view escrow" ON escrow_transactions
    FOR SELECT USING (
        auth.uid() = buyer_id OR auth.uid() = seller_id
    );

-- Barter policies
CREATE POLICY "Involved users can view barter proposals" ON barter_proposals
    FOR SELECT USING (
        auth.uid() = proposer_id OR auth.uid() = recipient_id
    );

CREATE POLICY "Users can create barter proposals" ON barter_proposals
    FOR INSERT WITH CHECK (auth.uid() = proposer_id);

CREATE POLICY "Involved users can update barter proposals" ON barter_proposals
    FOR UPDATE USING (
        auth.uid() = proposer_id OR auth.uid() = recipient_id
    );

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews" ON reviews
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "Users can view own tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets" ON support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Ticket messages policies
CREATE POLICY "Users can view messages for their tickets" ON ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = ticket_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages for their tickets" ON ticket_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- KYC submissions policies
CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own KYC submissions" ON kyc_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Disputes policies
CREATE POLICY "Involved users can view disputes" ON disputes
    FOR SELECT USING (
        auth.uid() = complainant_id OR auth.uid() = respondent_id
    );

CREATE POLICY "Users can create disputes" ON disputes
    FOR INSERT WITH CHECK (auth.uid() = complainant_id);

-- Adverts policies
CREATE POLICY "Anyone can view active adverts" ON adverts
    FOR SELECT USING (status = 'active');

CREATE POLICY "SMEs can manage own adverts" ON adverts
    FOR ALL USING (auth.uid() = sme_id);

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- Active products with seller info
CREATE OR REPLACE VIEW v_active_products AS
SELECT 
    p.*,
    u.full_name as seller_name,
    u.profile_picture_url as seller_avatar,
    u.verification_status as seller_verification,
    c.name as category_name,
    c.slug as category_slug
FROM products p
JOIN users u ON p.seller_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = TRUE
AND u.status = 'active';

-- Active services with provider info
CREATE OR REPLACE VIEW v_active_services AS
SELECT 
    s.*,
    u.full_name as provider_name,
    u.profile_picture_url as provider_avatar,
    u.verification_status as provider_verification,
    c.name as category_name,
    c.slug as category_slug
FROM services s
JOIN users u ON s.provider_id = u.id
LEFT JOIN categories c ON s.category_id = c.id
WHERE s.is_active = TRUE
AND u.status = 'active';

-- User dashboard stats
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT CASE WHEN o.buyer_id = u.id THEN o.id END) as total_purchases,
    COUNT(DISTINCT CASE WHEN o.seller_id = u.id THEN o.id END) as total_sales,
    COALESCE(SUM(CASE WHEN o.buyer_id = u.id AND o.status = 'delivered' THEN o.total_amount ELSE 0 END), 0) as total_spent,
    COALESCE(SUM(CASE WHEN o.seller_id = u.id AND o.status = 'delivered' THEN o.total_amount ELSE 0 END), 0) as total_earned,
    COUNT(DISTINCT CASE WHEN r.reviewer_id = u.id THEN r.id END) as reviews_given,
    COUNT(DISTINCT CASE WHEN r.reviewee_id = u.id AND r.status = 'approved' THEN r.id END) as reviews_received,
    COALESCE(AVG(CASE WHEN r.reviewee_id = u.id AND r.status = 'approved' THEN r.rating END), 0) as average_rating
FROM users u
LEFT JOIN orders o ON u.id = o.buyer_id OR u.id = o.seller_id
LEFT JOIN reviews r ON u.id = r.reviewer_id OR u.id = r.reviewee_id
GROUP BY u.id;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default categories
INSERT INTO categories (name, slug, description, display_order) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories', 1),
('Fashion & Beauty', 'fashion-beauty', 'Clothing, shoes, and beauty products', 2),
('Home & Garden', 'home-garden', 'Home decor and gardening supplies', 3),
('Food & Beverages', 'food-beverages', 'African food products and beverages', 4),
('Professional Services', 'professional-services', 'Business and professional services', 5),
('Personal Services', 'personal-services', 'Personal care and lifestyle services', 6),
('Arts & Crafts', 'arts-crafts', 'Handmade and artistic items', 7),
('Health & Wellness', 'health-wellness', 'Health products and wellness services', 8),
('Automotive', 'automotive', 'Vehicles, parts, and accessories', 9),
('Sports & Fitness', 'sports-fitness', 'Sports equipment and fitness gear', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- MAINTENANCE & UTILITIES
-- ============================================================================

-- Function to archive old analytics (run monthly)
CREATE OR REPLACE FUNCTION archive_old_analytics()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Archive analytics older than 90 days
    DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get marketplace statistics
CREATE OR REPLACE FUNCTION get_marketplace_stats()
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    total_products BIGINT,
    active_products BIGINT,
    total_orders BIGINT,
    total_revenue NUMERIC,
    pending_disputes BIGINT,
    open_tickets BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as active_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered') as total_revenue,
        (SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'investigating')) as pending_disputes,
    (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress')) as open_tickets;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON DATABASE postgres IS 'AfriConnect Exchange - Simplified marketplace platform';

COMMENT ON TABLE users IS 'User profiles (auth handled by Supabase Auth)';
COMMENT ON TABLE products IS 'Marketplace product listings';
COMMENT ON TABLE services IS 'Service offerings from providers';
COMMENT ON TABLE transactions IS 'All financial transactions';
COMMENT ON TABLE escrow_transactions IS 'Escrow-held payments for buyer protection';
COMMENT ON TABLE barter_proposals IS 'Cashless exchange proposals';
COMMENT ON TABLE orders IS 'Purchase orders linking buyers and sellers';
COMMENT ON TABLE reviews IS 'User reviews for products/services/sellers';
COMMENT ON TABLE notifications IS 'In-app notifications';
COMMENT ON TABLE support_tickets IS 'Customer support system';
COMMENT ON TABLE disputes IS 'Dispute resolution system';
COMMENT ON TABLE adverts IS 'SME promotional adverts';
COMMENT ON TABLE analytics_events IS 'Simple event tracking for analytics';

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- 
-- What's REMOVED from original:
-- ❌ user_sessions table (Supabase Auth handles this)
-- ❌ social_auth table (Supabase Auth handles OAuth)
-- ❌ password_hash column (Supabase Auth handles credentials)
-- ❌ email_verified/phone_verified (Supabase Auth handles verification)
-- ❌ login stats tracking (Supabase Auth provides this)
-- ❌ Universal activity_logs triggers (too complex, caused silent failures)
-- ❌ LMS tables (courses, enrollments, modules, lessons)
-- ❌ Remittance tables and features
-- ❌ Chatbot conversation tables
-- ❌ email_logs table (use external service like SendGrid/Resend)
-- ❌ system_logs table (use Supabase logs or external logging)
-- ❌ device_info table (Supabase Auth tracks this)
-- ❌ security_logs table (Supabase provides security monitoring)
-- 
-- What's KEPT and simplified:
-- ✅ Core marketplace (products, services, categories)
-- ✅ Orders and transactions
-- ✅ Escrow and barter systems
-- ✅ Reviews and ratings
-- ✅ Support tickets
-- ✅ Disputes
-- ✅ KYC submissions
-- ✅ Notifications
-- ✅ Adverts for SMEs
-- ✅ Basic analytics events
-- ✅ Only essential triggers (timestamps, search, ratings, auto-refs)
-- ✅ Clean RLS policies
-- ✅ Helpful views for common queries
-- 
-- ============================================================================