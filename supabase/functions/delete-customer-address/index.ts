// delete-customer-address: deletes address via Shopify customerAddressDelete.

import { json, preflight } from "../_shared/cors.ts";
import { withCustomerSession } from "../_shared/authGuard.ts";
import { customerAccountGraphQL } from "../_shared/customerAccountGql.ts";

const MUTATION = `
  mutation CustomerAddressDelete($addressId: ID!) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors { field message code }
    }
  }
`;

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") return json(req, { success: false, error: "method_not_allowed" }, 405);

  return withCustomerSession(req, async ({ customerProfileId }) => {
    const body = await req.json().catch(() => ({}));
    const addressId = typeof body?.addressId === "string" ? body.addressId.trim() : "";
    if (!addressId) return json(req, { success: false, error: "missing_address_id" }, 400);

    const data = await customerAccountGraphQL<any>(customerProfileId, MUTATION, { addressId });
    const result = data?.customerAddressDelete;
    const errs = result?.userErrors ?? [];
    if (errs.length > 0) {
      return json(req, { success: false, error: "shopify_validation", userErrors: errs }, 400);
    }
    return json(req, { success: true, deletedAddressId: result?.deletedAddressId ?? addressId });
  });
});
