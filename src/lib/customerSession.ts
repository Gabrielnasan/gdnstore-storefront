// Customer (Shopify-via-Supabase-Edge) session helper for the storefront.
//
// The raw session token is stored in localStorage under `gdn_customer_session`.
// It is sent to edge functions via `Authorization: Bearer <token>`.

const SUPABASE_FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const STORAGE_KEY = "gdn_customer_session";

export type CustomerProfile = {
  id: string;
  shopify_customer_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
};

export function getCustomerSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setCustomerSessionToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearCustomerSessionToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function buildLoginUrl(returnTo = "/minha-conta", loginHint?: string): string {
  const url = new URL(`${SUPABASE_FUNCTIONS_BASE}/shopify-auth-start`);
  url.searchParams.set("return_to", returnTo);
  if (loginHint) url.searchParams.set("login_hint", loginHint);
  return url.toString();
}

export function redirectToLogin(returnTo = "/minha-conta", loginHint?: string): void {
  if (typeof window === "undefined") return;
  window.location.href = buildLoginUrl(returnTo, loginHint);
}

export async function exchangeCustomerSession(exchangeCode: string): Promise<{
  session_token: string;
  return_to: string;
  customer: CustomerProfile;
}> {
  const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/exchange-customer-session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ exchange_code: exchangeCode }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `exchange_failed_${res.status}`);
  }
  return res.json();
}

export async function getCurrentCustomer(): Promise<
  { authenticated: true; customer: CustomerProfile } | { authenticated: false }
> {
  const token = getCustomerSessionToken();
  if (!token) return { authenticated: false };
  const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/get-current-customer`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { authenticated: false };
  return res.json();
}

function clearCustomerLocalState(): void {
  if (typeof window === "undefined") return;
  clearCustomerSessionToken();
  try {
    // Best-effort cleanup of any cached customer/admin state.
    const keys = ["gdn_customer_cache", "gdn_admin_cache", "gdn_admin_status"];
    for (const k of keys) {
      window.localStorage.removeItem(k);
      window.sessionStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

export async function logoutCustomer(): Promise<{ shopifyLogoutUrl: string | null }> {
  const token = getCustomerSessionToken();
  let shopifyLogoutUrl: string | null = null;
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/logout-customer`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const body = await res.json().catch(() => ({}));
    if (body && typeof body.shopify_logout_url === "string") {
      shopifyLogoutUrl = body.shopify_logout_url;
    }
  } catch {
    /* ignore network errors; still clear locally */
  }
  clearCustomerLocalState();
  return { shopifyLogoutUrl };
}

export type Money = { amount: string; currencyCode: string } | null;

export type CustomerOrder = {
  id: string;
  name: string;
  processedAt: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: Money;
  subtotalPrice: Money;
  totalShippingPrice: Money;
  lineItems: Array<{
    title: string;
    quantity: number;
    variantTitle: string | null;
    imageUrl: string | null;
    productId: string | null;
    variantId: string | null;
    price: Money;
  }>;
  shippingAddress: {
    name: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
  } | null;
  fulfillments: Array<{
    status: string | null;
    trackingInfo: Array<{ number: string | null; url: string | null }>;
  }>;
};

export type CustomerOrdersResult =
  | { success: true; orders: CustomerOrder[] }
  | { success: false; error: string; needs_login?: boolean };

export async function getCustomerOrders(): Promise<CustomerOrdersResult> {
  const token = getCustomerSessionToken();
  if (!token) return { success: false, error: "not_authenticated", needs_login: true };
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/get-customer-orders`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json().catch(() => ({}))) as CustomerOrdersResult;
    if (!res.ok) {
      return {
        success: false,
        error: (body as any)?.error ?? `http_${res.status}`,
        needs_login: (body as any)?.needs_login === true || res.status === 401,
      };
    }
    return body;
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "network_error" };
  }
}

// ---------- Product Questions (Q&A) ----------

export type PublicProductQuestion = {
  id: string;
  question: string;
  answer: string | null;
  status: string;
  customerName: string | null;
  createdAt: string;
  answeredAt: string | null;
};

export async function getProductQuestions(params: {
  shopifyProductId?: string;
  productHandle?: string;
}): Promise<{ success: true; questions: PublicProductQuestion[] } | { success: false; error: string }> {
  const url = new URL(`${SUPABASE_FUNCTIONS_BASE}/get-product-questions`);
  if (params.shopifyProductId) url.searchParams.set("shopify_product_id", params.shopifyProductId);
  if (params.productHandle) url.searchParams.set("product_handle", params.productHandle);
  try {
    const res = await fetch(url.toString(), { method: "GET" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.success) {
      return { success: false, error: body?.error ?? `http_${res.status}` };
    }
    return body as { success: true; questions: PublicProductQuestion[] };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "network_error" };
  }
}

export type SubmitQuestionResult =
  | { success: true; message: string }
  | { success: false; error: string; needs_login?: boolean };

export async function submitProductQuestion(payload: {
  shopify_product_id: string;
  product_handle?: string | null;
  question: string;
}): Promise<SubmitQuestionResult> {
  const token = getCustomerSessionToken();
  if (!token) return { success: false, error: "not_authenticated", needs_login: true };
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/submit-product-question`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.success) {
      return {
        success: false,
        error: body?.error ?? `http_${res.status}`,
        needs_login: body?.needs_login === true || res.status === 401,
      };
    }
    return body as { success: true; message: string };
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "network_error" };
  }
}
