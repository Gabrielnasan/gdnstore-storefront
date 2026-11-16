/**
 * Parsers that turn a Shopify `descriptionHtml` payload into structured data:
 *  - Quality blocks (h2/h3 + following paragraphs), excluding the spec table.
 *  - Spec rows (the "Ficha técnica" <table>).
 *
 * Pure functions — no DOM access required. Uses a lightweight tag regex
 * walker so it works in both SSR and the browser.
 */

export interface QualityBlock {
  title: string;
  body: string;
}

export interface HighlightItem {
  title: string;
  body: string;
}

export interface ProductSections {
  descriptionParagraphs: string[];
  highlights: HighlightItem[];
  hasStructuredSections: boolean;
}

export interface ParsedProductHtml {
  blocks: QualityBlock[];
  specs: Array<[string, string]>;
}

const SPEC_HEADING_RE = /ficha\s*t[eé]cnica|especifica[cç][oõ]es|especifica[cç][aã]o\s*t[eé]cnica/i;
const HIGHLIGHTS_HEADING_RE = /principais\s*destaques|^destaques$|principais\s*caracter[ií]sticas/i;
const DESCRIPTION_HEADING_RE = /^descri[cç][aã]o$/i;

export function parseProductHtml(html: string | undefined | null): ParsedProductHtml {
  if (!html) return { blocks: [], specs: [] };

  const blocks = extractBlocks(html);
  const specs = extractSpecs(html);
  return { blocks, specs };
}

/**
 * Parse a Shopify descriptionHtml into:
 *  - Descrição (paragraphs under <h2>Descrição</h2> or before any other section)
 *  - Principais destaques (<li> or <p><strong>…)
 *  - Ficha técnica is handled separately by ProductSpecSheet.
 */
export function parseProductSections(html: string | undefined | null): ProductSections {
  const empty: ProductSections = {
    descriptionParagraphs: [],
    highlights: [],
    hasStructuredSections: false,
  };
  if (!html) return empty;

  type Section = "description" | "highlights" | "specs" | "other";
  let current: Section = "description";
  let sawHeading = false;
  const descParas: string[] = [];
  const highlights: HighlightItem[] = [];

  const tagRe = /<(h[1-4]|p|li|table)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    const rawInner = m[3];
    const innerText = stripTags(rawInner).trim();
    if (tag === "table") continue;
    if (!innerText) continue;

    if (/^h[1-4]$/.test(tag)) {
      sawHeading = true;
      if (SPEC_HEADING_RE.test(innerText)) current = "specs";
      else if (HIGHLIGHTS_HEADING_RE.test(innerText)) current = "highlights";
      else if (DESCRIPTION_HEADING_RE.test(innerText)) current = "description";
      else if (tag === "h2") current = "other";
      continue;
    }

    if (current === "specs" || current === "other") continue;

    if (current === "description") {
      descParas.push(tag === "li" ? "• " + innerText : innerText);
    } else if (current === "highlights") {
      highlights.push(splitHighlight(rawInner, innerText));
    }
  }

  return {
    descriptionParagraphs: descParas,
    highlights,
    hasStructuredSections: sawHeading && descParas.length + highlights.length > 0,
  };
}

function splitHighlight(rawInner: string, fullText: string): HighlightItem {
  const strongMatch = rawInner.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
  if (strongMatch) {
    const title = stripTags(strongMatch[1]).trim().replace(/[:：]\s*$/, "");
    const rest = stripTags(rawInner.replace(strongMatch[0], ""))
      .trim()
      .replace(/^[\s:：\-–—]+/, "");
    if (title) return { title, body: rest };
  }
  const sep = fullText.match(/^(.{3,80}?)\s*[—–\-:]\s+(.+)$/);
  if (sep) return { title: sep[1].trim(), body: sep[2].trim() };
  return { title: fullText, body: "" };
}

/* ------------------------------- Blocks ------------------------------- */

function extractBlocks(html: string): QualityBlock[] {
  const result: QualityBlock[] = [];
  // Tokenize: capture h1-h4 and p/li elements in order.
  const tagRe = /<(h[1-4]|p|li|table)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;

  let currentTitle: string | null = null;
  let currentBody: string[] = [];
  let stop = false;

  const flush = () => {
    if (currentTitle) {
      result.push({ title: currentTitle, body: currentBody.join("\n\n").trim() });
    }
    currentTitle = null;
    currentBody = [];
  };

  while ((m = tagRe.exec(html)) !== null) {
    if (stop) break;
    const tag = m[1].toLowerCase();
    const inner = stripTags(m[3]).trim();
    if (!inner) continue;

    if (tag === "table") {
      // Ficha técnica table → end of narrative blocks.
      flush();
      stop = true;
      break;
    }

    if (/^h[1-4]$/.test(tag)) {
      // Heading that announces the spec table marks the end too.
      if (SPEC_HEADING_RE.test(inner)) {
        flush();
        stop = true;
        break;
      }
      flush();
      currentTitle = inner;
      continue;
    }

    // p / li → body content of the current block
    if (currentTitle) {
      currentBody.push(inner);
    }
  }
  flush();

  // Filter out the very first block if it's just the product title with no body
  // (the <h2> at the top of the description is typically the title itself).
  return result.filter((b) => b.title.length > 0 && (b.body.length > 0 || result.length === 1));
}

/* -------------------------------- Specs ------------------------------- */

function extractSpecs(html: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const section of extractSpecSections(html)) {
    for (const row of section.rows) out.push(row);
  }
  return out;
}

export interface SpecSection {
  title: string | null;
  rows: Array<[string, string]>;
}

/**
 * Walk HTML in order. Each <table> becomes a SpecSection whose `title`
 * is the most recent h2/h3/h4 heading before it (skipping the wrapper
 * "Ficha técnica" heading). Supports descriptions with multiple tables
 * separated by section headings like "Memória e armazenamento".
 */
export function extractSpecSections(html: string): SpecSection[] {
  if (!html) return [];
  const out: SpecSection[] = [];
  const tokenRe = /<(h[2-4]|table)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let lastHeading: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    if (tag === "table") {
      const rows = parseTableRows(m[0]);
      if (rows.length) out.push({ title: lastHeading, rows });
    } else {
      const text = stripTags(m[3]).trim();
      if (!text) continue;
      if (SPEC_HEADING_RE.test(text)) lastHeading = null;
      else lastHeading = text;
    }
  }
  return out;
}

function parseTableRows(table: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let r: RegExpExecArray | null;
  while ((r = rowRe.exec(table)) !== null) {
    const cells: string[] = [];
    const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let c: RegExpExecArray | null;
    while ((c = cellRe.exec(r[1])) !== null) {
      cells.push(stripTags(c[1]).trim());
    }
    if (cells.length >= 2) {
      const label = cells[0].replace(/[:：]\s*$/, "").trim();
      const value = cells.slice(1).join(" ").trim();
      if (label && value) out.push([label, value]);
    }
  }
  return out;
}

/* ------------------------------ Helpers ------------------------------- */

function stripTags(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/* Agrupamento de configurações vive em src/lib/productFamily.ts */
