// get-customer-account-details: returns customer profile + addresses from Shopify Customer Account API.

import { json, preflight } from "../_shared/cors.ts";
import { withCustomerSession } from "../_shared/authGuard.ts";
import { customerAccountGraphQL } from "../_shared/customerAccountGql.ts";

const QUERY = `
  query CustomerAccountDetails {
    customer {
      id
      firstName
      lastName
      displayName
      emailAddress { emailAddress }
      phoneNumber { phoneNumber }
      defaultAddress { id }
      addresses(first: 25) {
        edges {
          node {
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
            formatted
          }
        }
      }
    }
  }
`;

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "GET" && req.method !== "POST") {
    return json(req, { success: false, error: "method_not_allowed" }, 405);
  }

  return withCustomerSession(req, async ({ customerProfileId }) => {
    const data = await customerAccountGraphQL<any>(customerProfileId, QUERY);
    const c = data?.customer;
    if (!c) return json(req, { success: false, error: "no_customer" }, 404);

    const defaultId: string | null = c.defaultAddress?.id ?? null;
    const addresses = (c.addresses?.edges ?? []).map((e: any) => {
      const n = e.node ?? {};
      return {
        id: n.id ?? null,
        firstName: n.firstName ?? null,
        lastName: n.lastName ?? null,
        company: n.company ?? null,
        address1: n.address1 ?? null,
        address2: n.address2 ?? null,
        city: n.city ?? null,
        province: n.zoneCode ?? null,
        zoneCode: n.zoneCode ?? null,
        country: n.territoryCode ?? null,
        territoryCode: n.territoryCode ?? null,
        zip: n.zip ?? null,
        phoneNumber: n.phoneNumber ?? null,
        formatted: n.formatted ?? null,
        isDefault: defaultId !== null && n.id === defaultId,
      };
    });

    return json(req, {
      success: true,
      customer: {
        id: c.id ?? null,
        firstName: c.firstName ?? null,
        lastName: c.lastName ?? null,
        displayName: c.displayName ?? null,
        email: c.emailAddress?.emailAddress ?? null,
        phone: c.phoneNumber?.phoneNumber ?? null,
      },
      addresses,
    });
  });
});
