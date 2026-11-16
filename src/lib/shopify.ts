// Shopify Storefront API client
export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN: string = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN ?? "";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN: string = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN ?? "";

export interface Money { amount: string; currencyCode: string }
export interface ShopifyImage { url: string; altText: string | null }
export interface ShopifyVariant {
  id: string;
  title: string;
  sku?: string | null;
  price: Money;
  compareAtPrice?: Money | null;
  availableForSale: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
}
export interface ShopifyProductNode {
  id: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  handle: string;
  vendor: string;
  productType: string;
  tags: string[];
  priceRange: { minVariantPrice: Money };
  compareAtPriceRange?: { minVariantPrice: Money };
  images: { edges: Array<{ node: ShopifyImage }> };
  variants: { edges: Array<{ node: ShopifyVariant }> };
  options: Array<{ name: string; values: string[] }>;
}
export interface ShopifyProduct { node: ShopifyProductNode }

export async function storefrontApiRequest<T = any>(query: string, variables: any = {}): Promise<{ data: T } | undefined> {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    console.error("Shopify billing required");
    return;
  }
  if (!response.ok) throw new Error(`Shopify HTTP ${response.status}`);
  const data = await response.json();
  if (data.errors) throw new Error(`Shopify error: ${data.errors.map((e: any) => e.message).join(", ")}`);
  return data;
}

export const PRODUCT_FRAGMENT = `
  id
  title
  description
  descriptionHtml
  handle
  vendor
  productType
  tags
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
  images(first: 8) { edges { node { url altText } } }
  variants(first: 20) {
    edges {
      node {
        id title sku availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        selectedOptions { name value }
      }
    }
  }
  options { name values }
`;

export const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query, sortKey: BEST_SELLING) {
      edges { node { ${PRODUCT_FRAGMENT} } }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) { ${PRODUCT_FRAGMENT} }
  }
`;

export const COLLECTIONS_QUERY = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges { node { id title handle image { url altText } } }
    }
  }
`;

export async function fetchProducts(first = 24, query?: string): Promise<ShopifyProduct[]> {
  const res = await storefrontApiRequest<{ products: { edges: ShopifyProduct[] } }>(PRODUCTS_QUERY, { first, query });
  return res?.data?.products?.edges ?? [];
}

export async function fetchProductByHandle(handle: string): Promise<ShopifyProductNode | null> {
  const res = await storefrontApiRequest<{ product: ShopifyProductNode | null }>(PRODUCT_BY_HANDLE_QUERY, { handle });
  return res?.data?.product ?? null;
}

export function formatBRL(amount: string | number, currency = "BRL") {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(n);
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
}


export function installments(amount: string | number, max = 6) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return { count: max, value: n / max };
}

// ============= Product display helpers =============

/**
 * Remove a marca duplicada do início do título quando o vendor já vai ser
 * exibido em outro campo. Ex.: vendor="Apple" + title="Apple MacBook Air"
 * -> "MacBook Air". Case-insensitive, tolerante a espaços/hífens.
 */
export function stripVendorFromTitle(title: string, vendor?: string | null): string {
  if (!title) return title;
  if (!vendor) return title;
  const v = vendor.trim();
  if (!v) return title;
  // Remove uma ou mais ocorrências consecutivas do vendor no início do título
  const re = new RegExp(`^(?:\\s*${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[\\s\\-–:]*)+`, "i");
  const cleaned = title.replace(re, "").trim();
  return cleaned.length > 0 ? cleaned : title;
}

/** Produto tem pelo menos uma imagem utilizável. */
export function hasUsableImage(node: { images: { edges: Array<{ node: ShopifyImage }> } }): boolean {
  const url = node.images?.edges?.[0]?.node?.url;
  return typeof url === "string" && url.length > 0;
}

/** Alguma variante disponível para venda. */
export function isProductAvailable(node: { variants: { edges: Array<{ node: { availableForSale: boolean } }> } }): boolean {
  return node.variants?.edges?.some((v) => v.node.availableForSale) ?? false;
}

// ============= WhatsApp (atendimento) =============
export const WHATSAPP_DIGITS = "5500000000000";
export const WHATSAPP_DISPLAY = "(00) 00000-0000";

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_DIGITS}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function whatsappProductInquiryUrl(product: { title: string; handle: string; vendor?: string }): string {
  const title = stripVendorFromTitle(product.title, product.vendor);
  const brand = product.vendor ? `${product.vendor} ` : "";
  const msg = `Olá! Gostaria de consultar disponibilidade do produto ${brand}${title}. (https://gdnstore.com.br/product/${product.handle})`;
  return whatsappUrl(msg);
}

// ============= SHOP PAGES & POLICIES (dynamic footer) =============
export interface ShopLink { title: string; url: string }

const SHOP_LINKS_QUERY = `
  query ShopLinks {
    shop {
      name
      primaryDomain { url }
      privacyPolicy { title url }
      refundPolicy { title url }
      shippingPolicy { title url }
      termsOfService { title url }
      subscriptionPolicy { title url: id }
    }
    pages(first: 25) {
      edges { node { title handle onlineStoreUrl } }
    }
  }
`;

export interface ShopLinksData {
  policies: ShopLink[];
  pages: Array<{ title: string; handle: string; url: string }>;
  shopDomain: string;
}

export async function fetchShopLinks(): Promise<ShopLinksData> {
  const res = await storefrontApiRequest<any>(SHOP_LINKS_QUERY, {});
  const shop = res?.data?.shop;
  const domain: string = shop?.primaryDomain?.url ?? `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}`;
  const policies: ShopLink[] = [];
  for (const key of ["privacyPolicy", "refundPolicy", "shippingPolicy", "termsOfService"] as const) {
    const p = shop?.[key];
    if (p?.url && p?.title) policies.push({ title: p.title, url: p.url });
  }
  const pages = (res?.data?.pages?.edges ?? [])
    .map((e: any) => e.node)
    .filter((n: any) => !!n?.handle)
    .map((n: any) => ({
      title: n.title,
      handle: n.handle,
      url: n.onlineStoreUrl ?? `${domain}/pages/${n.handle}`,
    }));
  return { policies, pages, shopDomain: domain };
}

// ============= CUSTOMER AUTH (Storefront API) =============
export interface CustomerAccessToken { accessToken: string; expiresAt: string }
export interface ShopifyCustomer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  acceptsMarketing?: boolean;
  createdAt?: string;
  orders?: { edges: Array<{ node: { id: string; orderNumber: number; processedAt: string; totalPrice: Money; statusUrl: string; financialStatus: string | null; fulfillmentStatus: string | null } }> };
}

const CUSTOMER_CREATE = `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer { id email firstName lastName }
      customerUserErrors { code field message }
    }
  }
`;

const CUSTOMER_TOKEN_CREATE = `
  mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken { accessToken expiresAt }
      customerUserErrors { code field message }
    }
  }
`;

const CUSTOMER_TOKEN_DELETE = `
  mutation customerAccessTokenDelete($customerAccessToken: String!) {
    customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
      deletedAccessToken
      userErrors { field message }
    }
  }
`;

const CUSTOMER_QUERY = `
  query customer($token: String!) {
    customer(customerAccessToken: $token) {
      id email firstName lastName phone displayName acceptsMarketing createdAt
      orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
        edges { node {
          id orderNumber processedAt statusUrl financialStatus fulfillmentStatus
          totalPrice { amount currencyCode }
        } }
      }
    }
  }
`;

const CUSTOMER_RECOVER = `
  mutation customerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors { code field message }
    }
  }
`;

export async function customerLogin(email: string, password: string) {
  try {
    const res = await storefrontApiRequest<any>(CUSTOMER_TOKEN_CREATE, { input: { email, password } });
    const data = res?.data?.customerAccessTokenCreate;
    const errs = data?.customerUserErrors ?? [];
    if (errs.length || !data?.customerAccessToken) {
      throw new Error(errs[0]?.message ?? "Não foi possível entrar. Verifique suas credenciais.");
    }
    return data.customerAccessToken as CustomerAccessToken;
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (/access denied|unauthenticated_write_customers|access scope/i.test(msg)) {
      throw new ShopifyScopeError(
        "Login indisponível neste momento. Você será direcionado para a página oficial da loja para entrar com segurança.",
        shopifyAccountLoginUrl()
      );
    }
    throw e;
  }
}

export class ShopifyScopeError extends Error {
  hostedUrl: string;
  constructor(message: string, hostedUrl: string) {
    super(message);
    this.name = "ShopifyScopeError";
    this.hostedUrl = hostedUrl;
  }
}

export function shopifyAccountRegisterUrl() {
  return `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/account/register`;
}
export function shopifyAccountLoginUrl() {
  return `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/account/login`;
}

export async function customerRegister(input: { email: string; password: string; firstName?: string; lastName?: string; acceptsMarketing?: boolean }) {
  try {
    const res = await storefrontApiRequest<any>(CUSTOMER_CREATE, { input });
    const data = res?.data?.customerCreate;
    const errs = data?.customerUserErrors ?? [];
    if (errs.length) throw new Error(errs[0]?.message ?? "Não foi possível criar a conta.");
    return data?.customer as { id: string; email: string };
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (/access denied|unauthenticated_write_customers|access scope/i.test(msg)) {
      throw new ShopifyScopeError(
        "Cadastro indisponível neste momento. Você será direcionado para a página oficial da loja para concluir o cadastro.",
        shopifyAccountRegisterUrl()
      );
    }
    throw e;
  }
}

export async function customerLogout(token: string) {
  try { await storefrontApiRequest<any>(CUSTOMER_TOKEN_DELETE, { customerAccessToken: token }); } catch {}
}

export async function fetchCustomer(token: string): Promise<ShopifyCustomer | null> {
  const res = await storefrontApiRequest<any>(CUSTOMER_QUERY, { token });
  return res?.data?.customer ?? null;
}

export async function customerRecoverPassword(email: string) {
  const res = await storefrontApiRequest<any>(CUSTOMER_RECOVER, { email });
  const errs = res?.data?.customerRecover?.customerUserErrors ?? [];
  if (errs.length) throw new Error(errs[0]?.message ?? "Erro ao enviar e-mail de recuperação.");
}
