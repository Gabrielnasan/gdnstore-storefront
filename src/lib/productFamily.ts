/**
 * Product Family — camada de EXPERIÊNCIA que agrupa produtos Shopify
 * independentes (cada um com seu Product ID / ProductVariant ID / handle /
 * preço / estoque / SKU) como configurações de um mesmo modelo.
 *
 * Princípios:
 *  - A Shopify continua sendo a fonte única da verdade. Nada é inferido de
 *    preço, estoque ou SKU.
 *  - Agrupamento CONSERVADOR: na dúvida, não agrupa (falso negativo é
 *    preferível a falso positivo).
 *  - Resolução de combinação é SEMPRE exata. Nunca há fallback para "o mais
 *    próximo".
 */

import type { ShopifyProductNode, ShopifyVariant } from "@/lib/shopify";

/* ------------------------------------------------------------------ *
 * Dimensões configuráveis suportadas
 * ------------------------------------------------------------------ */

export type AttributeKey = "color" | "ram" | "storage";

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  color: "Cor",
  ram: "Memória RAM",
  storage: "Armazenamento",
};

/** Ordem de exibição dos seletores. */
export const ATTRIBUTE_ORDER: AttributeKey[] = ["color", "ram", "storage"];

export interface ParsedTitle {
  /** Tokens que definem a identidade do modelo (normalizados). */
  modelTokens: string[];
  /** Atributos configuráveis detectados com segurança. */
  attributes: Partial<Record<AttributeKey, string>>;
}

/* ------------------------------------------------------------------ *
 * Normalização
 * ------------------------------------------------------------------ */

export function normalizeToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+.-]/g, "");
}

function titleCaseColor(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("-")
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
        .join("-"),
    )
    .join(" ");
}

/* ------------------------------------------------------------------ *
 * Léxico de cores (base ampla + composição por hífen/duas palavras)
 *
 * Não é uma lista de "produtos" nem de configurações: é apenas vocabulário
 * de cor. Novos nomes compostos ("Laranja-cósmico", "Azul-celeste") são
 * reconhecidos automaticamente porque basta que UMA das partes seja um
 * radical de cor conhecido.
 * ------------------------------------------------------------------ */

const COLOR_ROOTS = new Set(
  [
    // pt-BR
    "preto","preta","branco","branca","cinza","prata","prateado","prateada","dourado","dourada","ouro",
    "azul","azulado","vermelho","vermelha","verde","amarelo","amarela","rosa","roxo","roxa","lilas","violeta",
    "laranja","marrom","bege","creme","grafite","chumbo","bronze","cobre","titanio","natural","estelar",
    "meia","noite","meianoite","ultramarino","ultramarina","petroleo","espacial","cosmico","cosmica","deserto",
    "areia","marfim","perola","champagne","turquesa","ciano","coral","lavanda","menta","jade","safira","obsidiana",
    "onix","vinho","nebulosa","nevoa","fumaca","gelo","celeste","oliva","salmao","terracota","caramelo","mostarda",
    "sombrio","claro","escuro","fosco","brilhante","suave","medianoite","carvao",
    // en
    "black","white","silver","gold","gray","grey","blue","red","green","yellow","pink","purple","orange","brown",
    "beige","cream","graphite","bronze","copper","titanium","midnight","starlight","ultramarine","teal","sage",
    "lavender","mint","ivory","desert","cosmic","space","jet","slate","sky","cloud","mist","charcoal","sand",
    "rose","plum","lime","aqua","navy","pearl","platinum","stone","shadow",
  ].map(normalizeToken),
);

/** Palavras que fazem parte da identidade do modelo e NUNCA são cor. */
const MODEL_RESERVED = new Set(
  [
    "pro","max","ultra","plus","mini","air","lite","se","fe","neo","edge","note","fold","flip","tab","watch",
    "wifi","cellular","5g","4g","lte","gen","geracao","polegadas","pol","usb","usb-c","c","anc","nano","std",
    "m1","m2","m3","m4","m5","a16","a17","a18","a19","s","z","x","e","novo","nova",
  ].map(normalizeToken),
);

function isColorWord(word: string): boolean {
  const n = normalizeToken(word);
  if (!n || MODEL_RESERVED.has(n) || /^\d/.test(n)) return false;
  if (COLOR_ROOTS.has(n)) return true;
  // Composto por hífen: basta um radical conhecido ("laranja-cosmico").
  const parts = n.split("-").filter(Boolean);
  if (parts.length > 1 && parts.some((p) => COLOR_ROOTS.has(p))) return true;
  return false;
}

/* ------------------------------------------------------------------ *
 * Capacidades (RAM x Armazenamento)
 * ------------------------------------------------------------------ */

interface CapacityToken {
  index: number; // índice no array de tokens
  raw: string;
  value: number; // em GB
  label: string; // "256GB", "1TB"
  explicitRam: boolean;
}

const CAPACITY_RE = /^(\d+)\s*(gb|tb|mb)$/i;

function toGb(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === "tb") return value * 1024;
  if (u === "mb") return value / 1024;
  return value;
}

/**
 * Divide o título em tokens, juntando "16 GB" em "16GB".
 */
function tokenize(title: string): string[] {
  const cleaned = title.replace(/[—–|•·/]+/g, " ").replace(/\s+/g, " ").trim();
  const raw = cleaned.split(" ").filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const cur = raw[i];
    const next = raw[i + 1];
    if (/^\d+$/.test(cur) && next && /^(gb|tb|mb)$/i.test(next)) {
      out.push(`${cur}${next.toUpperCase()}`);
      i++;
      continue;
    }
    out.push(cur);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Parser de título
 * ------------------------------------------------------------------ */

export function parseProductTitle(title: string, vendor?: string | null): ParsedTitle {
  const tokens = tokenize(title || "");
  const consumed = new Set<number>();
  const attributes: Partial<Record<AttributeKey, string>> = {};

  // 1) Capacidades
  const capacities: CapacityToken[] = [];
  tokens.forEach((tok, index) => {
    const m = tok.replace(/[.,;:]$/, "").match(CAPACITY_RE);
    if (!m) return;
    const before = normalizeToken(tokens[index - 1] ?? "");
    const after = normalizeToken(tokens[index + 1] ?? "");
    const explicitRam =
      after === "ram" ||
      before === "ram" ||
      after.startsWith("memoria") ||
      before.startsWith("memoria");
    capacities.push({
      index,
      raw: tok,
      value: toGb(parseInt(m[1], 10), m[2]),
      label: `${m[1]}${m[2].toUpperCase()}`,
      explicitRam,
    });
  });

  if (capacities.length === 1) {
    const cap = capacities[0];
    if (cap.explicitRam) attributes.ram = cap.label;
    else attributes.storage = cap.label;
    consumed.add(cap.index);
  } else if (capacities.length >= 2) {
    const explicit = capacities.filter((c) => c.explicitRam);
    let ram: CapacityToken | undefined;
    let storage: CapacityToken | undefined;
    if (explicit.length === 1) {
      ram = explicit[0];
      storage = capacities.filter((c) => c !== ram).slice(-1)[0];
    } else if (explicit.length === 0) {
      // Heurística conservadora: a MENOR capacidade (<= 64GB) que aparece
      // ANTES da maior é RAM; a última/maior é armazenamento.
      const sorted = [...capacities].sort((a, b) => a.value - b.value);
      const smallest = sorted[0];
      const largest = sorted[sorted.length - 1];
      if (smallest !== largest && smallest.value <= 64 && smallest.index < largest.index) {
        ram = smallest;
        storage = largest;
      } else {
        storage = capacities[capacities.length - 1];
      }
    } else {
      // Vários marcadores explícitos: fica só com o último como armazenamento.
      ram = explicit[0];
      storage = capacities.filter((c) => c !== ram).slice(-1)[0];
    }
    if (ram) {
      attributes.ram = ram.label;
      consumed.add(ram.index);
    }
    if (storage) {
      attributes.storage = storage.label;
      consumed.add(storage.index);
    }
  }

  // Remove marcadores textuais "RAM" / "de memória" adjacentes.
  tokens.forEach((tok, i) => {
    const n = normalizeToken(tok);
    if (n !== "ram" && !n.startsWith("memoria") && n !== "de") return;
    const prevCap = capacities.some((c) => c.index === i - 1 && consumed.has(c.index));
    const nextCap = capacities.some((c) => c.index === i + 1 && consumed.has(c.index));
    if (n === "de") {
      const after = normalizeToken(tokens[i + 1] ?? "");
      if (after.startsWith("memoria")) consumed.add(i);
      return;
    }
    if (prevCap || nextCap) consumed.add(i);
  });

  // 2) Cor — sequência de 1 a 2 tokens contíguos reconhecidos como cor.
  //    Só aceitamos tokens do léxico de cor (ou compostos com radical de cor),
  //    para evitar transformar diferenciais de modelo em "cor".
  const colorIdx: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (consumed.has(i)) continue;
    if (!isColorWord(tokens[i])) continue;
    // sequência contígua (ex.: "Titânio Natural", "Preto Espacial")
    const seq = [i];
    if (i + 1 < tokens.length && !consumed.has(i + 1) && isColorWord(tokens[i + 1])) {
      seq.push(i + 1);
    }
    colorIdx.push(...seq);
    break;
  }
  if (colorIdx.length) {
    attributes.color = titleCaseColor(colorIdx.map((i) => tokens[i]).join(" "));
    colorIdx.forEach((i) => consumed.add(i));
  }

  // 3) Modelo = o que sobrou (menos o vendor repetido no início).
  const vendorTokens = (vendor ?? "")
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);
  const modelTokens: string[] = [];
  tokens.forEach((tok, i) => {
    if (consumed.has(i)) return;
    const n = normalizeToken(tok);
    if (!n) return;
    if (modelTokens.length === 0 && vendorTokens.includes(n)) return; // vendor prefixado
    modelTokens.push(n);
  });

  return { modelTokens, attributes };
}

/* ------------------------------------------------------------------ *
 * Overrides manuais (exceções). Vazio por padrão.
 * ------------------------------------------------------------------ */

export interface FamilyOverride {
  /** Chave estável da família (usada no lugar da inferida). */
  key: string;
  /** Nome exibido (opcional). */
  name?: string;
  /** Handles Shopify pertencentes à família. */
  handles: string[];
  /** Atributos forçados por handle, quando o título não permite inferir. */
  attributes?: Record<string, Partial<Record<AttributeKey, string>>>;
}

export const FAMILY_OVERRIDES: FamilyOverride[] = [];

function findOverride(handle: string): FamilyOverride | undefined {
  return FAMILY_OVERRIDES.find((o) => o.handles.includes(handle));
}

/* ------------------------------------------------------------------ *
 * Fingerprint da família
 * ------------------------------------------------------------------ */

export function getFamilyKey(product: {
  title: string;
  handle: string;
  vendor?: string | null;
  productType?: string | null;
}): string {
  const override = findOverride(product.handle);
  if (override) return `override:${override.key}`;
  const parsed = parseProductTitle(product.title, product.vendor);
  const vendor = normalizeToken(product.vendor ?? "");
  const type = normalizeToken(product.productType ?? "");
  return [vendor, type, parsed.modelTokens.join(" ")].join("|");
}

/** Nome base legível da família (modelo, sem cor/capacidade). */
export function getFamilyName(product: { title: string; handle: string; vendor?: string | null }): string {
  const override = findOverride(product.handle);
  if (override?.name) return override.name;
  const parsed = parseProductTitle(product.title, product.vendor);
  const tokens = tokenize(product.title);
  const wanted = new Set(parsed.modelTokens);
  const kept = tokens.filter((t) => wanted.has(normalizeToken(t)));
  return kept.join(" ").trim() || product.title;
}

/* ------------------------------------------------------------------ *
 * Validação comercial (fonte única)
 * ------------------------------------------------------------------ */

/**
 * Status de uma configuração da família.
 *  - AVAILABLE: existe, preço comercial válido e disponível para venda.
 *  - SOLD_OUT:  existe, preço válido, mas sem estoque.
 *  - INVALID:   existe na Shopify, mas sem dados comerciais válidos
 *               (sem variante/ID ou preço ausente/zero/negativo/NaN).
 *  - MISSING:   não existe produto Shopify para a combinação.
 */
export type MemberStatus = "AVAILABLE" | "SOLD_OUT" | "INVALID" | "MISSING";

/**
 * Converte um objeto Money da Shopify em número comercial válido.
 * Retorna null para null/undefined/""/0/"0.00"/NaN/negativo/infinito.
 */
export function parseCommercialPrice(price?: { amount?: string | number | null } | null): number | null {
  if (!price) return null;
  const raw = price.amount;
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function isValidCommercialPrice(price?: { amount?: string | number | null } | null): boolean {
  return parseCommercialPrice(price) !== null;
}

/** Variante utilizável: precisa de ID e preço comercial válido. */
export function isCommerciallyValidVariant(variant?: ShopifyVariant | null): boolean {
  return !!variant && typeof variant.id === "string" && variant.id.length > 0 && isValidCommercialPrice(variant.price);
}

/* ------------------------------------------------------------------ *
 * Família
 * ------------------------------------------------------------------ */

export interface FamilyMember {
  node: ShopifyProductNode;
  variant: ShopifyVariant | null;
  handle: string;
  title: string;
  productId: string;
  variantId: string | null;
  sku: string | null;
  /** Preço comercial válido (número) ou null quando inválido. */
  price: number | null;
  status: MemberStatus;
  /** Passou por isCommerciallyValidMember(). */
  valid: boolean;
  /** Válido comercialmente E com estoque. */
  available: boolean;
  attributes: Partial<Record<AttributeKey, string>>;
}

/**
 * Regra central e única de validade comercial de uma configuração.
 * Produto real + variante real + ID + preço finito > 0.
 */
export function isCommerciallyValidMember(member?: FamilyMember | null): boolean {
  if (!member) return false;
  if (!member.node || !member.productId || !member.handle) return false;
  if (!isCommerciallyValidVariant(member.variant)) return false;
  return member.price !== null;
}

export interface FamilyDimension {
  key: AttributeKey;
  label: string;
  values: string[];
}

export interface ProductFamily {
  key: string;
  name: string;
  vendor: string;
  productType: string;
  members: FamilyMember[];
  dimensions: FamilyDimension[];
  /** Seleção correspondente ao produto atualmente aberto. */
  selection: Partial<Record<AttributeKey, string>>;
  current: FamilyMember;
}

/**
 * Escolhe a variante que representa o produto: prioriza variantes
 * comercialmente válidas e, entre elas, as disponíveis para venda.
 * Nunca inventa preço.
 */
function pickVariant(node: ShopifyProductNode): ShopifyVariant | null {
  const variants = (node.variants?.edges ?? []).map((e) => e.node).filter(Boolean);
  if (variants.length === 0) return null;
  const valid = variants.filter(isCommerciallyValidVariant);
  if (valid.length === 0) return variants[0];
  return valid.find((v) => v.availableForSale) ?? valid[0];
}

export function toMember(node: ShopifyProductNode): FamilyMember {
  const override = findOverride(node.handle);
  const parsed = parseProductTitle(node.title, node.vendor);
  const attributes = { ...parsed.attributes, ...(override?.attributes?.[node.handle] ?? {}) };
  const variant = pickVariant(node);
  const price = isCommerciallyValidVariant(variant) ? parseCommercialPrice(variant!.price) : null;
  const valid = !!node.id && !!node.handle && price !== null;
  const status: MemberStatus = !valid ? "INVALID" : variant!.availableForSale ? "AVAILABLE" : "SOLD_OUT";
  return {
    node,
    variant,
    handle: node.handle,
    title: node.title,
    productId: node.id,
    variantId: variant?.id ?? null,
    sku: variant?.sku ?? null,
    price,
    status,
    valid,
    available: status === "AVAILABLE",
    attributes,
  };
}


function uniqueOrdered(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

const SIZE_ORDER_RE = /^(\d+)(GB|TB|MB)$/i;
function compareCapacity(a: string, b: string): number {
  const ma = a.match(SIZE_ORDER_RE);
  const mb = b.match(SIZE_ORDER_RE);
  if (!ma || !mb) return a.localeCompare(b, "pt-BR");
  return toGb(parseInt(ma[1], 10), ma[2]) - toGb(parseInt(mb[1], 10), mb[2]);
}

/**
 * Constrói a família do produto atual a partir de candidatos vindos da
 * Storefront API. Retorna null quando não há confiança/variação suficiente.
 */
export function buildProductFamily(
  current: ShopifyProductNode,
  candidates: ShopifyProductNode[],
): ProductFamily | null {
  const key = getFamilyKey(current);
  const currentVendor = normalizeToken(current.vendor ?? "");
  const currentType = normalizeToken(current.productType ?? "");
  const isOverride = key.startsWith("override:");

  const pool = new Map<string, ShopifyProductNode>();
  pool.set(current.handle, current);
  for (const node of candidates) {
    if (!node?.handle || pool.has(node.handle)) continue;
    if (getFamilyKey(node) !== key) continue;
    if (!isOverride) {
      // Sinais fortes: vendor e productType precisam bater.
      if (normalizeToken(node.vendor ?? "") !== currentVendor) continue;
      if (normalizeToken(node.productType ?? "") !== currentType) continue;
    }
    pool.set(node.handle, node);
  }

  const allMembers = Array.from(pool.values()).map(toMember);
  const currentMember = allMembers.find((m) => m.handle === current.handle);
  if (!currentMember) return null;

  // A MATRIZ é projetada apenas a partir dos membros comercialmente válidos.
  // Membros inválidos (preço zero/ausente) nunca criam dimensões nem opções.
  let validMembers = allMembers.filter(isCommerciallyValidMember);
  if (validMembers.length < 2 && !(validMembers.length >= 1 && !currentMember.valid)) return null;

  // Dimensões que realmente variam entre os membros válidos.
  const attrs: AttributeKey[] = [];
  for (const attr of ATTRIBUTE_ORDER) {
    const values = uniqueOrdered(
      validMembers.map((m) => m.attributes[attr]).filter((v): v is string => !!v),
    );
    if (values.length < 2) continue;
    // Todos os membros precisam declarar essa dimensão para o grid ser exato.
    if (validMembers.some((m) => !m.attributes[attr])) {
      validMembers = validMembers.filter((m) => !!m.attributes[attr]);
    }
    attrs.push(attr);
  }

  // Valores finais: união dos membros válidos + a configuração atualmente
  // aberta (para que o cliente veja em qual configuração está, mesmo quando
  // ela é comercialmente inválida).
  const finalDimensions: FamilyDimension[] = attrs
    .map((key) => {
      const values = uniqueOrdered([
        ...validMembers.map((m) => m.attributes[key]).filter((v): v is string => !!v),
        ...(currentMember.attributes[key] ? [currentMember.attributes[key] as string] : []),
      ]);
      return {
        key,
        label: ATTRIBUTE_LABELS[key],
        values: key === "color" ? values : [...values].sort(compareCapacity),
      };
    })
    .filter((d) => d.values.length > 1);

  if (finalDimensions.length === 0) return null;
  // A seleção atual precisa ser representável em todas as dimensões.
  if (finalDimensions.some((d) => !currentMember.attributes[d.key])) return null;

  const members = uniqueMembers([...validMembers, currentMember]);

  const selection: Partial<Record<AttributeKey, string>> = {};
  for (const d of finalDimensions) selection[d.key] = currentMember.attributes[d.key];

  return {
    key,
    name: getFamilyName(current),
    vendor: current.vendor ?? "",
    productType: current.productType ?? "",
    members,
    dimensions: finalDimensions,
    selection,
    current: currentMember,
  };
}

function uniqueMembers(members: FamilyMember[]): FamilyMember[] {
  const seen = new Set<string>();
  const out: FamilyMember[] = [];
  for (const m of members) {
    if (seen.has(m.handle)) continue;
    seen.add(m.handle);
    out.push(m);
  }
  return out;
}

/**
 * Resolução ESTRITA: retorna o membro cuja combinação de atributos é
 * exatamente igual à seleção. Nunca há fallback aproximado.
 */
export function resolveMember(
  family: ProductFamily,
  selection: Partial<Record<AttributeKey, string>>,
): FamilyMember | null {
  const matches = family.members.filter((m) =>
    family.dimensions.every((d) => m.attributes[d.key] === selection[d.key]),
  );
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Estado da combinação para a interface:
 * MISSING (não existe) | INVALID (existe sem dados comerciais) |
 * SOLD_OUT (válido sem estoque) | AVAILABLE (válido e vendável).
 */
export function resolveStatus(
  family: ProductFamily,
  selection: Partial<Record<AttributeKey, string>>,
): MemberStatus {
  const member = resolveMember(family, selection);
  if (!member) return "MISSING";
  return member.status;
}

/** Membro navegável/comprável: existe, é válido e está em estoque. */
export function resolvePurchasableMember(
  family: ProductFamily,
  selection: Partial<Record<AttributeKey, string>>,
): FamilyMember | null {
  const member = resolveMember(family, selection);
  if (!member || !isCommerciallyValidMember(member) || !member.available) return null;
  return member;
}

