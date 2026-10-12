# Sri Ganesh Cloth Centre — E-Commerce Web Application

A full-stack, mobile-first e-commerce web storefront and management portal built for **Sri Ganesh Cloth Centre**, Visakhapatnam, Andhra Pradesh, India.

---

## 1. Business Overview

- **Business Name**: Sri Ganesh Cloth Centre
- **Location**: Door No. 199/3, Near Ramalayam Temple, Durga Bazar, Arilova Colony, Visakhapatnam, Andhra Pradesh – 530040
- **Phone / WhatsApp**: +91 7981809751
- **Tagline**: *Quality Clothes, Comfort for Every You*
- **Value Proposition**: *Wholesale Rate ki Retail Ammabadanu*

### Catalog Categories (16 Initial Categories)
1. Clothes Section
2. Nighties
3. Plazzos
4. Ladies All Innerwear
5. Towels
6. Gokul Bannins (Gents)
7. Sarees
8. Three Piece Sets
9. Kurtis
10. Scarfs and Chunnis
11. Cotton Dress Materials
12. Bed Sheets
13. Ankle Length Leggings
14. Lungis
15. Blouse Pieces
16. Night Dresses

---

## 2. Technology Stack

- **Frontend & Routing**: [TanStack Start](https://tanstack.com/start) with [React 19](https://react.dev) and [TypeScript](https://www.typescriptlang.org/)
- **Bundler & SSR Engine**: [Vite 8](https://vitejs.dev/) with [Nitro](https://nitro.unjs.io/) (Cloudflare module preset)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with [Radix UI](https://www.radix-ui.com/) and [Lucide Icons](https://lucide.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/)
  - **PostgreSQL Database** with full Row Level Security (RLS)
  - **Supabase Auth** (email & password authentication, secure session persistence)
  - **Database Functions (RPC)** for atomic stock deduction, order placement, and payment verification
  - **Supabase Storage** for public product photos and private payment screenshot verification
  - **Supabase Realtime** for instant notifications and live order updates
- **Testing**: [Vitest](https://vitest.dev/) and Testing Library

---

## 3. Architecture & Key Features

### Storefront
- **Mobile-First Design**: Optimized for smooth mobile browsing with responsive desktop layout.
- **Dynamic Catalog**: Full product browsing with category filtering, real-time search, price/newest sorting, and in-stock filter.
- **Product Detail**: High-res image display, Free-Size vs. Size-Based stock selection with disabled zero-stock states, and live quantity validation.
- **Local + Synced Cart**: Guest shopping cart persisted locally in browser storage, safely merged into the user account upon sign-in.
- **Direct Business Contact**: One-tap phone calling and WhatsApp messaging with prefilled inquiry templates.

### Checkout & Payment Flow
1. **Atomic Order Placement**: Utilizes PostgreSQL RPC (`place_order`) to validate real-time database prices, reserve inventory atomically, and generate unique order numbers.
2. **UPI Payment**: Dynamic UPI URI link (`upi://pay?...`) and shop QR code display with exact payable amount and order reference.
3. **Proof Submission**: Customers enter their UTR/UPI reference and upload payment screenshots to a private Supabase Storage bucket (`payment_proofs`).
4. **Idempotent Verification**: Screenshots serve as evidence; payments are placed in `proof_submitted` / `under_review` status awaiting shop owner review.

### Customer Account & Order Tracking
- **My Orders**: Real-time order timeline (`placed` → `paid` → `packed` → `shipped` → `delivered`).
- **Payment Feedback**: Clear status display for verified payments or rejection reasons with instant one-click resubmission.
- **Notification Hub**: Realtime alerts for order confirmation, payment approval, and shipping updates.

### Admin Dashboard
- **Overview Metrics**: Total & active products, low-stock warnings, orders awaiting payment verification, and revenue counters.
- **Product Management**: Create, edit, and archive products. Supports both size-based inventory and free-size stock. Mobile camera capture and gallery selection with direct upload to `product_images` bucket.
- **Payment Verification**: Review pending orders with customer details, transaction UTR, and private screenshot previews. One-click Approve (`admin_review_payment` RPC) or Reject with required explanation.
- **Order Management**: Filter orders by status and advance fulfillment (`placed`, `paid`, `packed`, `shipped`, `delivered`, `cancelled`).
- **Category Management**: Create, update, reorder, and toggle catalog categories.
- **Store Settings**: Configure shop phone, address, UPI ID, delivery fee, low-stock threshold, and upload the official UPI QR image.

---

## 4. Local Development Setup

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation
```bash
# Clone the repository
git clone https://github.com/ramkolipakula/ganesh-sparkle-shop.git
cd ganesh-sparkle-shop

# Install dependencies (runs postinstall patch hook automatically)
npm install
```

### Environment Configuration
Copy the provided `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your Supabase project keys:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
> **Security Notice**: Never commit `.env` or expose Supabase service-role keys in client code. `.env` is ignored by `.gitignore`.

### Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 5. Supabase Setup & Security

### Database Migrations
Migrations are located in `drizzle/migrations/`:
- `0000_migration.sql`: Core schema, 16 categories, tables, RLS policies, and triggers.
- `0001_migration.sql`: Atomic RPC functions (`place_order`, `submit_payment_proof`, `admin_review_payment`, `admin_update_order_status`, `admin_mark_refunded`, `release_expired_orders`), storage bucket definitions, and security policies.

Apply migrations via the Supabase Dashboard SQL Editor or Supabase CLI:
```bash
supabase db push
```

### Storage Buckets
1. **`product_images`**:
   - Access: Public read (`SELECT`).
   - Permissions: Insert/update/delete restricted to authenticated admin users.
2. **`payment_proofs`**:
   - Access: Private (No public read).
   - Permissions: Upload restricted to the customer who placed the order; read access restricted to the order owner and admins.

### Admin Provisioning
To grant a user admin privileges:
1. Have the admin sign up through the `/auth` page.
2. In the Supabase Dashboard, locate their `user_id` from the `auth.users` table.
3. Insert an admin record into the `user_roles` table:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<USER-UUID>', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```
4. The user now has access to `/admin` and privileged RPC endpoints.

---

## 6. Testing, Linting & Production Build

### Automated Test Suite
Unit tests cover cart calculations, inventory validation, storage path generation, and atomic order/payment workflows:
```bash
npm run test
```

### Code Quality & TypeScript Verification
```bash
# Type check TypeScript definitions
npm run typecheck

# Lint source code
npm run lint

# Format code with Prettier
npm run format
```

### Production Build
```bash
# Compile client and server bundles via Vite & Nitro
npm run build

# Preview the built distribution locally
npm run preview
```

---

## 7. Deployment

The project builds via **Nitro** with the `cloudflare-module` preset by default, outputting to `.output/`:
- `.output/public`: Client static assets (CSS, JS chunks, images).
- `.output/server`: Server-side rendering bundle (`_ssr`, `index.mjs`, `wrangler.json`).

### Supported Deployment Targets
- **Cloudflare Pages / Workers**: Deploy the `.output` directory using Wrangler (`npx wrangler pages deploy .output/public` or `npx nitro deploy --prebuilt`).
- **Vercel / Netlify**: Update `vite.config.ts` Nitro preset if deploying to Vercel (`preset: 'vercel'`) or Netlify (`preset: 'netlify'`).
- **Node.js Server**: Use `preset: 'node-server'` for Dockerized or standalone Node.js environments.

---

## 8. License & Rights

Copyright © Sri Ganesh Cloth Centre, Visakhapatnam. All rights reserved.
