import { useMemo } from "react";
import { extractSpecSections } from "@/lib/productHtml";

interface VariantOption {
  name: string;
  value: string;
}

interface Props {
  description: string;
  descriptionHtml?: string;
  title: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  variantOptions?: VariantOption[];
  sku?: string;
  barcode?: string;
  embedded?: boolean;
}


/**
 * Full technical spec sheet rendered as a 2-column alternating table.
 *
 * Strict rules:
 *  - Only show fields with real values (from the product's `descriptionHtml`
 *    spec table when present, or "Key: Value" lines, plus structured
 *    Shopify fields and the selected variant options).
 *  - Never invent values. Never substitute "N/A" / "não informado".
 *  - Group recognized keys into sections; unknown keys go into "Outras
 *    informações" instead of being discarded.
 */
export function ProductSpecSheet({
  description,
  descriptionHtml,
  vendor,
  productType,
  tags,
  variantOptions,
  sku,
  barcode,
  embedded = false,
}: Props) {
  const groups = useMemo(
    () => buildSpecGroups({ description, descriptionHtml, vendor, productType, tags, variantOptions, sku, barcode }),
    [description, descriptionHtml, vendor, productType, tags, variantOptions, sku, barcode]
  );

  if (groups.length === 0) {
    if (embedded) {
      return (
        <div className="px-5 md:px-7 py-6 text-sm text-muted-foreground">
          Ficha técnica não disponível para este produto.
        </div>
      );
    }
    return null;
  }

  const table = (
    <div className={embedded ? "" : "rounded-2xl border border-border bg-card overflow-hidden"}>
      {groups.map((group, gi) => (
        <div key={group.title} className={gi > 0 ? "border-t border-border" : ""}>
          <h3 className="px-4 md:px-6 py-3 text-[11px] md:text-xs font-bold tracking-[0.2em] uppercase text-highlight bg-surface-muted/60 border-b border-border">
            {group.title}
          </h3>
          <dl>
            {group.rows.map(([label, value], i) => (
              <div
                key={`${label}-${i}`}
                className={`grid grid-cols-1 md:grid-cols-[280px_1fr] gap-1 md:gap-6 px-4 md:px-6 py-3 md:py-3.5 ${
                  i % 2 === 0 ? "bg-card" : "bg-surface-muted/40"
                }`}
              >
                <dt className="text-sm text-muted-foreground font-medium">{label}</dt>
                <dd className="text-sm text-foreground font-medium whitespace-pre-line break-words">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );

  if (embedded) return table;

  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-6">
        Ficha Técnica
      </h2>
      {table}
    </section>
  );
}


/* -------------------------------------------------------------------------- */

interface BuildArgs {
  description: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  variantOptions?: VariantOption[];
  sku?: string;
  barcode?: string;
}

interface Group {
  title: string;
  rows: Array<[string, string]>;
}

/** Canonical label → group mapping. Keys are lowercased + accent-stripped. */
const GROUP_DEFINITIONS: Array<{ title: string; keys: string[] }> = [
  {
    title: "Informações gerais",
    keys: [
      "marca", "fabricante", "referencia", "modelo", "linha", "serie", "familia",
      "sku", "codigo ean", "ean", "codigo de barras", "codigo do fabricante",
      "categoria", "tipo de produto", "ano", "ano de lancamento", "geracao",
    ],
  },
  {
    title: "Armazenamento e memória",
    keys: [
      "armazenamento", "armazenamento interno", "capacidade", "capacidade de armazenamento",
      "armazenamento expansivel", "tipo de armazenamento", "ssd", "hd",
      "memoria ram", "ram", "memoria", "tipo de memoria", "frequencia da memoria",
      "slots de memoria",
    ],
  },
  {
    title: "Processador e desempenho",
    keys: [
      "processador", "fabricante do processador", "modelo do processador",
      "nucleos", "quantidade de nucleos", "threads", "quantidade de threads",
      "frequencia base", "frequencia turbo", "frequencia maxima", "clock",
      "cache", "cache l2", "cache l3", "tdp", "arquitetura", "litografia",
      "soquete", "socket", "chip grafico", "gpu", "placa de video", "placa grafica",
    ],
  },
  {
    title: "Tela",
    keys: [
      "tamanho da tela", "tela", "tipo de tela", "resolucao da tela", "resolucao",
      "taxa de atualizacao", "taxa de atualizacao da tela", "brilho", "proporcao",
      "densidade de pixels", "ppi", "tipo de painel", "painel",
      "tela sensivel ao toque", "touchscreen", "tela touch",
    ],
  },
  {
    title: "Sistema",
    keys: [
      "sistema operacional", "sistema", "so", "versao do sistema",
      "interface", "plataforma",
    ],
  },
  {
    title: "Câmeras",
    keys: [
      "camera", "camera principal", "resolucao da camera traseira", "camera traseira",
      "resolucao da camera frontal", "camera frontal", "quantidade de cameras",
      "recursos de camera", "gravacao de video", "flash", "zoom",
    ],
  },
  {
    title: "Conectividade",
    keys: [
      "wi-fi", "wifi", "wi fi", "bluetooth", "rede movel", "rede", "4g", "5g",
      "nfc", "gps", "localizacao", "usb", "entrada p2", "p2", "hdmi",
      "displayport", "thunderbolt", "leitor de cartao", "ethernet", "rj45",
      "infravermelho", "conexoes",
    ],
  },
  {
    title: "Recursos e sensores",
    keys: [
      "sensores", "leitor biometrico", "biometria", "reconhecimento facial",
      "face id", "acelerometro", "giroscopio", "bussola", "outros recursos",
      "recursos",
    ],
  },
  {
    title: "Bateria e energia",
    keys: [
      "bateria", "capacidade da bateria", "tipo de bateria",
      "potencia de carregamento", "carregamento", "tipo de carregador",
      "carregador", "autonomia", "autonomia estimada", "tempo de carga",
      "voltagem", "watts", "potencia",
    ],
  },
  {
    title: "Dimensões e peso",
    keys: [
      "altura", "largura", "profundidade", "espessura", "comprimento",
      "peso", "peso do produto", "peso com embalagem",
      "peso do produto com embalagem", "dimensoes", "dimensoes do produto",
      "dimensoes com embalagem", "dimensoes do produto com embalagem",
    ],
  },
  {
    title: "Construção e design",
    keys: ["cor", "material", "material de construcao", "acabamento", "design"],
  },
  {
    title: "Garantia e certificações",
    keys: [
      "certificacao anatel", "certificado homologado pela anatel numero",
      "homologacao anatel", "certificacoes", "certificacoes adicionais",
      "prazo de garantia", "garantia", "tipo de garantia",
    ],
  },
  {
    title: "Conteúdo da embalagem",
    keys: [
      "conteudo da embalagem", "conteudo da caixa", "itens inclusos",
      "acompanha",
    ],
  },
];

const OTHER_GROUP_TITLE = "Outras informações";

function buildSpecGroups(args: BuildArgs): Group[] {
  const seen = new Set<string>();

  const makePush = (target: Array<[string, string]>) =>
    (label: string, value: string | undefined | null) => {
      if (!label || !value) return;
      const cleanLabel = label.trim();
      const cleanValue = String(value).trim();
      if (!cleanLabel || !cleanValue) return;
      if (cleanLabel.length > 60 || cleanValue.length > 600) return;
      const key = norm(cleanLabel);
      if (seen.has(key)) return;
      seen.add(key);
      target.push([cleanLabel, cleanValue]);
    };

  // ---- Structured Shopify fields → "Informações gerais" ----
  const generalRows: Array<[string, string]> = [];
  const pushGeneral = makePush(generalRows);
  if (args.vendor) pushGeneral("Marca", args.vendor);
  if (args.productType) pushGeneral("Categoria", args.productType);
  if (args.sku) pushGeneral("SKU", args.sku);
  if (args.barcode) pushGeneral("Código de barras", args.barcode);
  for (const opt of args.variantOptions ?? []) {
    if (opt.value && opt.value.toLowerCase() !== "default title") {
      pushGeneral(opt.name, opt.value);
    }
  }

  const result: Group[] = [];

  // ---- Sectioned tables from descriptionHtml ----
  // Each <table> preceded by its own <h2>/<h3> becomes its own group,
  // preserving the original section names from the Shopify description
  // (e.g. "Memória e armazenamento", "Conectividade", etc.).
  const sections = extractSpecSections(args.descriptionHtml ?? "");

  if (sections.length > 0) {
    if (generalRows.length) result.push({ title: "Informações gerais", rows: generalRows });

    // First table without an explicit heading falls back to "Especificações".
    for (const section of sections) {
      const rows: Array<[string, string]> = [];
      const push = makePush(rows);
      for (const [label, value] of section.rows) push(label, value);
      if (rows.length) {
        result.push({ title: section.title?.trim() || "Especificações", rows });
      }
    }
  } else {
    // ---- Fallback: "Label: value" pairs from plain description ----
    const flatRows: Array<[string, string]> = [];
    const pushFlat = makePush(flatRows);
    for (const [label, value] of extractKeyValueLines(args.description ?? "")) {
      pushFlat(label, value);
    }
    // Bucket the flat rows into the legacy predefined groups so the page
    // still looks organized when no Shopify tables exist.
    const groupMap = new Map<string, Array<[string, string]>>();
    const remaining: Array<[string, string]> = [];
    for (const row of [...generalRows, ...flatRows]) {
      const title = findGroupTitle(row[0]);
      if (title) {
        const arr = groupMap.get(title) ?? [];
        arr.push(row);
        groupMap.set(title, arr);
      } else {
        remaining.push(row);
      }
    }
    for (const def of GROUP_DEFINITIONS) {
      const rows = groupMap.get(def.title);
      if (rows && rows.length) result.push({ title: def.title, rows });
    }
    if (remaining.length) result.push({ title: OTHER_GROUP_TITLE, rows: remaining });
  }

  // Optional: tags
  const interesting = (args.tags ?? []).filter(
    (t) => !/^(novo|destaque|promo|oferta|home|landing)$/i.test(t)
  );
  if (interesting.length) {
    const tagRows: Array<[string, string]> = [];
    makePush(tagRows)("Etiquetas", interesting.slice(0, 6).join(", "));
    if (tagRows.length) {
      // Append to last group or create a small one
      result.push({ title: "Etiquetas", rows: tagRows });
    }
  }

  return result;
}

function findGroupTitle(label: string): string | null {
  const n = norm(label);
  for (const def of GROUP_DEFINITIONS) {
    for (const key of def.keys) {
      if (n === key || n.startsWith(key + " ") || n.endsWith(" " + key) || n.includes(key)) {
        return def.title;
      }
    }
  }
  return null;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract "Label: Value" pairs from a free-form description.
 * Supports multi-line values: subsequent non-key lines are appended until
 * a blank line or another "Label:" line is hit.
 */
function extractKeyValueLines(desc: string): Array<[string, string]> {
  if (!desc) return [];
  const out: Array<[string, string]> = [];
  const lines = desc.replace(/\r/g, "").split(/\n/);

  // Regex for "Label: value" — label is short, alphabetic-ish
  const keyRe = /^([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 \-/()ºª°]{1,55}?)\s*[:：]\s*(.+)$/;

  let current: [string, string] | null = null;

  const flush = () => {
    if (!current) return;
    const [k, v] = current;
    const value = v.trim();
    if (value && value.length <= 600 && !/^https?:\/\//i.test(value)) {
      out.push([k, value]);
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/^[\-\*•·▪◦]\s*/, "").trimEnd();

    if (!line.trim()) {
      flush();
      continue;
    }

    const m = line.match(keyRe);
    if (m && !/^(http|www|tel|email|nota|aten|importante)/i.test(m[1])) {
      flush();
      current = [m[1].trim(), m[2].trim()];
    } else if (current) {
      // Continuation of previous value
      current[1] += " " + line.trim();
    }
  }
  flush();

  return out;
}
