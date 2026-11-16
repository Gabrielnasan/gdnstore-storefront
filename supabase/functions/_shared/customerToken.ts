// Shared helper to obtain a (possibly refreshed) Shopify Customer Account access token
// for a given local customer profile.

import { admin } from "./supabase.ts";
import { decryptString, encryptString } from "./crypto.ts";
import { refreshCustomerAccountToken, ShopifyUnauthorizedError } from "./shopify.ts";

export async function getShopifyAccessToken(
  customerProfileId: string,
): Promise<string> {
  const db = admin();
  const { data, error } = await db
    .from("customer_shopify_tokens")
    .select(
      "access_token_encrypted, refresh_token_encrypted, access_token_expires_at",
    )
    .eq("customer_profile_id", customerProfileId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ShopifyUnauthorizedError("no_shopify_token");

  let accessToken = await decryptString(data.access_token_encrypted as string);
  const refreshEnc = data.refresh_token_encrypted as string | null;
  const expiresAt = data.access_token_expires_at
    ? new Date(data.access_token_expires_at as string).getTime()
    : null;

  if (expiresAt !== null && expiresAt - Date.now() < 60_000 && refreshEnc) {
    try {
      accessToken = await refreshAndStore(customerProfileId, refreshEnc);
    } catch (e) {
      if (e instanceof ShopifyUnauthorizedError) throw e;
      throw e;
    }
  }
  return accessToken;
}

export async function refreshAndStore(
  customerProfileId: string,
  refreshTokenEnc: string,
): Promise<string> {
  const refreshToken = await decryptString(refreshTokenEnc);
  const refreshed = await refreshCustomerAccountToken(refreshToken);
  const accessExpiresAt = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    : null;
  const update: Record<string, unknown> = {
    access_token_encrypted: await encryptString(refreshed.access_token),
    access_token_expires_at: accessExpiresAt,
    scope: refreshed.scope ?? null,
    updated_at: new Date().toISOString(),
  };
  if (refreshed.refresh_token) {
    update.refresh_token_encrypted = await encryptString(refreshed.refresh_token);
  }
  const { error } = await admin()
    .from("customer_shopify_tokens")
    .update(update)
    .eq("customer_profile_id", customerProfileId);
  if (error) throw error;
  return refreshed.access_token;
}
