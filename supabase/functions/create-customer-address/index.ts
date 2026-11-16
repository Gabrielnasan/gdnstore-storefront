// create-customer-address: creates an address via Shopify customerAddressCreate.

import { json, preflight } from "../_shared/cors.ts";
import { withCustomerSession } from "../_shared/authGuard.ts";
import { customerAccountGraphQL } from "../_shared/customerAccountGql.ts";
import { normalizeAddressInput, validateAddress } from "../_shared/addressInput.ts";

const MUTATION = `
  mutation CustomerAddressCreate($address: CustomerAddressInput!, $defaultAddress: Boolean) {
    customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
      customerAddress {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        zoneCode
        territoryCode
        zip
        phoneNumber
      }
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
    const address = normalizeAddressInput(body);
    const err = validateAddress(address);
    if (err) return json(req, { success: false, error: "validation_failed", message: err }, 400);

    const defaultAddress = body?.defaultAddress === true;
    const data = await customerAccountGraphQL<any>(customerProfileId, MUTATION, {
      address,
      defaultAddress,
    });
    const result = data?.customerAddressCreate;
    const errs = result?.userErrors ?? [];
    if (errs.length > 0) {
      return json(req, { success: false, error: "shopify_validation", userErrors: errs }, 400);
    }
    return json(req, { success: true, address: result?.customerAddress ?? null });
  });
});
