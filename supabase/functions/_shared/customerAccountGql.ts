// Generic Customer Account API GraphQL helper with one automatic refresh-on-401 retry.

import { discoverCustomerAccountApi, ShopifyUnauthorizedError } from "./shopify.ts";
import { getShopifyAccessToken } from "./customerToken.ts";

export async function customerAccountGraphQL<T = any>(
  customerProfileId: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const accessToken = await getShopifyAccessToken(customerProfileId);
  const doc = await discoverCustomerAccountApi();
  const endpoint = doc.graphql_api || doc.graphql_endpoint;
  if (!endpoint) throw new Error("Customer Account API graphql endpoint not found");

  const exec = async (token: string) => {
    return await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: token, // raw token, not Bearer
      },
      body: JSON.stringify({ query, variables }),
    });
  };

  let res = await exec(accessToken);
  if (res.status === 401 || res.status === 403) {
    throw new ShopifyUnauthorizedError();
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GraphQL HTTP ${res.status}: ${body}`);
  }
  const payload = await res.json();
  if (payload.errors) {
    const msg = JSON.stringify(payload.errors);
    if (/unauthorized|access denied|invalid.*token/i.test(msg)) {
      throw new ShopifyUnauthorizedError();
    }
    throw new Error(`GraphQL error: ${msg}`);
  }
  return payload.data as T;
}
