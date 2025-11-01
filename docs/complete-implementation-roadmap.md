# Complete Implementation Roadmap - AfriConnect Exchange
**Mobile-First UI Components & Pages**  
**Generated**: November 1, 2025

---

## ✅ COMPLETED (Just Now)

### Components
1. **LocationFilter.tsx** - Location-based filtering with geolocation
2. **ProductCardEnhanced.tsx** - Product card with distance, delivery icons, badges
3. **CategoryPicker.tsx** - Hierarchical category tree with search

---

## 🚀 PHASE 1: CORE MARKETPLACE (PRIORITY 1 - Week 1)

### A. Image Upload Component
**File**: `src/components/vendor/ImageUpload.tsx`

**Features**:
- Drag-and-drop zone (react-dropzone)
- Multiple file upload (max 4 images)
- Preview thumbnails with remove button
- Reorder by dragging thumbnails
- Client-side compression (browser-image-compression)
- Firebase Storage integration
- Validation: JPEG/PNG, ≤2MB per image
- Progress indicator
- Mobile: Camera capture support

**Dependencies**: Already installed ✅

---

### B. Product Listing Form
**File**: `src/app/vendor/add-product/page.tsx`

**Multi-Step Form** (Mobile: Tabs/Accordion):

#### Step 1: Basic Information
- Title (≥3 chars, required)
- Description (≥20 chars, required, rich text editor optional)
- Product type: Product/Service radio buttons
- Tags input (comma-separated, max 10)

#### Step 2: Category & Pricing
- CategoryPicker component integration
- Listing type selector: Sale/Free/Barter (cards with icons)
- **Conditional fields**:
  - **Sale**: Price input, currency dropdown (GBP/USD/NGN)
  - **Free**: Hidden price (auto-set to 0), availability notes
  - **Barter**: Looking for (text area ≥20 chars), barter categories

#### Step 3: Inventory & Details
- Quantity available (number input, ≥0)
- SKU (optional text)
- Condition dropdown: New/Like New/Used Good/Used Fair/Refurbished
- Specifications (key-value pairs, dynamic add/remove)

#### Step 4: Images
- ImageUpload component
- Main image selector (radio buttons)
- Video URL (optional, YouTube/Vimeo embed)

#### Step 5: Location & Delivery
- Address autocomplete (Google Places API)
- Manual coordinate entry (optional, disabled by default)
- Map preview with delivery radius circle
- Delivery radius slider (0-50km)
- Pickup available checkbox
- Shipping policy (optional):
  - Domestic cost
  - International cost
  - Free shipping threshold
  - Estimated delivery days

#### Step 6: Review & Publish
- Summary of all entered data
- Terms & conditions checkbox
- Save as Draft button
- Publish button (validates all fields)

**Validation**:
- Real-time field validation
- Required fields highlighted
- Error messages below fields
- Can't proceed to next step if current step has errors

---

### C. Vendor Dashboard
**File**: `src/app/vendor/products/page.tsx`

**Layout**:
- **Mobile**: Card list view with swipe actions
- **Desktop**: Table view with filters

**Sections**:
1. **Metrics Cards** (top row):
   - Total Listings (count)
   - Active Listings (count + percentage)
   - Views (last 30 days, trend arrow)
   - Sales (last 30 days, revenue)

2. **Filters** (collapsible on mobile):
   - Search by title
   - Category dropdown
   - Status: All/Active/Draft/Sold
   - Listing type: All/Sale/Free/Barter
   - Date range picker

3. **Product List/Table**:
   - **Columns**: Thumbnail, Title, Category, Price, Stock, Status, Location, Created, Actions
   - **Mobile Cards**: Vertical layout with thumbnail, key info, actions menu
   - **Actions**: Edit, Duplicate, Delete, View
   - Bulk selection checkboxes
   - Bulk actions: Delete selected, Change status

4. **Pagination**:
   - 20 products per page
   - Page numbers (mobile: < 1 2 3 >)
   - Jump to page input

5. **Empty State**:
   - Icon + message: "No products yet"
   - "Create your first listing" CTA button

**API Endpoints Needed**:
- GET `/api/vendor/products` (with filters, pagination)
- DELETE `/api/vendor/products/:id`
- PATCH `/api/vendor/products/:id/status`

---

### D. Updated Marketplace Page
**File**: `src/app/marketplace/page.tsx`

**Changes**:
1. Replace `/api/products/list` with `/api/products/nearby`
2. Add LocationFilter component to left sidebar (desktop) or collapsible panel (mobile)
3. Request user location on page load (with permission prompt)
4. Display distance on each ProductCardEnhanced
5. Add sorting dropdown: Relevance (ranking), Distance, Price (low-high), Rating, Newest
6. Handle no-permission state:
   - Fallback message: "Enable location for personalized results"
   - Option to search by city manually
7. Cache filters in URL query params (`?lat=51.5&lng=-0.1&radius=10&category=electronics`)
8. Infinite scroll or "Load More" button
9. Skeleton loaders during fetch

**Mobile Layout**:
- Sticky filter button (bottom bar)
- Filter panel slides up from bottom
- Sort dropdown in top bar
- Grid: 2 columns on mobile, 3-4 on tablet, 4-5 on desktop

---

## 🔐 PHASE 2: AUTH & PROFILE (PRIORITY 2 - Week 2)

### E. Authentication Pages

#### E1. Sign Up Page
**File**: `src/app/auth/signup/page.tsx`

**Features** (US001, US002):
- Tab switcher: Email/Phone
- **Email Tab**:
  - Email input (validation: name@domain.com)
  - Password input (requirements checklist):
    - Min 8 characters
    - 1 uppercase, 1 lowercase, 1 number, 1 special
  - Confirm password
  - Terms & conditions checkbox
  - "Sign Up" button → sends verification email
- **Phone Tab**:
  - Phone number input (intl-tel-input library)
  - Country code dropdown
  - "Send OTP" button
  - OTP input (6 digits, auto-focus next field)
  - Resend OTP (disabled for 60s countdown)
  - OTP retry limit (5 attempts/30 min)
- 3-month free access period starts automatically
- Already have account? Sign in link

**API Endpoints**:
- POST `/api/auth/signup/email`
- POST `/api/auth/signup/phone`
- POST `/api/auth/verify-otp`

---

#### E2. Sign In Page
**File**: `src/app/auth/signin/page.tsx`

**Features** (US003, US004):
- Tab switcher: Email/Phone
- **Email Tab**:
  - Email input
  - Password input (show/hide icon)
  - Remember me checkbox
  - "Sign In" button
  - Forgot password link
  - Account lock after 5 failed attempts (15 min)
- **Phone Tab**:
  - Phone number input
  - "Send OTP" button
  - OTP input (6 digits)
  - Auto-login on correct OTP
- Redirect to dashboard on success (< 2s)
- Don't have account? Sign up link

---

#### E3. Password Reset Pages
**File**: `src/app/auth/reset-password/page.tsx`, `forgot-password/page.tsx`

**Features** (US005):
- **Request Reset**:
  - Email input
  - "Send Reset Link" button
  - Link valid for 24 hours
  - Error: "No account found with this email"
- **Reset Password** (from email link):
  - New password input (requirements checklist)
  - Confirm password
  - Validate: Can't reuse old password
  - "Reset Password" button
  - Expired link handler with "Request New Link" button

---

### F. Profile Management Pages

#### F1. Profile Page
**File**: `src/app/profile/page.tsx`

**Features** (US006, US008, US011):
- **Profile Picture Section**:
  - Avatar display (150x150px circle)
  - Upload button (JPEG/PNG, ≤2MB)
  - Remove picture button
  - Default avatar fallback

- **Personal Details Form**:
  - Full name (required)
  - Email (with verification flow if changed)
  - Phone number (10-15 digits, required)
  - Address (optional)
  - City (required for sellers)
  - Postcode (validation by country)
  - Country dropdown (ISO codes)
  - Bio (optional, max 500 chars)
  
- **Role Management** (US007, US012):
  - Role checkboxes: Buyer, Seller, SME, Trainer
  - Prerequisites check (seller needs complete profile)
  - Multiple roles allowed (configurable)
  - Permission update on save

- **Save Changes Button**:
  - Validation on submit
  - Success toast: "Profile updated successfully"
  - Error handling with field-specific messages

- **Mandatory for Sellers** (US011-AC03):
  - Block marketplace access if incomplete
  - Banner: "Profile completion required to continue"
  - "Complete Profile" link

---

#### F2. Preferences Page
**File**: `src/app/profile/preferences/page.tsx`

**Features** (US009, US012):
- **Language**:
  - Dropdown: English, French, Spanish, etc.
  - Reload UI on save

- **Timezone**:
  - Dropdown: GMT offsets (-12 to +14)
  - Affect all timestamps

- **Notifications**:
  - Checkboxes for each channel:
    - ✓ Email notifications
    - ✓ SMS notifications
    - ✓ Push notifications
  - Subcategories:
    - Order updates
    - Promotional alerts
    - Messages
    - Account security

- **Privacy**:
  - Show profile to public (toggle)
  - Allow messages from non-contacts (toggle)

- **Save Preferences Button**

---

#### F3. Account Status Page
**File**: `src/app/profile/account/page.tsx`

**Features** (US010, US013):
- **Account Information**:
  - Email, Phone, Join date
  - Account status: Active/Suspended/Deactivated
  - Free access period expiry (if applicable)

- **Deactivate Account**:
  - "Deactivate" button
  - Confirmation modal: "Are you sure? You can reactivate by logging in."
  - Account inaccessible but recoverable
  - Reactivate automatically on next login

- **Delete Account**:
  - "Permanently Delete Account" button (red, outlined)
  - Confirmation modal:
    - Password/OTP re-entry
    - Checkbox: "I understand this action cannot be undone"
    - 30-day deletion period
  - Error: "Identity verification required"

---

## 💳 PHASE 3: PAYMENTS & TRANSACTIONS (PRIORITY 3 - Week 3)

### G. Checkout Flow Pages

#### G1. Cart Page
**File**: `src/app/cart/page.tsx`

**Features**:
- Product list with quantity selectors
- Remove item button
- Update quantity (stock check)
- Subtotal, Tax, Shipping, Total
- Promo code input
- "Proceed to Checkout" button
- Empty cart state

---

#### G2. Checkout Page
**File**: `src/app/checkout/page.tsx`

**Features** (US018, US019, US020):
- **Step 1: Shipping Address**
  - Use profile address checkbox
  - Manual entry form
  - Address autocomplete

- **Step 2: Payment Method** (Ranked by FR03):
  - Cash on Delivery (COD) - disabled if >$1,000
  - Online Payment (Card/Wallet/PayPal)
  - Escrow
  - Barter (if applicable)
  - Highest-ranked pre-selected

- **Step 3: Review Order**
  - Order summary
  - Terms & conditions checkbox
  - "Place Order" button
  - Processing indicator

**API Endpoints**:
- POST `/api/orders/create`
- POST `/api/payments/process`
- POST `/api/escrow/hold`

---

### H. Transaction History Page
**File**: `src/app/transactions/page.tsx`

**Features** (US023):
- **Filters**:
  - Date range picker
  - Type: All/Cash/Online/Escrow/Barter
  - Status: All/Pending/Completed/Failed

- **Transaction List** (table/cards):
  - Transaction ID
  - Date & time
  - Type (badge)
  - Amount
  - Status (badge with color)
  - Actions: View details

- **Details Modal**:
  - Full transaction info
  - Seller/buyer details
  - Payment method
  - Timestamps (initiated, completed)

- **Export Button**:
  - CSV/PDF dropdown
  - Up to 12 months
  - Generate within 10s

- **Pagination**: 20 per page

---

### I. Barter System Pages

#### I1. Barter Proposal Modal
**File**: `src/components/barter/ProposalModal.tsx`

**Features** (US022):
- Item/service offered (text area ≥20 chars)
- Estimated value (optional)
- Looking for (text area ≥20 chars)
- Expiry date (≤7 days, date picker)
- Images (optional, max 4)
- "Send Proposal" button
- Notify recipient within 60s

---

#### I2. Barter Inbox Page
**File**: `src/app/barter/inbox/page.tsx`

**Features** (US022):
- Tabs: Received/Sent/Completed
- **Proposal Cards**:
  - Proposer info
  - Items offered/requested
  - Expiry countdown
  - Actions:
    - Accept (mark "Confirmed")
    - Reject (mark "Declined", notify proposer)
    - Counter-offer (linked proposal)
    - Cancel (proposer only, mark "Cancelled")
- **Confirmed Proposals**:
  - Mark "Delivered"
  - Mark "Received"
  - Move to "Completed" when both confirm

---

## 📦 PHASE 4: ORDERS & TRACKING (PRIORITY 4 - Week 4)

### J. Order Pages

#### J1. Orders List Page
**File**: `src/app/orders/page.tsx`

**Features**:
- Tabs: All/Pending/Shipped/Delivered/Cancelled
- **Order Cards** (mobile):
  - Order ID, Date
  - Seller/buyer info
  - Items count
  - Total amount
  - Status badge
  - Actions: View details, Track, Contact seller

- **Filters**: Date range, Status, Payment method

---

#### J2. Order Details Page
**File**: `src/app/orders/[id]/page.tsx`

**Features** (US026):
- **Order Info**:
  - Order ID, Date, Status
  - Payment method
  - Shipping address
  
- **Items List**:
  - Product thumbnails, names, quantities, prices

- **Timeline** (vertical stepper):
  - Order placed (timestamp)
  - Payment confirmed (timestamp)
  - Seller confirmed (timestamp)
  - Shipped/Ready (tracking number)
  - Out for delivery (timestamp)
  - Delivered (timestamp)

- **Actions**:
  - Track Order button (if tracking available)
  - Contact Seller button
  - Raise Dispute button (if enabled)
  - Confirm Delivery button (buyer)
  - Mark as Delivered button (seller)

---

#### J3. Order Tracking Page
**File**: `src/app/tracking/[orderId]/page.tsx`

**Features** (US042, US043):
- **Live Tracking** (via courier API):
  - Status: In Transit/Out for Delivery/Delivered
  - Last updated timestamp
  - Auto-refresh every 5 minutes

- **Tracking Timeline**:
  - Location history
  - Timestamps for each update

- **Courier Info**:
  - Courier name, tracking number
  - Estimated delivery date

- **Notifications** (US043):
  - SMS/email alerts:
    - Shipped (within 60s)
    - Out for Delivery (within 60s)
    - Delivered (within 60s)
  - Opt-out option in preferences

- **No Tracking State**:
  - Message: "Tracking information not available"
  - Contact seller button

---

## ⭐ PHASE 5: REVIEWS & RATINGS (PRIORITY 5 - Week 5)

### K. Reviews Components

#### K1. Rating Input Component
**File**: `src/components/reviews/RatingInput.tsx`

**Features** (US034):
- 5-star rating selector (interactive)
- Only for verified buyers (check order history)
- 30-day window after delivery
- Save rating with timestamp, user ID, order ID

---

#### K2. Review Form Component
**File**: `src/components/reviews/ReviewForm.tsx`

**Features** (US035):
- Star rating (1-5, required)
- Review text (≥20 chars, required)
- Images (optional, max 4)
- Submit button
- Validation: Only verified buyers
- Moderation: Ban offensive words
- Success: "Review submitted successfully"

---

#### K3. Reviews Display Component
**File**: `src/components/reviews/ReviewsList.tsx`

**Features** (US035):
- **Review Cards**:
  - Reviewer alias, avatar
  - Star rating
  - Review text
  - Images (carousel)
  - Date posted
  - Helpful button (thumbs up counter)
  
- **Seller Reply** (nested):
  - Reply text (≥10 chars)
  - Reply button (sellers only)
  - Timestamp

- **Sorting**: Most recent/Highest rated/Most helpful

- **Pagination**: 10 reviews per page

---

#### K4. Reviews Page
**File**: `src/app/reviews/page.tsx`

**Features**:
- User's submitted reviews (editable)
- Reviews received (for sellers)
- Filter by product/order
- Edit/delete own reviews

---

## 🔔 PHASE 6: NOTIFICATIONS (PRIORITY 6 - Week 6)

### L. Notifications Pages

#### L1. Notifications Center
**File**: `src/app/notifications/page.tsx`

**Features** (US026, US027):
- **Tabs**: All/Orders/Promotions/Messages/System

- **Notification Cards**:
  - Icon (based on type)
  - Title, message
  - Timestamp (relative: "2 hours ago")
  - Read/unread indicator
  - Action button (View Order, View Promo, etc.)

- **Mark as Read**:
  - Individual button
  - "Mark all as read" button

- **Delivery SLA** (US026-AC07):
  - 95% delivered in ≤60s
  - 99% in ≤3 minutes
  - Retry up to 3 times with exponential backoff

- **Promotional Alerts** (US027):
  - In-app + email within 60s
  - Opt-out in preferences
  - Read/unread status

- **Audit Log** (US026-AC08):
  - Event, recipient role, channel, timestamp, delivery status

---

## 🆘 PHASE 7: SUPPORT & HELP (PRIORITY 7 - Week 7)

### M. Support Pages

#### M1. Help Center
**File**: `src/app/help/page.tsx`

**Features** (US045):
- **Search Bar**: Keyword search with autocomplete
- **Categories**: Registration, Buying, Selling, Payments, Security
- **FAQ Cards**: Expandable accordion
- **Article Pages**: Rich text content with images
- **Accessibility**: Consistent "Help" link in header

---

#### M2. Contact Support Page
**File**: `src/app/support/page.tsx`

**Features** (US040):
- **Contact Form**:
  - Subject (≥5 chars)
  - Description (≥20 chars)
  - Category dropdown: Billing/Technical/General
  - Attachments (optional, max 3, ≤5MB each)
  - Submit button

- **Ticket Tracking**:
  - Ticket ID displayed
  - Status: Open/In Progress/Resolved
  - Email confirmation within 30s

- **Chatbot** (US041):
  - Floating chat button (bottom-right)
  - Answer FAQs within 5s
  - Escalate after 2 failed attempts
  - Create ticket or hand over to agent
  - Error state: "Support temporarily unavailable"

---

## 🎓 PHASE 8: ONBOARDING (PRIORITY 8 - Week 8)

### N. Onboarding Components

#### N1. Walkthrough Component
**File**: `src/components/onboarding/Walkthrough.tsx`

**Features** (US044):
- **Trigger**: First login after registration
- **Steps** (5+ features):
  1. Welcome screen
  2. Search & browse products
  3. Create your first listing
  4. Payment methods
  5. Profile & notifications

- **Navigation**:
  - Next/Previous buttons
  - Progress indicator (dots)
  - Skip button
  - Mark complete after last step

- **Re-launch**: Help menu > "Take Tour Again"

---

#### N2. Tooltips Component
**File**: `src/components/onboarding/Tooltips.tsx`

**Features** (US046):
- Hover tooltips (≤100 chars)
- "?" help icons next to complex fields
- Click → show explanation + link to full article
- Error messages with contextual corrections

---

## 📊 PHASE 9: ADMIN & ANALYTICS (PRIORITY 9 - Weeks 9-10)

### O. Admin Dashboard Pages

#### O1. Admin Dashboard
**File**: `src/app/admin/dashboard/page.tsx`

**Features** (US030):
- **KPIs** (metrics cards):
  - Total SMEs onboarded
  - Platform-wide sales revenue
  - Total active users
  - Regional breakdowns (chart)

- **Charts**:
  - Sales revenue trend (line chart)
  - User growth (bar chart)
  - Category distribution (pie chart)

- **Performance SLA** (US030-AC03):
  - Load within ≤5s (95%)
  - Refresh every ≤15 min

- **Export Reports** (US031):
  - Date range selector (≤12 months)
  - Format: PDF/Excel
  - Generate within ≤15s
  - Max file size: 20MB

---

#### O2. User Management
**File**: `src/app/admin/users/page.tsx`

**Features** (US038):
- **Users Table**:
  - ID, Name, Email, Roles, Status, Join date
  - Actions: View, Edit, Suspend, Deactivate

- **Suspend User** (US038-AC01):
  - Block login within ≤1 min
  - Flag account as "Suspended"
  - Audit log: Admin ID, target user, timestamp, reason

- **Deactivate User** (US038-AC02):
  - Permanently block login
  - Mark as "Deactivated"

---

#### O3. Dispute Resolution
**File**: `src/app/admin/disputes/page.tsx`

**Features** (US039):
- **Disputes List**:
  - Order ID, Buyer/seller details, Reason
  - Status: Open/In Review/Resolved
  - Priority (High/Medium/Low)

- **Dispute Details**:
  - Order info, messages, evidence (images)
  - Decision form:
    - Favor: Buyer/Seller
    - Resolution notes
    - Submit button

- **Escrow Handling** (US039-AC02):
  - Release funds to correct party within ≤1 hour

- **Barter Handling** (US039-AC03):
  - Notify both parties within ≤60s

- **Audit Log** (US039-AC05):
  - Admin ID, case ID, decision, timestamp, notes

---

## 🔒 PHASE 10: KYC & SECURITY (PRIORITY 10 - Weeks 11-12)

### P. KYC Pages

#### P1. KYC Verification Page
**File**: `src/app/kyc/page.tsx`

**Features** (US036):
- **Requirement** (US036-AC01):
  - Block listing creation without KYC
  - Banner: "Complete ID verification to proceed"

- **Document Upload**:
  - ID (passport/driver's license, ≤5MB)
  - Proof of address (utility bill, ≤5MB)
  - Selfie (optional, liveness check)
  - Validate format, submit within ≤30s

- **Status Display**:
  - Pending (processing icon)
  - Verified (green checkmark)
  - Rejected (red X, reason, resubmit button)

- **Outcome** (US036-AC03):
  - Update status within ≤24 hours
  - Email notification

- **Audit Log** (US036-AC05):
  - Seller ID, submission date, status, decision timestamp

---

## 📱 MOBILE-SPECIFIC CONSIDERATIONS

### Global Mobile Features:
1. **Bottom Navigation Bar**:
   - Home, Search, Add Listing, Orders, Profile

2. **Sticky Action Buttons**:
   - Floating "Add to Cart" on product pages
   - "Filter" button on marketplace (slides up panel)

3. **Swipe Gestures**:
   - Swipe left to delete (order items, cart items)
   - Pull to refresh (product lists, notifications)

4. **Touch Targets**:
   - Minimum 44x44px (Apple HIG)
   - Adequate spacing between clickable elements

5. **Loading States**:
   - Skeleton screens (better than spinners)
   - Progressive image loading (blur-up technique)

6. **Offline Support** (Optional):
   - Service worker for caching
   - Offline banner: "You're offline. Some features unavailable."

7. **Camera Integration**:
   - Image upload: Access mobile camera
   - KYC: Capture ID/selfie directly

8. **Native Features**:
   - Share API (product sharing)
   - Geolocation API (location detection)
   - Haptic feedback (on button press)

---

## 🎨 DESIGN SYSTEM (Apply to All Pages)

### Brand Colors:
- **Primary**: Diaspora Orange (#F4B400) - CTAs, accents
- **Secondary**: Progress Blue (#0072CE) - Links, icons
- **Success**: Growth Green (#34A853) - Success states
- **Background**: Deep Indigo (#2C2A4A) - Footers, overlays
- **Text**: Primary Black (#000000) - Headings

### Typography:
- **Headings**: Montserrat (bold, 700)
- **Body**: Open Sans (regular, 400)
- **Accents**: Ubuntu (italic)

### Components:
- All form inputs: shadcn/ui components
- Consistent spacing: 4px, 8px, 12px, 16px, 24px, 32px
- Border radius: 8px (cards), 4px (inputs), 9999px (pills)
- Shadows: sm, md, lg (Tailwind defaults)

### Responsive Breakpoints:
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: ≥ 1024px (3-4 columns)

---

## 🔌 API ENDPOINTS TO CREATE

### Products:
- ✅ GET `/api/products/nearby` (completed)
- POST `/api/products/create`
- PATCH `/api/products/:id`
- DELETE `/api/products/:id`
- GET `/api/vendor/products` (with filters)

### Orders:
- POST `/api/orders/create`
- GET `/api/orders` (user's orders)
- GET `/api/orders/:id`
- PATCH `/api/orders/:id/status`
- POST `/api/orders/:id/track`

### Payments:
- POST `/api/payments/process`
- POST `/api/payments/cash-on-delivery`
- POST `/api/escrow/hold`
- POST `/api/escrow/release`
- POST `/api/escrow/dispute`

### Barter:
- POST `/api/barter/propose`
- PATCH `/api/barter/:id/accept`
- PATCH `/api/barter/:id/reject`
- PATCH `/api/barter/:id/counter`
- PATCH `/api/barter/:id/complete`

### Reviews:
- POST `/api/reviews/create`
- GET `/api/reviews/product/:id`
- POST `/api/reviews/:id/reply`
- POST `/api/reviews/:id/helpful`

### Notifications:
- GET `/api/notifications`
- PATCH `/api/notifications/:id/read`
- PATCH `/api/notifications/mark-all-read`

### Admin:
- GET `/api/admin/dashboard/metrics`
- GET `/api/admin/users`
- PATCH `/api/admin/users/:id/suspend`
- GET `/api/admin/disputes`
- PATCH `/api/admin/disputes/:id/resolve`

### KYC:
- POST `/api/kyc/submit`
- GET `/api/kyc/status`

---

## 📦 DEPENDENCIES SUMMARY

### Already Installed ✅:
- `@googlemaps/js-api-loader`
- `react-google-places-autocomplete`
- `react-dropzone`
- `browser-image-compression`

### Need to Install:
```bash
npm install intl-tel-input react-international-phone date-fns recharts react-quill @radix-ui/react-scroll-area @radix-ui/react-slider @radix-ui/react-tooltip
```

---

## ⏱️ ESTIMATED TIMELINE

| Phase | Duration | Total Hours |
|-------|----------|-------------|
| Phase 1: Marketplace Core | Week 1 | 40 hours |
| Phase 2: Auth & Profile | Week 2 | 35 hours |
| Phase 3: Payments | Week 3 | 30 hours |
| Phase 4: Orders & Tracking | Week 4 | 25 hours |
| Phase 5: Reviews | Week 5 | 20 hours |
| Phase 6: Notifications | Week 6 | 15 hours |
| Phase 7: Support | Week 7 | 15 hours |
| Phase 8: Onboarding | Week 8 | 10 hours |
| Phase 9: Admin & Analytics | Weeks 9-10 | 40 hours |
| Phase 10: KYC & Security | Weeks 11-12 | 30 hours |
| **TOTAL** | **12 weeks** | **260 hours** |

---

## 🚀 NEXT STEPS

1. **Review this roadmap** - Prioritize features based on business needs
2. **Create ImageUpload component** - Essential for product listings
3. **Build product listing form** - Core seller functionality
4. **Implement auth flows** - Required for all user actions
5. **Test on real mobile devices** - Ensure touch interactions work

---

**Questions? Let me know which phase to start building first!** 🎯
