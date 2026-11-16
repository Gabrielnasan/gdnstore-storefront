// create-review-media-upload-url: signed upload URL for review media in
// the private `product-review-media` bucket.

import { json, preflight } from "../_shared/cors.ts";
import { findActiveSessionByToken, getSessionTokenFromRequest } from "../_shared/session.ts";
import { admin } from "../_shared/supabase.ts";

const BUCKET = "product-review-media";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;
  if (req.method !== "POST") {
    return json(req, { success: false, error: "method_not_allowed" }, 405);
  }
  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) return json(req, { success: false, error: "not_authenticated", needs_login: true }, 401);
    const session = await findActiveSessionByToken(token);
    if (!session) return json(req, { success: false, error: "invalid_session", needs_login: true }, 401);

    const body = await req.json().catch(() => ({}));
    const mimeType = String(body?.mime_type ?? "").toLowerCase();
    const fileName = String(body?.file_name ?? "file").slice(0, 200);
    const fileSize = Number(body?.file_size ?? 0);

    let mediaType: "image" | "video" | null = null;
    let ext: string | null = null;
    if (mimeType in IMAGE_TYPES) {
      mediaType = "image";
      ext = IMAGE_TYPES[mimeType];
    } else if (mimeType in VIDEO_TYPES) {
      mediaType = "video";
      ext = VIDEO_TYPES[mimeType];
    } else {
      return json(req, { success: false, error: "unsupported_media_type" }, 400);
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return json(req, { success: false, error: "invalid_file_size" }, 400);
    }
    const maxBytes = mediaType === "image" ? MAX_IMAGE : MAX_VIDEO;
    if (fileSize > maxBytes) {
      return json(req, { success: false, error: "file_too_large" }, 400);
    }

    const id = crypto.randomUUID();
    const storagePath = `reviews/${session.customer_profile_id}/${id}.${ext}`;

    const db = admin();
    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(storagePath);
    if (error || !data) {
      console.error("[create-review-media-upload-url] storage error:", error?.message);
      return json(req, { success: false, error: "signed_url_failed", detail: error?.message }, 500);
    }

    return json(req, {
      success: true,
      bucket: BUCKET,
      storage_path: storagePath,
      signed_url: data.signedUrl,
      token: data.token,
      media_type: mediaType,
      file_name: fileName,
      mime_type: mimeType,
    });
  } catch (e) {
    console.error("[create-review-media-upload-url] error:", (e as Error)?.message);
    return json(req, { success: false, error: "internal_error" }, 500);
  }
});
