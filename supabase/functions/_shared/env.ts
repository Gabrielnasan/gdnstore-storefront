// Centralized env access for edge functions.
// Required runtime env vars (set in Supabase dashboard, never commit):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID
//   SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZATION_ENDPOINT
//   SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_ENDPOINT
//   SHOPIFY_CUSTOMER_ACCOUNT_API_BASE   (e.g. https://account.gdnstore.com.br)
//   SHOPIFY_CALLBACK_URL                (e.g. https://your-project-ref.supabase.co/functions/v1/shopify-auth-callback)
//   FRONTEND_BASE_URL                   (e.g. https://gdnstore.com.br)
//   TOKEN_ENCRYPTION_SECRET             (>=32 bytes of entropy, base64 or raw)
//   SESSION_SECRET                      (>=32 bytes; reserved for future signed cookies)

export function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export function getEnv(name: string): string | undefined {
  return Deno.env.get(name);
}
