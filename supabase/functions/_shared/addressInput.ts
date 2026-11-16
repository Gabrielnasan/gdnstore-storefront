// Shared normalization + validation for Shopify CustomerAddressInput (Brazil-friendly).

export type AddressInput = {
  firstName: string;
  lastName: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  zoneCode: string;
  territoryCode: string;
  zip: string;
  phoneNumber: string;
};

function s(v: unknown, max = 255): string {
  if (typeof v !== "string") return "";
  const t = v.trim().replace(/\s+/g, " ");
  return t.length > max ? t.slice(0, max) : t;
}

function opt(v: unknown, max = 255): string | null {
  const t = s(v, max);
  return t || null;
}

export function normalizeAddressInput(body: any): AddressInput {
  return {
    firstName: s(body?.firstName, 80),
    lastName: s(body?.lastName, 80),
    company: opt(body?.company, 80),
    address1: s(body?.address1, 255),
    address2: opt(body?.address2, 255),
    city: s(body?.city, 80),
    zoneCode: s(body?.zoneCode, 8).toUpperCase(),
    territoryCode: (s(body?.territoryCode, 4) || "BR").toUpperCase(),
    zip: s(body?.zip, 20),
    phoneNumber: s(body?.phoneNumber, 30),
  };
}

export function validateAddress(a: AddressInput): string | null {
  if (!a.firstName) return "firstName_required";
  if (!a.lastName) return "lastName_required";
  if (!a.address1) return "address1_required";
  if (!a.city) return "city_required";
  if (!a.zoneCode) return "zoneCode_required";
  if (!a.territoryCode) return "territoryCode_required";
  if (!a.zip) return "zip_required";
  if (!a.phoneNumber) return "phoneNumber_required";
  return null;
}
