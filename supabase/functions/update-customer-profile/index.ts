// update-customer-profile: updates first/last name via Shopify customerUpdate, then caches in Supabase.

import { json, preflight } from "../_shared/cors.ts";
import { withCustomerSession } from "../_shared/authGuard.ts";
import { customerAccountGraphQL } from "../_shared/customerAccountGql.ts";
import { admin } from "../_shared/supabase.ts";

const MUTATION = `
  mutation CustomerUpdate($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        firstName
        lastName
        displayName
        emailAddress { emailAddress }
      }
      userErrors { field message code }
    }
  }
`;

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/\s+/g, " ");
  if (!t) return null;
  if (t.length > 80) return t.slice(0, 80);
  return t;
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return json(req, { success: false, error: "method_not_allowed" }, 405);

  return withCustomerSession(req, async ({ customerProfileId }) => {
    const body = await req.json().catch(() => ({}));
    const firstName = clean(body?.firstName);
    const lastName = clean(body?.lastName);

    const input: Record<string, string> = {};
    if (firstName !== null) input.firstName = firstName;
    if (lastName !== null) input.lastName = lastName;
    if (Object.keys(input).length === 0) {
      return json(req, { success: false, error: "no_fields" }, 400);
    }

    const data = await customerAccountGraphQL<any>(customerProfileId, MUTATION, { input });
    const result = data?.customerUpdate;
    const errs = result?.userErrors ?? [];
    if (errs.length > 0) {
      return json(req, { success: false, error: "validation_failed", userErrors: errs }, 400);
    }
    const c = result?.customer;
    if (!c) return json(req, { success: false, error: "update_failed" }, 500);

    // Cache to Supabase
    try {
      await admin()
        .from("customer_profiles")
        .update({
          first_name: c.firstName ?? null,
          last_name: c.lastName ?? null,
          display_name: c.displayName ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerProfileId);
    } catch (e) {
      console.warn("[update-customer-profile] cache update failed:", (e as Error)?.message);
    }

    return json(req, {
      success: true,
      customer: {
        id: c.id,
        firstName: c.firstName ?? null,
        lastName: c.lastName ?? null,
        displayName: c.displayName ?? null,
        email: c.emailAddress?.emailAddress ?? null,
      },
    });
  });
});
