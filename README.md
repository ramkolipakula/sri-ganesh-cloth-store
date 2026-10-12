# Ganesh Sparkle Shop

# MASTER BUILD PROMPT — SRI GANESH CLOTH CENTRE E-COMMERCE

Act as a senior full-stack engineer, product designer, Supabase architect, database security engineer, and QA engineer.

Build a complete, production-minded, mobile-first e-commerce website for **Sri Ganesh Cloth Centre, Visakhapatnam, Andhra Pradesh, India**.

This must be a working application, not a UI-only prototype. Build the customer storefront, admin dashboard, product and inventory management, cart, checkout, customer accounts, UPI QR payment flow, payment screenshot submission, admin verification, order tracking, and notifications.

## 1. Mandatory Architecture

**Use a static frontend and Supabase managed backend. Do not build or deploy a custom application server.**

### Frontend
- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- Reusable, accessible UI components.
- React Router or an appropriate lightweight routing solution.
- Responsive design for mobile, tablet, and desktop.
- Static production build deployable to Vercel, Netlify, or equivalent static hosting.

### Managed backend
Use Supabase for:
- PostgreSQL database.
- Supabase Auth.
- Product image storage.
- Private payment screenshot storage.
- Row Level Security (RLS).
- Database functions/RPC for atomic inventory and order operations.
- Realtime subscriptions for appropriate order and notification updates.
- Supabase Edge Functions only where server-side secrets or privileged operations are necessary.

Do not deploy a permanent Node.js/Express server or a custom backend service on Render.

A Supabase Edge Function is permitted when needed. It is a managed, on-demand function, not an always-running custom server.

### Architecture constraints
- All customer-facing and admin interfaces run in the frontend.
- All shared business data lives in Supabase, not only in browser storage.
- The admin's changes must become available to customers on other devices.
- The database must remain authoritative for prices, inventory, orders, and payment statuses.
- Use environment variables for public Supabase URL and publishable/anon key.
- Never place Supabase service-role keys, private API keys, or other privileged secrets in frontend code.
- Do not create fake authentication, fake notifications, fake payment verification, or simulated persistence presented as real functionality.
- Do not rely on localStorage for shared products, inventory, authentication, or authoritative orders.
- Local storage may be used for temporary guest-cart persistence and non-sensitive UI preferences.
- Do not introduce a custom server simply to serve the frontend.

Inspect the generated project and the installed package versions before changing its architecture. Keep the implementation consistent with the existing project.

## 2. Store Identity and Reference Poster

Use the attached Sri Ganesh Cloth Centre poster as the source of truth for store details.

- Business name: Sri Ganesh Cloth Centre.
- Phone: 7981809751.
- Address: Door No. 199/3, Near Ramalayam Temple, Durga Bazar, Arilova Colony, Visakhapatnam, Andhra Pradesh – 530040.
- Tagline: Quality Clothes, Comfort for Every You.
- Pricing message: Wholesale Rate ki Retail Ammabadanu.
- Currency: INR (₹).

Use the correct contact details and category names from the poster.

Do not copy the poster's visual layout as the website design. Create a modern shopping experience.

The poster is not a product catalog. Do not invent product photos, prices, inventory, customer reviews, or business claims. Real product information will be entered through the admin dashboard.

## 3. Visual Design and Customer Experience

Create a polished Indian clothing-store shopping experience.

Design requirements:
- Mobile-first layout.
- Elegant white/cream backgrounds with a refined dark navy, maroon, or complementary accent palette.
- Strong product imagery and clear pricing.
- Readable typography and comfortable spacing.
- Responsive product grid.
- Clear navigation and category shortcuts.
- Accessible buttons and forms.
- Visible focus states and keyboard accessibility.
- Loading skeletons, empty states, error messages, and success feedback.
- Optimize image sizes and avoid unnecessary dependencies or heavy animations.

### Homepage
Include:
- Store identity and contact information.
- Search bar.
- Product categories.
- Featured products.
- Recently added products.
- Product cards with images, prices, and stock indicators.
- Cart icon with item count.
- Contact/WhatsApp action.
- Footer containing store details.

### Browsing
Customers must be able to:
- Open the homepage without signing in.
- Browse products and categories without authentication.
- Search by product name.
- Filter by category.
- Sort by newest and price.
- View product details and availability.
- Add products to a cart without being forced to authenticate immediately.

Authentication must be requested only when an unauthenticated customer tries to proceed to checkout or purchase.

## 4. Product Categories

Create these initial categories based on the supplied poster:

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

Preserve these initial names, including their spelling, unless the store owner chooses to edit them.

Categories must be stored in Supabase. Admins can add, edit, reorder, and deactivate categories. Do not hardcode separate category lists across the application.

## 5. Authentication and Roles

Use Supabase Auth for real authentication.

Support:
- Customer registration.
- Customer sign-in.
- Sign-out.
- Password reset.
- Protected customer account pages.
- Secure admin access.

Use a `profiles` table linked to `auth.users`.

Required roles:
- `customer`
- `admin`

### Admin provisioning
- Never let users assign themselves an admin role.
- Never trust a role stored only in frontend state or localStorage.
- Provision the initial admin through a trusted SQL migration/administrative process or a secure server-side operation.
- Document how the shop owner obtains their initial admin account.
- Enforce authorization through RLS and secure database functions, not just protected frontend routes.

### Authentication timing
1. Visitors can browse the store without signing in.
2. Visitors can add items to a guest cart.
3. When they click Proceed to Checkout, prompt them to sign in or create an account.
4. After authentication, preserve the cart and continue to checkout.
5. Ask for customer name, contact number, and delivery address or pickup choice, according to the store's delivery settings.
6. Show the complete order summary before order creation.

Do not discard the cart during sign-in or sign-up.

Do not claim phone OTP works unless its provider is configured. Email/password authentication is an acceptable initial implementation.

## 6. Admin Dashboard

Create a protected `/admin` area.

Dashboard overview:
- Total products.
- Active products.
- Low-stock products.
- Out-of-stock products.
- New orders.
- Payments awaiting verification.
- Verified payments.
- Processing orders.
- Completed orders.

Navigation:
- Dashboard.
- Products.
- Categories.
- Orders.
- Payment verification.
- Notifications.
- Store settings.

Build a practical interface for a shop owner who may primarily use a phone. Support both desktop and mobile admin layouts.

## 7. Product Management

Allow the admin to create, edit, activate, deactivate, and archive products.

Required product fields:
- Product name.
- Category.
- Selling price in INR.
- Optional MRP/original price.
- Optional description.
- Product image.
- Inventory mode.
- Stock quantities.
- Active/inactive status.
- Optional featured flag.

Validate all form values and enforce relevant constraints in the database.

### Product image capture and upload — mandatory

The admin must have two clearly visible options:

**Take Photo**
- Open the device's camera on supported mobile browsers.
- Prefer the rear camera where supported.
- Let the admin capture a new product image.
- Show a preview with Retake, Cancel, and Use Photo actions.

**Choose from Gallery**
- Open the phone's photo picker/gallery.
- Allow selection of an existing image.
- On desktop, allow selecting a file from the computer.

Implementation guidance:
- Use a mobile-compatible image input with `accept="image/*"` and a camera capture option such as `capture="environment"` for the camera action.
- Provide a separate gallery/file-picker input without the `capture` attribute.
- Do not force the admin to use the camera.
- Support JPEG, JPG, PNG, and WebP.
- Enforce file-size and MIME-type limits.
- Show preview, upload progress, and upload errors.
- Allow image replacement or cancellation before saving.
- Upload images to a Supabase Storage product-images bucket.
- Store storage paths in the database.
- Ensure only authorized admins can upload, replace, or remove product images.

Acceptance test: verify that both taking a new picture and selecting an existing gallery image work on an Android phone and that the desktop file picker works.

### Inventory mode A — Size-based products

Provide an editable size/stock table.

Example:

| Size | Available stock |
|---|---:|
| XS | 0 |
| S | 5 |
| M | 12 |
| L | 8 |
| XL | 3 |
| XXL | 0 |

These quantities are examples only.

Requirements:
- Admin can add and remove size rows.
- Admin can configure appropriate sizes for each product.
- Stock must be a nonnegative integer.
- Each size has an independent stock quantity.
- Prevent duplicate size entries for the same product.
- Validate size/product relationships on the server/database.
- Show low-stock warnings.
- Preserve inventory history where practical.

### Inventory mode B — Free Size

Provide a `Free Size` option.

When selected:
- Hide/disable the size-based inventory editor.
- Require a free-size stock quantity.
- Store the product as `free_size`.
- Show only the `Free Size` option on the customer product page.
- Never show XS, S, M, L, XL, XXL, or other size options for that product.
- Track stock using the free-size quantity.

When switching an existing product's inventory mode, show a confirmation and safely preserve or migrate existing stock information. Never silently delete inventory.

## 8. Customer Product and Stock UI

For size-based products:
- Display configured sizes as selectable buttons.
- Sizes with stock greater than zero are selectable.
- Sizes with zero stock are visibly crossed out/struck through and disabled.
- Clearly communicate that the size is out of stock.
- Do not allow unavailable sizes to be added to the cart.
- Validate stock again at checkout.

For free-size products:
- Display only the Free Size option.
- Disable purchasing when free-size stock is zero.

Every product page should show the image, name, price, optional description, category, size options, stock availability, quantity selector, and Add to Cart action.

Never rely only on frontend stock checks. Database-side validation must prevent overselling.

## 9. Cart and Checkout

Implement a working cart with:
- Add item.
- Update quantity.
- Remove item.
- Clear cart.
- Subtotal.
- Configured delivery fee, if applicable.
- Configured discount, if applicable.
- Final total.
- Clear empty-cart state.
- Cart persistence across page refreshes.

For guests, retain cart contents locally or in a session. After authentication, merge the guest cart into the customer session safely.

At checkout:
- Fetch current product details and prices from Supabase.
- Recalculate totals using trusted database/server-side logic.
- Validate each size and quantity.
- Reject inactive products.
- Reject insufficient stock.
- Never trust client-supplied prices or totals.
- Require customer contact details and delivery information or pickup choice.
- Display a complete order summary.

Prevent duplicate orders from repeated button clicks or retries using idempotency or an equivalent reliable strategy.

## 10. Database and Inventory Consistency

Create version-controlled SQL migrations and a normalized PostgreSQL schema.

Required tables, or suitable equivalents:

### `profiles`
- User ID referencing `auth.users`.
- Full name.
- Phone.
- Role.
- Timestamps.

### `categories`
- ID.
- Name.
- Slug.
- Active status.
- Sort order.
- Timestamps.

### `products`
- ID.
- Name.
- Slug.
- Category ID.
- Description.
- Selling price.
- Optional original price.
- Image storage path.
- Inventory mode (`size_based` or `free_size`).
- Free-size stock.
- Active status.
- Featured status.
- Timestamps.

### `product_sizes`
- ID.
- Product ID.
- Size label.
- Stock quantity.
- Timestamps.
- Unique constraint on product and size.

### `orders`
- ID.
- Unique human-readable order number.
- Customer ID.
- Customer name/contact snapshot.
- Delivery address or pickup details.
- Subtotal.
- Delivery fee.
- Discount.
- Total.
- Order status.
- Payment status.
- Timestamps.

### `order_items`
- ID.
- Order ID.
- Product ID.
- Product-name snapshot.
- Size snapshot, including Free Size when appropriate.
- Unit-price snapshot.
- Quantity.
- Line total.

### `payments`
- ID.
- Order ID.
- Payment method.
- Transaction reference.
- Private screenshot storage path.
- Payment status.
- Submission timestamp.
- Reviewer ID.
- Review timestamp.
- Rejection reason.
- Internal admin note.

### `notifications`
- ID.
- Recipient user ID.
- Title.
- Message.
- Related order ID, if applicable.
- Read status.
- Creation timestamp.

### `store_settings`
- Store name and contact.
- Store address.
- UPI ID.
- QR image storage path.
- Payment instructions.
- Delivery fee and delivery/pickup settings.
- Low-stock threshold.

Create appropriate foreign keys, indexes, constraints, and database functions.

Use proper numeric/decimal types for money, not floating-point calculations as the authoritative source.

### Atomic inventory and checkout
Use a secure PostgreSQL function/RPC or equivalent trusted database transaction to:
- Validate the product and requested size.
- Recalculate prices and totals.
- Verify stock.
- Reserve or decrement inventory atomically.
- Create the order and order items.
- Prevent concurrent customers from overselling the last unit.
- Avoid duplicate deductions for the same order.

Choose one consistent stock-reservation strategy and document it. If stock is reserved before payment verification, define a reservation expiry and safe release process. If inventory is deducted at order creation, make sure failed or abandoned orders do not permanently consume stock.

Do not implement inventory updates as multiple unrelated client-side writes.

## 11. UPI QR Payment

The store owner must provide the actual payment QR code and UPI details.

Create a Store Settings page where the admin can:
- Upload/replace the real shop UPI QR.
- Configure the UPI ID.
- Configure the displayed payee name and payment instructions.

Never invent a UPI ID or generate a fake shop QR.

### Customer payment page

After order creation, display:
- Order number.
- Amount payable in INR.
- Actual shop-provided QR image.
- Configured UPI ID, if available.
- Instructions to scan using PhonePe, Google Pay, or another compatible UPI app.
- Transaction/reference ID input.
- Payment screenshot upload.
- Screenshot preview and upload progress.
- Submit Payment Proof button.

The amount must be prominently displayed below or beside the QR.

If valid configured UPI details support a genuine amount-linked payment-intent QR, it may be offered. Otherwise, display the static shop QR and tell customers to verify the amount in their UPI app before paying.

Do not claim a static QR automatically encodes the order amount.

Do not collect a UPI PIN, bank password, card credentials, or banking secrets.

### Payment screenshot storage
- Use a private Supabase Storage bucket.
- Allow only authorized uploads associated with the customer's own order.
- Validate file type, file size, and order ownership.
- Store only the storage path in the database.
- Use short-lived signed URLs or another authorization-controlled mechanism to display screenshots.
- Never make payment screenshots permanently public.

### Payment states
Implement:
- `unpaid`
- `proof_submitted`
- `under_review`
- `verified`
- `rejected`
- `refunded`

Uploading a screenshot must never automatically mark payment as verified.

Screenshots are evidence only. Do not use filenames, OCR, or AI to automatically claim that a payment succeeded.

## 12. Admin Payment Review

Create a dedicated payment-verification queue.

For each order show:
- Order number.
- Customer details.
- Amount.
- Items and sizes.
- Transaction reference.
- Screenshot preview.
- Submission time.
- Current status.

Authorized admins can:
- Review the proof.
- Approve/verify payment.
- Reject payment proof.
- Provide a rejection reason.
- Add internal notes.

When approved, execute an authorized, transactional operation that:
1. Confirms the payment status is eligible for approval.
2. Sets payment status to `verified`.
3. Updates order status to `confirmed` or `processing`.
4. Records the reviewing admin and timestamp.
5. Creates a customer notification.
6. Updates order history and dashboard statistics.
7. Prevents duplicate approval effects.

Approval must be idempotent. Clicking approve twice must not create duplicate orders, notifications, or stock changes.

The shop owner must independently verify the transaction in the relevant UPI/bank records before approving it.

When rejected:
- Set payment status to `rejected`.
- Save the reason.
- Notify the customer.
- Allow a new proof submission for the same order where appropriate.
- Do not automatically create another order.

## 13. Customer Account and Orders

Create a customer account area with:
- Profile.
- Contact information.
- Address management if implemented.
- My Orders.
- Order details.
- Product/size/quantity summary.
- Total.
- Payment status.
- Order status.
- Payment proof submission/rejection information.
- Order history.
- Sign-out.

Display an order timeline:

`Order Created → Payment Proof Submitted → Payment Verified → Order Confirmed → Processing → Completed`

Do not mark an order completed or delivered automatically. The admin must explicitly update its status.

Cancellation and refunds must follow explicit status rules. A cancellation after payment verification is not an automatic refund.

## 14. Notifications and Realtime Updates

Use Supabase database-backed notifications.

Notify the admin about:
- New orders.
- Payment proof submissions.
- Resubmitted proof.
- Low-stock items.
- Out-of-stock products.

Notify customers about:
- Order creation.
- Payment proof submission.
- Payment approval.
- Payment rejection and reason.
- Order status changes.
- Cancellation or refund status.

Provide a notification bell, unread count, timestamps, and mark-as-read functionality.

Use Supabase Realtime for relevant order and notification updates where suitable. Always implement sensible loading, reconnect, and refresh behavior; Realtime must not be the only way to retrieve current data.

Do not promise push notifications, email, or SMS unless the required service is actually configured. In-app notifications are the mandatory initial feature.

## 15. Supabase Security and RLS

Security is a release requirement.

Enable and test RLS on every exposed table.

Required policies:
- Public users can read active products and active categories.
- Only admins can create, update, or deactivate products and categories.
- Customers can read/update only permitted fields of their own profile.
- Customers can access only their own carts, orders, order items, payments, and notifications.
- Customers cannot modify their role.
- Customers cannot set payment status to verified.
- Customers cannot approve orders.
- Customers cannot read other customers' addresses, order records, or payment screenshots.
- Admin-only operations must be enforced through trusted database logic or secure server-side functions.
- Store settings and the UPI QR must be writable only by admins.
- Storage policies must restrict product uploads and payment-proof access appropriately.
- Private payment screenshots must never be accessible to arbitrary users.

Do not rely on frontend route guards or hidden buttons for security.

Never place a service-role key in frontend code. Do not disable RLS to make the application work.

Do not trust `user_metadata` or client-controlled fields for admin privileges.

If a database function uses elevated privileges, lock down its execution grants, validate the caller's authorization inside the function, and use a safe search path.

## 16. Deployment and Availability

The frontend must build into static assets.

Document deployment to Vercel, Netlify, or another static host:
- Build command.
- Output directory.
- SPA route fallback configuration if required.
- Environment variables.
- Supabase URL and publishable key.
- Database migrations.
- Storage bucket setup.
- Initial admin provisioning.
- Production checklist.

No Render-hosted custom application server is required.

Important: Supabase managed services have plan-specific quotas, limits, and inactivity policies. Do not claim that the free tier guarantees uninterrupted availability. Document any required project-activation or billing considerations honestly.

Do not expose secrets in logs or frontend bundles.

## 17. Testing and Acceptance Criteria

Test these scenarios before declaring completion.

### Product management
- Admin can create, edit, deactivate, and archive products.
- Admin can upload a new image using the camera.
- Admin can select an image from the phone gallery.
- Desktop image selection works.
- Size-based stock saves correctly.
- Free-size inventory works correctly.
- Category changes persist across devices.

### Inventory
- Zero-stock sizes appear struck through and cannot be selected.
- Free-size products show only Free Size.
- Quantity cannot exceed available stock.
- Inactive products cannot be purchased.
- Concurrent purchases cannot oversell inventory.
- Stock is not deducted twice.
- Failed/expired reservations are handled according to the chosen strategy.

### Authentication
- Visitors can browse without logging in.
- Checkout prompts for authentication.
- The cart is preserved after sign-in.
- Customers cannot access admin functions.
- Users cannot promote themselves to admin.

### Payment
- The real configured shop QR is displayed.
- The order amount is correct.
- The customer can submit a transaction reference and screenshot.
- Payment proof is stored privately.
- Admin receives an in-app notification.
- Screenshot upload never auto-approves payment.
- Admin approval updates the customer account and order.
- Rejection displays the reason and supports resubmission.
- Duplicate approval has no duplicate effects.

### Security
- Test RLS for every sensitive table.
- Test storage access from unauthorized accounts.
- Confirm customers cannot read other customers' orders.
- Confirm privileged keys never reach frontend code.
- Test direct API requests that attempt to bypass stock or payment rules.

### Reliability
- Test loading, error, empty, and success states.
- Refresh pages and verify persisted state.
- Verify behavior when Realtime disconnects.
- Test on mobile, tablet, and desktop.
- Run linting, TypeScript checks, automated tests, and a production build.
- Fix critical errors before declaring the project ready.

Do not claim a test passed unless it was actually run.

## 18. Implementation Workflow

Build incrementally and keep the application working after each phase.

**Phase 1 — Foundation**
- Inspect repository.
- Set up responsive UI and routing.
- Configure Supabase.
- Create SQL migrations, initial categories, profiles, RLS, and storage policies.

**Phase 2 — Admin**
- Secure admin provisioning.
- Dashboard.
- Category management.
- Product creation and editing.
- Camera/gallery image uploads.
- Size-based and free-size inventory.

**Phase 3 — Storefront**
- Homepage.
- Categories.
- Search/filter/sorting.
- Product details.
- Size availability.
- Cart.

**Phase 4 — Authentication and Orders**
- Supabase Auth.
- Checkout authentication.
- Guest cart preservation.
- Server-side/database-authoritative order creation.
- Atomic inventory handling.

**Phase 5 — Payment**
- Store QR settings.
- Customer QR checkout.
- Transaction reference.
- Private screenshot upload.
- Payment status tracking.

**Phase 6 — Admin Verification**
- Payment review queue.
- Approve/reject actions.
- Order management.
- Customer order history.
- Notifications and Realtime updates.

**Phase 7 — Audit**
- Test end-to-end workflows.
- Test RLS and storage security.
- Test inventory race conditions.
- Run lint, type checks, tests, and production build.
- Document deployment and remaining configuration.

Do not stop at the first attractive screen. Continue through all phases, or clearly identify what remains incomplete.

## 19. Final Deliverables

Deliver:
1. Complete source code.
2. Responsive customer storefront.
3. Secure admin dashboard.
4. Supabase SQL migrations.
5. RLS policies.
6. Storage configuration.
7. Working camera/gallery uploads.
8. Size-based and free-size inventory.
9. Authentication-on-checkout.
10. Working cart and order creation.
11. Actual shop QR configuration.
12. Payment-proof submission and secure admin review.
13. Customer order tracking.
14. In-app notifications.
15. Tests for critical flows.
16. Setup and deployment documentation.
17. A clear list of manual configuration still required.

Before finishing, provide:
- A summary of implemented features.
- The database tables and policies created.
- Tests actually executed and their results.
- Required Supabase configuration.
- Required store-owner inputs, including the real QR code.
- Any remaining known issues.

**Final priority:** A reliable, secure e-commerce system with correct inventory, shared data, and manual payment verification. Build a working application, not a static mockup. Do not fabricate credentials, transactions, test results, or deployment success.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f50b4405-a92e-4124-b20f-a412ccf10957).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
