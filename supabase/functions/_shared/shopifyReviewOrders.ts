// Shopify Customer Account API helpers specifically for review verification.
// Returns paid orders with product/variant IDs so we can verify purchase eligibility.

import { requireEnv } from "./env.ts";
import { discoverCustomerAccountApi, ShopifyUnauthorizedError } from "./shopify.ts";

export type ReviewOrderLineItem = {
  productId: string | null;
  variantId: string | null;
  title: string;
  variantTitle: string | null;
  imageUrl: string | null;
  quantity: number;
};

export type ReviewOrder = {
  id: string;
  name: string;
  processedAt: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  lineItems: ReviewOrderLineItem[];
};

const ORDERS_FOR_REVIEW_QUERY = `
  query CustomerOrdersForReviewVerification($first: Int = 25) {
    customer {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            name
            processedAt
            financialStatus
            fulfillmentStatus
            lineItems(first: 50) {
              edges {
                node {
                  title
                  quantity
                  variantTitle
                  productId
                  variantId
                  image { url altText }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchCustomerOrdersForReview(
  accessToken: string,
  first = 25,
): Promise<ReviewOrder[]> {
  const _unused = requireEnv("SHOPIFY_CUSTOMER_ACCOUNT_API_BASE");
  void _unused;
  const doc = await discoverCustomerAccountApi();
  const endpoint = doc.graphql_api || doc.graphql_endpoint;
  if (!endpoint) throw new Error("graphql endpoint missing");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: accessToken },
    body: JSON.stringify({ query: ORDERS_FOR_REVIEW_QUERY, variables: { first } }),
  });
  if (res.status === 401 || res.status === 403) throw new ShopifyUnauthorizedError();
  if (!res.ok) throw new Error(`orders query failed: ${res.status}`);
  const payload = await res.json();
  if (payload.errors) {
    const msg = JSON.stringify(payload.errors);
    if (/unauthorized|access denied|invalid.*token/i.test(msg)) {
      throw new ShopifyUnauthorizedError();
    }
    // productId/variantId may not be selectable on some Customer Account API versions —
    // surface the error so caller can retry with a fallback query.
    throw new Error(`graphql error: ${msg}`);
  }
  const edges = payload.data?.customer?.orders?.edges ?? [];
  return edges.map((e: any): ReviewOrder => {
    const n = e.node ?? {};
    return {
      id: n.id ?? "",
      name: n.name ?? "",
      processedAt: n.processedAt ?? null,
      financialStatus: n.financialStatus ?? null,
      fulfillmentStatus: n.fulfillmentStatus ?? null,
      lineItems: (n.lineItems?.edges ?? []).map((le: any) => {
        const ln = le.node ?? {};
        return {
          productId: ln.productId ?? null,
          variantId: ln.variantId ?? null,
          title: ln.title ?? "",
          variantTitle: ln.variantTitle ?? null,
          imageUrl: ln.image?.url ?? null,
          quantity: ln.quantity ?? 0,
        };
      }),
    };
  });
}

export { isPaidOrder } from "./reviewRules.ts";
