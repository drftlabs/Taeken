# Taeken store: launch guide

Next.js 14 + Supabase (database, login, image storage) + Razorpay (payments) + Resend (emails), hosted on Vercel at **www.taeken.in**.

## 1. Put the code on GitHub
1. Create a free account at github.com → **New repository** → name `taeken-store` → Private → Create.
2. Unzip this project. In a terminal inside the folder:
   ```
   git init
   git add .
   git commit -m "Taeken store"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/taeken-store.git
   git push -u origin main
   ```
   No terminal? On the new repo page choose **uploading an existing file** and drag in the folder contents (not `node_modules`, `.next`, or any `.env` file).
3. Never commit real keys. `.env.local` is already git-ignored; keys go into Vercel (step 5).

## 2. Supabase (database + login + images)
1. supabase.com → New project (region: Mumbai / ap-south-1). Save the database password.
2. **SQL Editor** → paste all of `supabase/schema.sql` → Run. Then paste `supabase/seed.sql` → Run (adds sample products, tags, colours, 4 collections, 3 slides, homepage blocks).
3. **Authentication → Users → Add user**: your admin email + a strong password, tick *Auto confirm*. Then in SQL Editor run:
   ```
   insert into public.admins(user_id) select id from auth.users where email = 'YOUR-ADMIN-EMAIL';
   ```
4. **Authentication → URL Configuration**: Site URL `https://www.taeken.in`; add redirect URLs `https://www.taeken.in/**` and `http://localhost:3000/**`.
5. **Authentication → Email Templates → Magic Link**: customers log in with a 6-digit code, so include `{{ .Token }}` in the template body (e.g. "Your Taeken login code: {{ .Token }}").
6. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key (keep the last one secret).

### 2b. Updating an existing store (IMPORTANT, v2/v3 upgrade)
If you already ran `schema.sql` and `seed.sql` earlier, open **SQL Editor**, run `supabase/migration_2.sql`, then `migration_3.sql` (extra product photos), then `migration_4.sql` (free shipping above ₹1,499, delivery 3–4 days). It adds the new product fields (SKU, collections, SEO, story), COD/discount columns on orders, and the discount-codes table. Do this **before** (or right after) deploying the new code. Fresh installs don't need it because `schema.sql` already contains it.

## 3. Resend (emails, optional but recommended)
resend.com → add domain `taeken.in` and add the DNS records it shows → create an API key. Set `EMAIL_FROM` like `Taeken <orders@taeken.in>`. Without a key the store works but sends no emails.
For Supabase login codes to come from your domain, also set up Resend as custom SMTP in Supabase (Authentication → SMTP); the default sender is heavily rate-limited.

## 4. Razorpay
1. Sign up, complete KYC. Start with **Test mode** keys.
2. Dashboard → Settings → Webhooks → add `https://www.taeken.in/api/razorpay/webhook`, events `payment.captured` and `order.paid`, and set a secret.
3. Before going live, switch to Live keys and update them in Vercel.

## 5. Vercel (hosting)
1. vercel.com → Add New → Project → import the GitHub repo (framework: Next.js, auto-detected).
2. Add environment variables (see `.env.example`):
   `NEXT_PUBLIC_SITE_URL=https://www.taeken.in`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`.
3. Deploy. Then **Settings → Domains** → add `www.taeken.in`; at your domain registrar add the CNAME record Vercel shows (usually `www` → `cname.vercel-dns.com`). Add `taeken.in` too and set it to redirect to www.

## 6. Using the admin (`/admin`)
New in v2:
- **Products list**: search, filter (live / hidden / low stock / out), tick several products and bulk **add or remove a collection or tag, make live or hidden, change price by %, delete**.
- **Product page in admin**: SKU, barcode, cost price (shows margin), weight, vendor, type, several collections, featured, low-stock alert, SEO title and description, **Product story** with headings, bullets and **inserted photos**, Duplicate button.
- **Inventory**: every product by UK size on one screen. Edit numbers and Save.
- **Collections**: "Manage products" lets you tick exactly which products belong to a collection (a product can be in many).
- **CSV import / export** (Products page): download the template, fill it in, import. Matches by slug or SKU, so you can also export, edit in Excel and re-import. Tags / colours / collections / images are separated with `|`.
- **Discount codes**: percent or flat, minimum order, max uses, expiry. A sample `WELCOME10` is created.
- **Settings → Cash on delivery**: on/off, % paid upfront (default 10), COD fee (default ₹99). WhatsApp number adds a chat button.
- Orders show **COD: collect ₹X**. The orders CSV has `payment_method`, `paid_online`, `cod_to_collect` columns for your courier. Tick "cash collected" on the order when the courier remits.

v3: colour is now selectable and saved on orders and emails (display only, no per-colour stock or photos). Product page has an extra photo block (any shape), recently viewed, trust bar, delivery date estimate and 7-day returns (days editable in Settings). Product cards open a colour and size picker before adding, with a fly-to-bag animation and a pulsing bag.

Everything from v1:
- **Products**: add/edit, upload transparent PNGs (straight to Supabase), prices, stock per UK size, colours, tags, collection, show/hide.
- **Tags**: create tags (New, Bestseller…) and pick background/text colours; assign them on each product.
- **Colours**: manage the colour swatches products can use.
- **Collections**: rename the four categories and change their images (they appear in "Pick your shape").
- **Homepage blocks**: reorder, turn on/off, add/remove sections (hero, products, banner, collections, story).
- **Hero slides**: images (desktop + mobile), headline, button text and link.
- **Orders**: filter, open, change status; **Export CSV**; **Import tracking** (CSV columns `order_number,courier,tracking_number,tracking_url`). Orders are marked shipped and customers get an email.
- **Messages**: contact and complaint forms land here with status.
- **Legal pages**: edit all 7 policies. **Settings**: business details, shipping fee, free-shipping limit, ticker text, Instagram handle, return/exchange days.

## 7. Go-live checklist
- [ ] Fill Settings: legal name, address, phone, GSTIN, grievance officer name, jurisdiction city.
- [ ] Have a lawyer review the policies. They are drafts for India, not legal advice.
- [ ] Replace the sample products and prices; upload real PNGs and slide images.
- [ ] Test a full order in Razorpay test mode (use Razorpay test cards/UPI), confirm email, account login, tracking import.
- [ ] Switch Razorpay to live keys and re-test with a small real payment.
- [ ] Add the Instagram handle in Settings.

## Local development
```
cp .env.example .env.local   # fill values
npm install
npm run dev
```
Without Supabase keys the site shows demo data (checkout and admin need the real backend).
