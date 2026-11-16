// Customer account (profile + addresses) helpers, talking to Supabase Edge Functions.

import { getCustomerSessionToken } from "./customerSession";

const SUPABASE_FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export type CustomerAccountCustomer = {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  phone: string | null;
};

export type CustomerAccountAddress = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  zoneCode: string | null;
  country: string | null;
  territoryCode: string | null;
  zip: string | null;
  phoneNumber: string | null;
  formatted?: string[] | null;
  isDefault: boolean;
};

export type AddressFormPayload = {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  zoneCode: string;
  territoryCode?: string;
  zip: string;
  phoneNumber: string;
  defaultAddress?: boolean;
};

type ApiResult<T> = { success: true } & T | { success: false; error: string; needs_login?: boolean; userErrors?: Array<{ field?: string[]; message: string }> };

async function call<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const token = getCustomerSessionToken();
  if (!token) return { success: false, error: "not_authenticated", needs_login: true } as ApiResult<T>;
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false) {
      return {
        success: false,
        error: body?.error ?? `http_${res.status}`,
        needs_login: body?.needs_login === true || res.status === 401,
        userErrors: body?.userErrors,
      } as ApiResult<T>;
    }
    return body as ApiResult<T>;
  } catch (e) {
    return { success: false, error: (e as Error).message ?? "network_error" } as ApiResult<T>;
  }
}

export function getCustomerAccountDetails() {
  return call<{ customer: CustomerAccountCustomer; addresses: CustomerAccountAddress[] }>(
    "get-customer-account-details",
    { method: "GET" },
  );
}

export function updateCustomerProfile(input: { firstName: string; lastName: string }) {
  return call<{ customer: CustomerAccountCustomer }>("update-customer-profile", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createCustomerAddress(payload: AddressFormPayload) {
  return call<{ address: CustomerAccountAddress }>("create-customer-address", {
    method: "POST",
    body: JSON.stringify({ ...payload, territoryCode: payload.territoryCode ?? "BR" }),
  });
}

export function updateCustomerAddress(addressId: string, payload: AddressFormPayload) {
  const { defaultAddress, ...address } = payload;
  return call<{ address: CustomerAccountAddress }>("update-customer-address", {
    method: "POST",
    body: JSON.stringify({
      addressId,
      address: { ...address, territoryCode: address.territoryCode ?? "BR" },
      defaultAddress: defaultAddress === true,
    }),
  });
}

export function deleteCustomerAddress(addressId: string) {
  return call<{ deletedAddressId: string }>("delete-customer-address", {
    method: "POST",
    body: JSON.stringify({ addressId }),
  });
}
