// Common session validation wrapper for customer-area edge functions.

import { json } from "./cors.ts";
import { findActiveSessionByToken, getSessionTokenFromRequest } from "./session.ts";
import { ShopifyUnauthorizedError } from "./shopify.ts";

export async function withCustomerSession(
  req: Request,
  handler: (ctx: { customerProfileId: string; req: Request }) => Promise<Response>,
): Promise<Response> {
  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) return json(req, { success: false, error: "not_authenticated", needs_login: true }, 401);
    const session = await findActiveSessionByToken(token);
    if (!session) return json(req, { success: false, error: "invalid_session", needs_login: true }, 401);
    return await handler({ customerProfileId: session.customer_profile_id, req });
  } catch (e) {
    if (e instanceof ShopifyUnauthorizedError) {
      return json(req, { success: false, error: "session_expired", needs_login: true }, 401);
    }
    console.error("[withCustomerSession] error:", (e as Error)?.message);
    return json(req, { success: false, error: "internal_error" }, 500);
  }
}
