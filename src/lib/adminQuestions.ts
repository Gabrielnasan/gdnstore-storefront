// Admin moderation helpers for product questions.
// All calls send Authorization: Bearer <local session_token>.

import { getCustomerSessionToken, type CustomerProfile } from "@/lib/customerSession";

const SUPABASE_FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export type AdminCheckResult =
  | { authenticated: true; admin: true; customer: CustomerProfile; role: string }
  | { authenticated: boolean; admin: false; message?: string };

export async function getCurrentAdmin(): Promise<AdminCheckResult> {
  const token = getCustomerSessionToken();
  if (!token) {
    return { authenticated: false, admin: false, message: "Faça login para continuar." };
  }
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/admin-get-current`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body?.admin === true) {
      return body as AdminCheckResult;
    }
    return {
      authenticated: body?.authenticated === true,
      admin: false,
      message: body?.message ?? "Acesso não autorizado.",
    };
  } catch (e) {
    return { authenticated: false, admin: false, message: (e as Error).message };
  }
}

export type AdminProductQuestion = {
  id: string;
  shopify_product_id: string | null;
  shopify_product_title: string | null;
  shopify_product_handle: string | null;
  product_handle: string | null;
  customer_name: string | null;
  customer_email: string | null;
  question: string;
  answer: string | null;
  status: string;
  answered_by: string | null;
  answered_at: string | null;
  moderation_reason: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export type AdminListFilters = {
  status?: "pending" | "approved" | "rejected" | "all";
  search?: string;
  product_handle?: string;
  limit?: number;
  offset?: number;
};

export type AdminListResult =
  | {
      success: true;
      questions: AdminProductQuestion[];
      pagination: { limit: number; offset: number; total: number | null };
      counts: { pending: number; approved: number; rejected: number; total: number };
    }
  | { success: false; error: string; needs_login?: boolean };

export async function adminListProductQuestions(
  filters: AdminListFilters = {},
): Promise<AdminListResult> {
  const token = getCustomerSessionToken();
  if (!token) return { success: false, error: "not_authenticated", needs_login: true };
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/admin-list-product-questions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(filters),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false) {
      return {
        success: false,
        error: body?.error ?? body?.message ?? `http_${res.status}`,
        needs_login: res.status === 401,
      };
    }
    return body as AdminListResult;
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "network_error" };
  }
}

export type AdminUpdatePayload = {
  id: string;
  action: "answer" | "approve" | "reject" | "set_pending";
  answer?: string;
  moderation_reason?: string;
};

export type AdminUpdateResult =
  | { success: true; question: AdminProductQuestion }
  | { success: false; error: string; needs_login?: boolean };

export async function adminUpdateProductQuestion(
  payload: AdminUpdatePayload,
): Promise<AdminUpdateResult> {
  const token = getCustomerSessionToken();
  if (!token) return { success: false, error: "not_authenticated", needs_login: true };
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/admin-update-product-question`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false) {
      return {
        success: false,
        error: body?.error ?? `http_${res.status}`,
        needs_login: res.status === 401,
      };
    }
    return body as AdminUpdateResult;
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "network_error" };
  }
}
