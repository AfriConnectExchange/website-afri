-- AfriConnect Exchange – PostgreSQL Marketplace Schema
-- Generated from Firebase/Firestore domain model (November 2025)

-- Extensions -----------------------------------------------------------------
-- pg_trgm is not available on the hosted cPanel instance, so skip optional extensions.

-- Enum Types ------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('buyer','seller','sme','admin');
CREATE TYPE user_status AS ENUM ('pending','active','suspended','deactivated','deleted');
CREATE TYPE seller_type AS ENUM ('seller','sme');
CREATE TYPE verification_status AS ENUM ('unverified','pending','verified','rejected');
CREATE TYPE payout_method AS ENUM ('bank_transfer','paypal');

CREATE TYPE product_type AS ENUM ('product','service');
CREATE TYPE listing_type AS ENUM ('sale','barter','freebie');
CREATE TYPE product_status AS ENUM ('draft','active','sold','delisted','pending_review','rejected');
CREATE TYPE product_condition AS ENUM ('new','like_new','good','fair','used_good','used_fair','refurbished');

CREATE TYPE shipping_type AS ENUM ('standard','express','pickup','international');

CREATE TYPE order_status AS ENUM ('pending','confirmed','processing','shipped','delivered','cancelled','disputed');
CREATE TYPE payment_method AS ENUM ('card','bank_transfer','cash_on_delivery','mobile_money','paypal','wallet');
CREATE TYPE payment_status AS ENUM ('pending','paid','refunded','failed');
CREATE TYPE escrow_status AS ENUM ('held','released','refunded','disputed');
CREATE TYPE transaction_type AS ENUM ('purchase','barter','escrow','payout','refund');

CREATE TYPE barter_status AS ENUM ('pending','counter','accepted','rejected','cancelled','completed');
CREATE TYPE support_ticket_status AS ENUM ('open','in_progress','resolved','closed');
CREATE TYPE dispute_status AS ENUM ('open','investigating','resolved','closed');
CREATE TYPE notification_type AS ENUM ('order','delivery','system','security','promotional');
CREATE TYPE review_status AS ENUM ('pending','approved','rejected','flagged');

-- Utility Functions -----------------------------------------------------------
CREATE OR REPLACE FUNCTION gen_uuid_v4()
RETURNS UUID AS $$
DECLARE
  v_bytes BYTEA := decode(md5(random()::text || clock_timestamp()::text), 'hex');
BEGIN
  -- Set the version (0100) and variant (10xx) bits to comply with RFC 4122.
  v_bytes := set_byte(v_bytes, 6, (get_byte(v_bytes, 6) & 15) | 64);
  v_bytes := set_byte(v_bytes, 8, (get_byte(v_bytes, 8) & 63) | 128);
  RETURN encode(v_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Shared sequences for reference numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS transaction_ref_seq START 1;
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS dispute_ref_seq START 1;

CREATE OR REPLACE FUNCTION assign_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(),'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT,6,'0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_transaction_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reference := 'TXN-' || TO_CHAR(NOW(),'YYYYMMDD') || '-' || LPAD(nextval('transaction_ref_seq')::TEXT,8,'0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_transaction_net_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.net_amount_pence := NEW.amount_pence - COALESCE(NEW.fee_pence, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(),'YYYYMMDD') || '-' || LPAD(nextval('ticket_number_seq')::TEXT,5,'0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_dispute_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.dispute_ref := 'DSP-' || TO_CHAR(NOW(),'YYYYMMDD') || '-' || LPAD(nextval('dispute_ref_seq')::TEXT,5,'0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Identity & Profiles ---------------------------------------------------------
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  firebase_uid     VARCHAR(128) UNIQUE NOT NULL,
  email            VARCHAR(255),
  email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  phone            VARCHAR(32),
  phone_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  full_name        VARCHAR(255),
  profile_picture  TEXT,
  seller_bio       TEXT,
  roles            user_role[] NOT NULL DEFAULT ARRAY['buyer']::user_role[],
  seller_type      seller_type,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  profile_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_completed       BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_submitted_at    TIMESTAMPTZ,
  kyc_verified_at     TIMESTAMPTZ,
  kyc_documents       JSONB,
  address_line1    VARCHAR(255),
  address_line2    VARCHAR(255),
  city             VARCHAR(120),
  region           VARCHAR(120),
  country          VARCHAR(120) DEFAULT 'United Kingdom',
  postal_code      VARCHAR(20),
  latitude         DOUBLE PRECISION,
  longitude        DOUBLE PRECISION,
  location_text    VARCHAR(255),
  payment_accepts_cash   BOOLEAN DEFAULT FALSE,
  payment_accepts_card   BOOLEAN DEFAULT FALSE,
  payment_accepts_bank   BOOLEAN DEFAULT FALSE,
  payment_accepts_mobile BOOLEAN DEFAULT FALSE,
  payout_method     payout_method,
  paypal_email      VARCHAR(255),
  status            user_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE TABLE seller_bank_accounts (
  id                     UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_holder_name    VARCHAR(255),
  bank_name              VARCHAR(255),
  account_number         VARCHAR(50),
  sort_code              VARCHAR(20),
  iban                   VARCHAR(50),
  last_validated_at      TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TRIGGER trg_bank_accounts_updated
BEFORE UPDATE ON seller_bank_accounts FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE TABLE user_preferences (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_emails      BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_preferences   JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_preferences   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_preferences_updated
BEFORE UPDATE ON user_preferences FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE TABLE user_onboarding_progress (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  walkthrough_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_steps    JSONB NOT NULL DEFAULT '[]'::jsonb,
  skipped            BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_onboarding_updated
BEFORE UPDATE ON user_onboarding_progress FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE TABLE user_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id      VARCHAR(128),
  user_agent     TEXT,
  ip_address     INET,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id, created_at)
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);

-- Taxonomy --------------------------------------------------------------------
CREATE TABLE categories (
  id           UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  name         VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) NOT NULL UNIQUE,
  description  TEXT,
  icon_url     TEXT,
  parent_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_categories_updated
BEFORE UPDATE ON categories FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- Marketplace Listings --------------------------------------------------------
CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  seller_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  title             VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) NOT NULL UNIQUE,
  description       TEXT NOT NULL,
  product_type      product_type NOT NULL,
  listing_type      listing_type NOT NULL DEFAULT 'sale',
  price_pence       INTEGER NOT NULL DEFAULT 0 CHECK (price_pence >= 0),
  original_price_pence INTEGER,
  currency          CHAR(3) NOT NULL DEFAULT 'GBP',
  quantity_available INTEGER NOT NULL DEFAULT 0,
  sku               VARCHAR(64),
  condition         product_condition,
  accepts_barter    BOOLEAN NOT NULL DEFAULT FALSE,
  barter_preferences JSONB,
  status            product_status NOT NULL DEFAULT 'draft',
  rejection_reason  TEXT,
  featured          BOOLEAN NOT NULL DEFAULT FALSE,
  tags              TEXT[],
  search_keywords   TEXT[],
  location_address  TEXT,
  location_city     VARCHAR(120),
  location_region   VARCHAR(120),
  location_country  VARCHAR(120) DEFAULT 'United Kingdom',
  location_postal_code VARCHAR(20),
  location_latitude DOUBLE PRECISION,
  location_longitude DOUBLE PRECISION,
  location_formatted TEXT,
  is_local_pickup_only BOOLEAN NOT NULL DEFAULT FALSE,
  shipping_policy   JSONB,
  free_shipping_threshold_pence INTEGER,
  view_count        INTEGER NOT NULL DEFAULT 0,
  favorite_count    INTEGER NOT NULL DEFAULT 0,
  click_count       INTEGER NOT NULL DEFAULT 0,
  average_rating    NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count      INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at      TIMESTAMPTZ
);

CREATE TRIGGER trg_products_updated
BEFORE UPDATE ON products FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_listing_type ON products(listing_type);
CREATE INDEX idx_products_price ON products(price_pence);
CREATE INDEX idx_products_search_keywords ON products USING GIN (search_keywords);
CREATE INDEX idx_products_tags ON products USING GIN (tags);
CREATE INDEX idx_products_location ON products(location_country, location_city);

CREATE TABLE product_images (
  id           UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  alt          TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

CREATE TABLE product_specifications (
  id           UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_key     VARCHAR(120) NOT NULL,
  spec_value   TEXT,
  position     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, spec_key)
);

CREATE INDEX idx_product_specs_product ON product_specifications(product_id);

CREATE TABLE product_options (
  id           UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_key   VARCHAR(64) NOT NULL,
  name         VARCHAR(120) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, option_key)
);

CREATE TABLE product_option_values (
  id            UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  option_id     UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
  value         VARCHAR(120) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (option_id, value)
);

CREATE TABLE product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_key     VARCHAR(64),
  option_values   JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_pence     INTEGER CHECK (price_pence >= 0),
  quantity        INTEGER NOT NULL DEFAULT 0,
  sku             VARCHAR(64),
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, variant_key)
);

CREATE TRIGGER trg_product_variants_updated
BEFORE UPDATE ON product_variants FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE TABLE product_shipping_options (
  id                   UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_name          VARCHAR(255) NOT NULL,
  shipping_type        shipping_type NOT NULL,
  price_pence          INTEGER NOT NULL DEFAULT 0 CHECK (price_pence >= 0),
  estimated_days_min   INTEGER,
  estimated_days_max   INTEGER,
  regions              TEXT[],
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_shipping_product ON product_shipping_options(product_id);

CREATE TABLE wishlists (
  id         UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- Orders & Fulfilment --------------------------------------------------------
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  order_number      VARCHAR(40) NOT NULL UNIQUE,
  buyer_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status            order_status NOT NULL DEFAULT 'pending',
  payment_method    payment_method,
  payment_status    payment_status DEFAULT 'pending',
  escrow_status     escrow_status,
  currency          CHAR(3) NOT NULL DEFAULT 'GBP',
  subtotal_pence    INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_pence >= 0),
  shipping_pence    INTEGER NOT NULL DEFAULT 0 CHECK (shipping_pence >= 0),
  total_pence       INTEGER NOT NULL DEFAULT 0 CHECK (total_pence >= 0),
  delivery_address  JSONB,
  delivery_notes    TEXT,
  tracking_number   VARCHAR(255),
  courier_name      VARCHAR(120),
  placed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at      TIMESTAMPTZ,
  shipped_at        TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_orders_assign_number
BEFORE INSERT ON orders FOR EACH ROW
EXECUTE PROCEDURE assign_order_number();

CREATE TRIGGER trg_orders_updated
BEFORE UPDATE ON orders FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
  id             UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  variant_id     UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  title          VARCHAR(255) NOT NULL,
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_pence INTEGER NOT NULL DEFAULT 0 CHECK (unit_price_pence >= 0),
  total_price_pence INTEGER NOT NULL DEFAULT 0 CHECK (total_price_pence >= 0),
  metadata       JSONB
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE UNIQUE INDEX idx_order_items_unique
  ON order_items (order_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::UUID));
CREATE TABLE delivery_tracking (
  id                UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number   VARCHAR(255) NOT NULL,
  courier_name      VARCHAR(120) NOT NULL,
  current_status    VARCHAR(120) NOT NULL,
  estimated_delivery TIMESTAMPTZ,
  tracking_history  JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);

-- Payments, Escrow & Transactions --------------------------------------------
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  reference       VARCHAR(60) UNIQUE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  type            transaction_type NOT NULL,
  payment_method  payment_method,
  status          payment_status NOT NULL DEFAULT 'pending',
  amount_pence    INTEGER NOT NULL CHECK (amount_pence >= 0),
  fee_pence       INTEGER DEFAULT 0 CHECK (fee_pence >= 0),
  net_amount_pence INTEGER NOT NULL DEFAULT 0,
  currency        CHAR(3) NOT NULL DEFAULT 'GBP',
  description     TEXT,
  metadata        JSONB,
  provider_name   VARCHAR(120),
  provider_transaction_id VARCHAR(255),
  provider_response JSONB,
  initiated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  failure_reason  TEXT,
  refunded_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_transactions_assign_ref
BEFORE INSERT ON transactions FOR EACH ROW
EXECUTE PROCEDURE assign_transaction_ref();

CREATE TRIGGER trg_transactions_net_amount
BEFORE INSERT OR UPDATE ON transactions FOR EACH ROW
EXECUTE PROCEDURE set_transaction_net_amount();

CREATE TRIGGER trg_transactions_updated
BEFORE UPDATE ON transactions FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_status ON transactions(status);

CREATE TABLE escrow_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  transaction_id  UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
  buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount_pence    INTEGER NOT NULL CHECK (amount_pence >= 0),
  status          escrow_status NOT NULL DEFAULT 'held',
  held_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  auto_release_at TIMESTAMPTZ,
  released_at     TIMESTAMPTZ,
  disputed_at     TIMESTAMPTZ,
  dispute_reason  TEXT,
  resolved_at     TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_escrow_updated
BEFORE UPDATE ON escrow_transactions FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE INDEX idx_escrow_buyer ON escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_seller ON escrow_transactions(seller_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);

-- Barter ----------------------------------------------------------------------
CREATE TABLE barter_proposals (
  id                UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  proposer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offered_product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  offered_service_id   UUID,
  requested_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  requested_service_id UUID,
  offer_details     JSONB,
  status            barter_status NOT NULL DEFAULT 'pending',
  counter_offer     JSONB,
  expires_at        TIMESTAMPTZ,
  accepted_at       TIMESTAMPTZ,
  rejected_at       TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_barter_updated
BEFORE UPDATE ON barter_proposals FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE INDEX idx_barter_proposer ON barter_proposals(proposer_id);
CREATE INDEX idx_barter_recipient ON barter_proposals(recipient_id);
CREATE INDEX idx_barter_status ON barter_proposals(status);

-- Reviews ---------------------------------------------------------------------
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  reviewer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title           VARCHAR(255),
  comment         TEXT,
  status          review_status NOT NULL DEFAULT 'pending',
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count   INTEGER NOT NULL DEFAULT 0,
  unhelpful_count INTEGER NOT NULL DEFAULT 0,
  flagged_count   INTEGER NOT NULL DEFAULT 0,
  seller_reply    TEXT,
  seller_replied_at TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  rejected_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_reviews_updated
BEFORE UPDATE ON reviews FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_status ON reviews(status);

-- Notifications ---------------------------------------------------------------
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         notification_type NOT NULL,
  title        VARCHAR(255) NOT NULL,
  message      TEXT NOT NULL,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  link_url     TEXT,
  priority     VARCHAR(20),
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);

-- Support & Moderation --------------------------------------------------------
CREATE TABLE support_tickets (
  id             UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  ticket_number  VARCHAR(40) UNIQUE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category       VARCHAR(60) NOT NULL,
  subject        VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL,
  status         support_ticket_status NOT NULL DEFAULT 'open',
  priority       VARCHAR(20) NOT NULL DEFAULT 'medium',
  assigned_to    UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at    TIMESTAMPTZ,
  resolved_at    TIMESTAMPTZ,
  closed_at      TIMESTAMPTZ,
  resolution     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_support_assign_number
BEFORE INSERT ON support_tickets FOR EACH ROW
EXECUTE PROCEDURE assign_ticket_number();

CREATE TRIGGER trg_support_updated
BEFORE UPDATE ON support_tickets FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE TABLE ticket_messages (
  id            UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  ticket_id     UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  attachments   JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_internal   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);

CREATE TABLE disputes (
  id             UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  dispute_ref    VARCHAR(40) UNIQUE,
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  escrow_id      UUID REFERENCES escrow_transactions(id) ON DELETE SET NULL,
  barter_id      UUID REFERENCES barter_proposals(id) ON DELETE SET NULL,
  complainant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  respondent_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status         dispute_status NOT NULL DEFAULT 'open',
  reason         TEXT NOT NULL,
  description    TEXT NOT NULL,
  evidence       JSONB NOT NULL DEFAULT '[]'::jsonb,
  assigned_to    UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution     TEXT,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_disputes_assign_ref
BEFORE INSERT ON disputes FOR EACH ROW
EXECUTE PROCEDURE assign_dispute_ref();

CREATE TRIGGER trg_disputes_updated
BEFORE UPDATE ON disputes FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

-- Compliance ------------------------------------------------------------------
CREATE TABLE kyc_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type   VARCHAR(40) NOT NULL,
  document_number VARCHAR(120),
  document_url    TEXT,
  proof_of_address_url TEXT,
  selfie_url      TEXT,
  status          verification_status NOT NULL DEFAULT 'pending',
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  reviewer_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_kyc_updated
BEFORE UPDATE ON kyc_submissions FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

-- Marketing & Analytics -------------------------------------------------------
CREATE TABLE adverts (
  id            UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  media         JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_url    TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'draft',
  impressions   INTEGER NOT NULL DEFAULT 0,
  clicks        INTEGER NOT NULL DEFAULT 0,
  leads         INTEGER NOT NULL DEFAULT 0,
  start_date    TIMESTAMPTZ,
  end_date      TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  expired_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_adverts_updated
BEFORE UPDATE ON adverts FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

CREATE INDEX idx_adverts_owner ON adverts(owner_id);
CREATE INDEX idx_adverts_status ON adverts(status);

CREATE TABLE analytics_events (
  id            UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type    VARCHAR(120) NOT NULL,
  event_name    VARCHAR(255) NOT NULL,
  event_data    JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_url      TEXT,
  referrer_url  TEXT,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);

CREATE TABLE activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_uuid_v4(),
  actor_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(120) NOT NULL,
  entity_type   VARCHAR(60),
  entity_id     UUID,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_actor ON activity_logs(actor_id);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);

-- Initial Data (optional category seeds) --------------------------------------
INSERT INTO categories (id, name, slug, description, display_order)
VALUES
  (gen_uuid_v4(), 'Electronics', 'electronics', 'Devices, accessories, and components', 1),
  (gen_uuid_v4(), 'Fashion & Beauty', 'fashion-beauty', 'Clothing, footwear, cosmetics', 2),
  (gen_uuid_v4(), 'Home & Living', 'home-living', 'Furniture, decor, and appliances', 3),
  (gen_uuid_v4(), 'Food & Groceries', 'food-groceries', 'African food, snacks, and essentials', 4),
  (gen_uuid_v4(), 'Professional Services', 'professional-services', 'Business, consulting, and skilled services', 5)
ON CONFLICT (slug) DO NOTHING;