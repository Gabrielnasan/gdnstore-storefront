// Crypto helpers for PKCE, hashing, and AES-GCM encryption of secrets at rest.

import { requireEnv } from "./env.ts";

const enc = new TextEncoder();
const dec = new TextDecoder();

export function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function b64urlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const s = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

export function randomToken(bytes = 32): string {
  return b64urlEncode(randomBytes(bytes));
}

export async function sha256Hex(input: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Base64Url(input: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return b64urlEncode(hash);
}

// PKCE per RFC 7636. Verifier: 43-128 chars unreserved. Use 32 random bytes -> 43 char b64url.
export function generatePkceVerifier(): string {
  return b64urlEncode(randomBytes(32));
}

export async function pkceChallengeS256(verifier: string): Promise<string> {
  return await sha256Base64Url(verifier);
}

// AES-GCM key derivation: SHA-256(TOKEN_ENCRYPTION_SECRET) -> 256-bit key.
let cachedKey: CryptoKey | null = null;
async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const secret = requireEnv("TOKEN_ENCRYPTION_SECRET");
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  cachedKey = await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
  return cachedKey;
}

// Returns compact "v1.<iv_b64url>.<cipher_b64url>"
export async function encryptString(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  return `v1.${b64urlEncode(iv)}.${b64urlEncode(ct)}`;
}

export async function decryptString(payload: string): Promise<string> {
  const parts = payload.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") throw new Error("Invalid ciphertext format");
  const iv = b64urlDecode(parts[1]);
  const ct = b64urlDecode(parts[2]);
  const key = await getKey();
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(pt);
}
