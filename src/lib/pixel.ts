declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type PixelParams = {
  content_ids?: string[];
  content_type?: "product";
  content_name?: string;
  value?: number;
  currency?: string;
  contents?: Array<{ id: string; quantity: number }>;
};

export const track = (event: string, params?: PixelParams) => {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params);
};

export const trackPageView = () => track("PageView");

/**
 * Extrai o ID numérico da variante Shopify.
 * "gid://shopify/ProductVariant/43454775427162" -> "43454775427162"
 * Retorna null quando não há ID numérico (nunca usar handle/slug como fallback).
 */
export const toNumericId = (id?: string | null): string | null => {
  if (!id) return null;
  const match = String(id).match(/(\d+)\s*$/);
  return match ? match[1] : null;
};

export {};
