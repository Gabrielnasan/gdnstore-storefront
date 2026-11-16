# Shopify Customer Account — edge functions

Deno-based Supabase Edge Functions implementing customer authentication and
account data for the GDN Store storefront using the Shopify Customer Account
API (public web app + PKCE S256).

## Functions

- `shopify-auth-start` — kicks off OAuth, stores PKCE verifier encrypted + state hash, redirects to Shopify
- `shopify-auth-callback` — exchanges code, fetches customer, upserts profile/tokens, mints session, redirects to storefront with `exchange_code`
- `exchange-customer-session` — storefront swaps `exchange_code` for the raw `session_token`
- `get-current-customer` — returns authenticated customer for a valid session token
- `logout-customer` — revokes the session
- `get-customer-orders` — returns the authenticated customer's recent Shopify orders (auto-refreshes the Shopify access token when expired)
- `get-product-questions` — public listing of approved/answered product Q&A
- `submit-product-question` — authenticated customer submits a product question (status=pending; requires moderation)

### Optional product_questions columns

The existing `public.product_questions` table already has:
`id, shopify_product_id, customer_name, customer_email, question, answer, status, answered_at, created_at, user_id`.

If you want to also persist the storefront handle and link to `customer_profiles`,
apply this SQL manually (not auto-applied):

```sql
alter table public.product_questions
  add column if not exists product_handle text,
  add column if not exists customer_profile_id uuid references public.customer_profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();
```

`submit-product-question` automatically includes those columns when present and
falls back to a minimal insert when they are missing, so no migration is strictly required.

## Required env (set in Supabase → Project Settings → Edge Functions → Secrets)

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=shp_xxx
SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZATION_ENDPOINT=https://shopify.com/authentication/<shop-id>/oauth/authorize
SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_ENDPOINT=https://shopify.com/authentication/<shop-id>/oauth/token
SHOPIFY_CUSTOMER_ACCOUNT_API_BASE=https://account.gdnstore.com.br
SHOPIFY_CALLBACK_URL=https://your-project-ref.supabase.co/functions/v1/shopify-auth-callback
FRONTEND_BASE_URL=https://gdnstore.com.br
TOKEN_ENCRYPTION_SECRET=<>=32 random bytes>
SESSION_SECRET=<>=32 random bytes; reserved for future signed cookies>
```

## Required tables (apply via SQL editor; not auto-deployed)

```sql
create table if not exists public.shopify_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  code_verifier_encrypted text not null,
  login_hint text,
  return_to text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  shopify_customer_id text not null unique,
  email text,
  first_name text,
  last_name text,
  display_name text,
  phone text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_shopify_tokens (
  customer_profile_id uuid primary key references public.customer_profiles(id) on delete cascade,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  id_token_encrypted text,
  access_token_expires_at timestamptz,
  scope text,
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_session_exchanges (
  id uuid primary key default gen_random_uuid(),
  exchange_code_hash text not null unique,
  session_token_encrypted text not null,
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  -- Reserved for future use; currently nullable and not populated.
  customer_session_id uuid references public.customer_sessions(id) on delete set null,
  return_to text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
```

All tables are accessed exclusively by edge functions using the service role key.
Do not grant API access to `anon` or `authenticated`.

### Required SQL for complete Shopify Customer Account logout

`shopify-auth-callback` stores Shopify's optional `id_token` encrypted when the
column exists. `logout-customer` uses it as `id_token_hint` for Shopify Customer
Account logout. Apply manually if the column is missing:

```sql
ALTER TABLE public.customer_shopify_tokens
ADD COLUMN IF NOT EXISTS id_token_encrypted text;

NOTIFY pgrst, 'reload schema';
```

The functions gracefully fall back to logout without `id_token_hint` when this
column or token is unavailable.

## Frontend wiring

- Login: redirect browser to
  `https://your-project-ref.supabase.co/functions/v1/shopify-auth-start?return_to=/minha-conta`
- Callback: route `/auth/callback` reads `exchange_code`, calls `exchange-customer-session`,
  stores `session_token` in `localStorage` under `gdn_customer_session`, then redirects.
- Logout: POST to `logout-customer` with `Authorization: Bearer <session_token>`,
  clear local storage, then perform a full browser navigation to the returned
  `shopify_logout_url`.
- On load: if `gdn_customer_session` exists, call `get-current-customer`.

## Deploy

Not deployed automatically. Run from the repo root once env + tables are ready:

```
supabase functions deploy shopify-auth-start --project-ref your-project-ref --no-verify-jwt
supabase functions deploy shopify-auth-callback --project-ref your-project-ref --no-verify-jwt
supabase functions deploy exchange-customer-session --project-ref your-project-ref --no-verify-jwt
supabase functions deploy get-current-customer --project-ref your-project-ref --no-verify-jwt
supabase functions deploy logout-customer --project-ref your-project-ref --no-verify-jwt
supabase functions deploy get-customer-orders --project-ref your-project-ref --no-verify-jwt
supabase functions deploy get-product-questions --project-ref your-project-ref --no-verify-jwt
supabase functions deploy submit-product-question --project-ref your-project-ref --no-verify-jwt
```

All functions must run with `--no-verify-jwt` because they are storefront-public
(they enforce their own auth via the opaque local session token).

## Admin moderation functions (Phase 4)

- `admin-get-current` — validates the storefront session and confirms the
  customer is listed (and active) in `public.admin_users`. Returns the
  customer profile and resolved role.
- `admin-list-product-questions` — paginated/filtered listing for moderation
  (status, search, product handle). Returns counts for summary cards.
- `admin-update-product-question` — perform `answer` / `approve` / `reject` /
  `set_pending`. Always re-validates admin authorization server-side. Uses
  `status='approved'` (with a non-empty answer) to represent answered
  questions, matching the existing database CHECK constraint.

All three functions require the **same local storefront session token** used
by the rest of the customer area — sent as `Authorization: Bearer <token>`
or `x-gdn-session: <token>`.

### Required SQL (apply manually if `admin_users` does not exist yet)

```sql
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid references public.customer_profiles(id) on delete cascade,
  email text,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_users_customer_profile_id_key
  on public.admin_users (customer_profile_id) where customer_profile_id is not null;
create unique index if not exists admin_users_email_key
  on public.admin_users (lower(email)) where email is not null;
```

The functions also work with simpler schemas (email-only or
`customer_profile_id`-only, with optional `is_active` / `active` / `status`).

### Optional product_questions columns for richer moderation metadata

```sql
alter table public.product_questions
  add column if not exists shopify_product_title text,
  add column if not exists shopify_product_handle text,
  add column if not exists answered_by text,
  add column if not exists moderation_reason text,
  add column if not exists moderated_by text,
  add column if not exists moderated_at timestamptz;
```

These are optional. `admin-update-product-question` attempts to write them
and silently falls back to a minimal update (status / answer / answered_at)
when the columns are absent, so no migration is required.

### Promote an existing customer to admin (manual; do NOT run automatically)

```sql
insert into public.admin_users (customer_profile_id, email, role, is_active)
select cp.id, cp.email, 'admin', true
from public.customer_profiles cp
where cp.email = 'someone@example.com'
on conflict do nothing;
```

### Deploy

```
supabase functions deploy admin-get-current --project-ref your-project-ref --no-verify-jwt
supabase functions deploy admin-list-product-questions --project-ref your-project-ref --no-verify-jwt
supabase functions deploy admin-update-product-question --project-ref your-project-ref --no-verify-jwt
```

No new Supabase secrets are required.

## Phase 4 — Verified Product Reviews

Mercado Livre-style review system, server-verified against Shopify Customer
Account API. Reviews are only accepted from customers who bought the product
in a PAID order.

### Functions

- `get-reviewable-products` — auth required; returns line items from PAID
  orders the customer has not yet reviewed (filtered against
  `product_reviews(customer_profile_id, shopify_order_id, shopify_product_id)`).
- `create-review-media-upload-url` — auth required; returns a Supabase Storage
  signed PUT URL for the `product-review-media` bucket at the safe path
  `reviews/{customer_profile_id}/{uuid}.{ext}`. Validates MIME and size.
- `submit-product-review` — auth required; **re-verifies** the order against
  Shopify Customer Account API before insert. Sets `verified_purchase=true`
  and `status='pending'`. Rejects duplicates per
  `(customer_profile_id, shopify_order_id, shopify_product_id)`.
- `get-product-reviews` — **public**; returns approved reviews + summary
  (`averageRating`, `totalReviews`, `ratingCounts`) and signs media URLs
  server-side.
- `admin-list-product-reviews` — admin only; paginated/filtered listing with
  signed media URLs and status counts.
- `admin-update-product-review` — admin only; actions `approve`, `reject`
  (with optional `moderation_reason`), `set_pending`.

### Required SQL (apply manually — NOT auto-applied)

```sql
-- Main reviews table (idempotent — adjust ALTERs if columns already exist)
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid references public.customer_profiles(id) on delete set null,
  shopify_order_id text,
  shopify_order_name text,
  shopify_product_id text not null,
  shopify_variant_id text,
  product_handle text,
  product_title text,
  customer_name text,
  customer_email text,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  comment text, -- legacy compatibility
  verified_purchase boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  moderation_reason text,
  moderated_by text,
  moderated_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add any missing columns if the table already exists from earlier phases:
alter table public.product_reviews
  add column if not exists customer_profile_id uuid references public.customer_profiles(id) on delete set null,
  add column if not exists shopify_order_id text,
  add column if not exists shopify_order_name text,
  add column if not exists shopify_variant_id text,
  add column if not exists product_handle text,
  add column if not exists product_title text,
  add column if not exists body text,
  add column if not exists moderation_reason text,
  add column if not exists moderated_by text,
  add column if not exists moderated_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- Prevent duplicate review per (customer, order, product)
create unique index if not exists product_reviews_unique_per_order
  on public.product_reviews (customer_profile_id, shopify_order_id, shopify_product_id)
  where customer_profile_id is not null and shopify_order_id is not null;

-- Unified media table (preferred over the older product_review_photos)
create table if not exists public.product_review_media (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.product_reviews(id) on delete cascade,
  media_type text not null check (media_type in ('image','video')),
  storage_bucket text not null default 'product-review-media',
  storage_path text not null,
  mime_type text,
  file_name text,
  file_size bigint,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_review_media_review_id_idx
  on public.product_review_media (review_id);

NOTIFY pgrst, 'reload schema';
```

`submit-product-review` falls back to inserting into `product_review_photos`
(legacy) if `product_review_media` does not exist, and `get-product-reviews`
will sign URLs from either table.

All tables are accessed exclusively by the edge functions via the service
role key. **Do not grant API access to `anon` or `authenticated`.**

### Required Storage bucket

Create a **private** bucket named `product-review-media` in Supabase Storage.
No public access. The functions sign read URLs server-side using the service
role key.

If you want stricter object-level RLS, you can additionally restrict writes
to the bucket; the upload uses Supabase's signed-upload-URL flow, so no
client write policy is required.

### No new Supabase secrets required.

The functions reuse the existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`TOKEN_ENCRYPTION_SECRET`, and the Shopify Customer Account API env vars
already configured for Phase 1–3.

### Deploy

```
supabase functions deploy get-reviewable-products --project-ref your-project-ref --no-verify-jwt
supabase functions deploy create-review-media-upload-url --project-ref your-project-ref --no-verify-jwt
supabase functions deploy submit-product-review --project-ref your-project-ref --no-verify-jwt
supabase functions deploy get-product-reviews --project-ref your-project-ref --no-verify-jwt
supabase functions deploy admin-list-product-reviews --project-ref your-project-ref --no-verify-jwt
supabase functions deploy admin-update-product-review --project-ref your-project-ref --no-verify-jwt
```

## Phase 5 — Customer profile & addresses (Shopify Customer Account API)

Lets the customer edit name and manage addresses from `/minha-conta`. All
mutations go through the Shopify Customer Account API; addresses live only
in Shopify (no local mirror table). Profile name changes are also written to
`customer_profiles` as a cache (existing columns; no schema change).

### Functions

- `get-customer-account-details` — auth required; returns normalized
  `customer` + `addresses[]` from the Customer Account API.
- `update-customer-profile` — auth required; runs `customerUpdate` for
  `firstName`/`lastName`; updates the Supabase cache.
- `create-customer-address` — auth required; runs `customerAddressCreate`
  with optional `defaultAddress`.
- `update-customer-address` — auth required; runs `customerAddressUpdate`
  with optional `defaultAddress` (also used to set default).
- `delete-customer-address` — auth required; runs `customerAddressDelete`.

No SQL changes are required. No new Supabase secrets are required (reuses
the existing Shopify Customer Account env vars and
`TOKEN_ENCRYPTION_SECRET`).

### Deploy

```
supabase functions deploy get-customer-account-details --project-ref your-project-ref --no-verify-jwt
supabase functions deploy update-customer-profile --project-ref your-project-ref --no-verify-jwt
supabase functions deploy create-customer-address --project-ref your-project-ref --no-verify-jwt
supabase functions deploy update-customer-address --project-ref your-project-ref --no-verify-jwt
supabase functions deploy delete-customer-address --project-ref your-project-ref --no-verify-jwt
```

