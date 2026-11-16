// Shared admin authorization helper.
//
// Validates the storefront session token and verifies the customer is listed
// in `public.admin_users`. Supports a flexible schema:
//   - link by `customer_profile_id` (preferred) and/or `email`
//   - optional `is_active` / `active` / `status` activation column
//   - optional `role` column (defaults to "admin")

import { json } from "./cors.ts";
import { findActiveSessionByToken, getSessionTokenFromRequest } from "./session.ts";
import { admin } from "./supabase.ts";

export type AdminContext = {
  customer: {
    id: string;
    shopify_customer_id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    phone: string | null;
  };
  adminRow: Record<string, unknown>;
  role: string;
  displayName: string;
};

export type AdminCheckResult =
  | { ok: true; ctx: AdminContext }
  | { ok: false; response: Response };

export async function requireAdmin(req: Request): Promise<AdminCheckResult> {
  const token = getSessionTokenFromRequest(req);
  if (!token) {
    return {
      ok: false,
      response: json(
        req,
        { authenticated: false, admin: false, message: "Faça login para continuar." },
        401,
      ),
    };
  }

  const session = await findActiveSessionByToken(token);
  if (!session) {
    return {
      ok: false,
      response: json(
        req,
        { authenticated: false, admin: false, message: "Sessão expirada. Faça login novamente." },
        401,
      ),
    };
  }

  const db = admin();
  const { data: profile, error: profErr } = await db
    .from("customer_profiles")
    .select("id, shopify_customer_id, email, first_name, last_name, display_name, phone")
    .eq("id", session.customer_profile_id)
    .single();
  if (profErr || !profile) {
    return {
      ok: false,
      response: json(
        req,
        { authenticated: false, admin: false, message: "Perfil não encontrado." },
        401,
      ),
    };
  }

  // Look up admin row by customer_profile_id, then fall back to email.
  let adminRow: Record<string, unknown> | null = null;

  try {
    const { data, error } = await db
      .from("admin_users")
      .select("*")
      .eq("customer_profile_id", profile.id)
      .maybeSingle();
    if (!error && data) adminRow = data as Record<string, unknown>;
    if (error && !isMissingColumnError(error)) {
      // Table missing or other unexpected error -> bubble below
      if (isMissingRelationError(error)) {
        return {
          ok: false,
          response: json(
            req,
            {
              authenticated: true,
              admin: false,
              message:
                "Tabela admin_users ausente no banco. Consulte o README para o SQL necessário.",
            },
            500,
          ),
        };
      }
    }
  } catch (_e) {
    /* swallow and try email fallback */
  }

  if (!adminRow && profile.email) {
    try {
      const { data, error } = await db
        .from("admin_users")
        .select("*")
        .eq("email", profile.email)
        .maybeSingle();
      if (!error && data) adminRow = data as Record<string, unknown>;
    } catch (_e) {
      /* ignore */
    }
  }

  if (!adminRow) {
    return {
      ok: false,
      response: json(
        req,
        {
          authenticated: true,
          admin: false,
          message: "Acesso não autorizado.",
        },
        403,
      ),
    };
  }

  if (!isAdminRowActive(adminRow)) {
    return {
      ok: false,
      response: json(
        req,
        {
          authenticated: true,
          admin: false,
          message: "Acesso administrativo desativado.",
        },
        403,
      ),
    };
  }

  const role =
    (typeof adminRow.role === "string" && adminRow.role.trim()) || "admin";

  const displayName =
    profile.display_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email ||
    "Admin";

  return {
    ok: true,
    ctx: {
      customer: {
        id: profile.id,
        shopify_customer_id: profile.shopify_customer_id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        phone: profile.phone,
      },
      adminRow,
      role,
      displayName,
    },
  };
}

function isAdminRowActive(row: Record<string, unknown>): boolean {
  if ("is_active" in row && typeof row.is_active === "boolean") return row.is_active;
  if ("active" in row && typeof row.active === "boolean") return row.active;
  if ("status" in row && typeof row.status === "string") {
    const s = row.status.toLowerCase();
    return s === "active" || s === "enabled" || s === "ativo";
  }
  return true; // default to active if no flag column exists
}

function isMissingColumnError(error: { message?: string; code?: string }): boolean {
  const msg = (error?.message || "").toLowerCase();
  return error?.code === "42703" || msg.includes("column") && msg.includes("does not exist");
}

function isMissingRelationError(error: { message?: string; code?: string }): boolean {
  const msg = (error?.message || "").toLowerCase();
  return error?.code === "42P01" || msg.includes("relation") && msg.includes("does not exist");
}
