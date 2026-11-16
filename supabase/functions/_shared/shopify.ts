// Shopify Customer Account API helpers.

import { requireEnv } from "./env.ts";

type DiscoveryDoc = {
  graphql_api?: string;
  graphql_endpoint?: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
};

let cachedDiscovery: { url: string; doc: DiscoveryDoc; at: number } | null = null;
const DISCOVERY_TTL_MS = 10 * 60 * 1000;

export async function discoverCustomerAccountApi(): Promise<DiscoveryDoc> {
  const base = requireEnv("SHOPIFY_CUSTOMER_ACCOUNT_API_BASE").replace(/\/+$/, "");
  const url = `${base}/.well-known/customer-account-api`;
  if (cachedDiscovery && cachedDiscovery.url === url && Date.now() - cachedDiscovery.at < DISCOVERY_TTL_MS) {
    return cachedDiscovery.doc;
  }
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Discovery failed: ${res.status}`);
  const doc = (await res.json()) as DiscoveryDoc;
  cachedDiscovery = { url, doc, at: Date.now() };
  return doc;
}

export type ShopifyCustomer = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  emailAddress?: { emailAddress?: string | null } | null;
  phoneNumber?: { phoneNumber?: string | null } | null;
};

const CUSTOMER_QUERY = `
  query CurrentCustomer {
    customer {
      id
      firstName
      lastName
      displayName
      emailAddress { emailAddress }
      phoneNumber { phoneNumber }
    }
  }
`;

async function customerAccountFetch(accessToken: string, query: string, variables?: Record<string, unknown>) {
  const doc = await discoverCustomerAccountApi();
  const endpoint = doc.graphql_api || doc.graphql_endpoint;
  if (!endpoint) throw new Error("Customer Account API graphql endpoint not found in discovery");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": accessToken, // Customer Account API expects raw token, not Bearer
    },
    body: JSON.stringify({ query, variables }),
  });
  return res;
}

export async function fetchCurrentCustomer(accessToken: string): Promise<ShopifyCustomer> {
  const res = await customerAccountFetch(accessToken, CUSTOMER_QUERY);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Customer query failed: ${res.status} ${body}`);
  }
  const payload = await res.json();
  if (payload.errors) throw new Error(`GraphQL error: ${JSON.stringify(payload.errors)}`);
  const c = payload.data?.customer as ShopifyCustomer | null | undefined;
  if (!c) throw new Error("No customer returned");
  return c;
}

// ---------- Orders ----------

const ORDERS_QUERY = `
  query CustomerOrders($first: Int = 10) {
    customer {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            name
            processedAt
            financialStatus
            fulfillmentStatus
            totalPrice { amount currencyCode }
            shippingAddress {
              name
              address1
              address2
              city
              province
              zip
              country
            }
            lineItems(first: 20) {
              edges {
                node {
                  title
                  quantity
                  variantTitle
                  image { url altText }
                  price { amount currencyCode }
                }
              }
            }
            fulfillments(first: 10) {
              edges {
                node {
                  status
                }
              }
            }
          }
        }
      }
    }
  }
`;

export type NormalizedMoney = { amount: string; currencyCode: string } | null;
export type NormalizedOrder = {
  id: string;
  name: string;
  processedAt: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: NormalizedMoney;
  subtotalPrice: NormalizedMoney;
  totalShippingPrice: NormalizedMoney;
  lineItems: Array<{
    title: string;
    quantity: number;
    variantTitle: string | null;
    imageUrl: string | null;
    productId: string | null;
    variantId: string | null;
    price: NormalizedMoney;
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

export class ShopifyUnauthorizedError extends Error {
  constructor(message = "shopify_unauthorized") {
    super(message);
    this.name = "ShopifyUnauthorizedError";
  }
}

export async function fetchCustomerOrders(accessToken: string, first = 25): Promise<NormalizedOrder[]> {
  const res = await customerAccountFetch(accessToken, ORDERS_QUERY, { first });
  if (res.status === 401 || res.status === 403) {
    throw new ShopifyUnauthorizedError();
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Orders query failed: ${res.status} ${body}`);
  }
  const payload = await res.json();
  if (payload.errors) {
    const msg = JSON.stringify(payload.errors);
    if (/unauthorized|access denied|invalid.*token/i.test(msg)) {
      throw new ShopifyUnauthorizedError();
    }
    throw new Error(`GraphQL error: ${msg}`);
  }
  const edges = payload.data?.customer?.orders?.edges ?? [];
  return edges.map((e: any) => {
    const n = e.node ?? {};
    return {
      id: n.id ?? "",
      name: n.name ?? "",
      processedAt: n.processedAt ?? null,
      financialStatus: n.financialStatus ?? null,
      fulfillmentStatus: n.fulfillmentStatus ?? null,
      totalPrice: n.totalPrice ?? null,
      subtotalPrice: null,
      totalShippingPrice: null,
      lineItems: (n.lineItems?.edges ?? []).map((le: any) => {
        const ln = le.node ?? {};
        return {
          title: ln.title ?? "",
          quantity: ln.quantity ?? 0,
          variantTitle: ln.variantTitle ?? null,
          imageUrl: ln.image?.url ?? null,
          productId: null,
          variantId: null,
          price: ln.price ?? null,
        };
      }),
      shippingAddress: n.shippingAddress
        ? {
            name: n.shippingAddress.name ?? null,
            address1: n.shippingAddress.address1 ?? null,
            address2: n.shippingAddress.address2 ?? null,
            city: n.shippingAddress.city ?? null,
            province: n.shippingAddress.province ?? null,
            zip: n.shippingAddress.zip ?? null,
            country: n.shippingAddress.country ?? null,
          }
        : null,
      fulfillments: (n.fulfillments?.edges ?? []).map((fe: any) => {
        const fn = fe.node ?? {};
        return {
          status: fn.status ?? null,
          trackingInfo: [],
        };
      }),
    } as NormalizedOrder;
  });
}

// ---------- Token refresh ----------

export type RefreshedToken = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

export async function refreshCustomerAccountToken(refreshToken: string): Promise<RefreshedToken> {
  const tokenEndpoint = requireEnv("SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_ENDPOINT");
  const clientId = requireEnv("SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "accept": "application/json",
    },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new ShopifyUnauthorizedError(`refresh_failed_${res.status}`);
  }
  return (await res.json()) as RefreshedToken;
}
