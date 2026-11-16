import { motion } from "framer-motion";
import { useMemo } from "react";
import { parseProductSections, parseProductHtml, type QualityBlock } from "@/lib/productHtml";

interface ProductImage {
  url: string;
  altText: string | null;
}

interface Props {
  title: string;
  description: string;
  descriptionHtml?: string;
  images: ProductImage[];
}

/**
 * Premium product description.
 *
 * Layout (desktop):
 *   ┌──────────────────────┬──────────────────┐
 *   │  Descrição (texto)   │  imagens (1–2)   │
 *   └──────────────────────┴──────────────────┘
 *
 * Mobile: single column, images below the text.
 *
 * The "Principais destaques" and "Ficha técnica" sections live in their
 * own dedicated components/accordions (see ProductView).
 */
export function ProductDescriptionBlocks({ title, description, descriptionHtml, images }: Props) {
  const sections = useMemo(() => parseProductSections(descriptionHtml), [descriptionHtml]);

  // Fallback: HTML had no structured sections → derive paragraphs from
  // either the legacy "quality blocks" parser (h2/h3 + paragraphs) or
  // from plain-text description split on blank lines.
  const paragraphs = useMemo<string[]>(() => {
    if (sections.descriptionParagraphs.length > 0) return sections.descriptionParagraphs;

    const blocks: QualityBlock[] = parseProductHtml(descriptionHtml).blocks.filter(
      (b, i) => !(i === 0 && norm(b.title) === norm(title) && !b.body)
    );
    if (blocks.length > 0) {
      const out: string[] = [];
      for (const b of blocks) {
        if (b.title) out.push(b.title);
        if (b.body) out.push(b.body);
      }
      return out;
    }
    return (description || "")
      .replace(/\r/g, "")
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [sections.descriptionParagraphs, descriptionHtml, description, title]);

  if (paragraphs.length === 0 && images.length === 0) {
    return (
      <div className="px-5 md:px-7 py-6 text-sm text-muted-foreground">
        Este produto ainda não possui uma descrição detalhada.
      </div>
    );
  }

  // Pick up to 2 secondary images for the right column.
  const sideImages = images.slice(1, 3);
  const heroImage = sideImages.length === 0 ? images[0] : null;

  return (
    <div className="bg-card">
      <div className="px-5 md:px-10 lg:px-14 py-8 md:py-14">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-10 lg:gap-14 items-start">
          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="min-w-0"
          >
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-highlight">
              Sobre o produto
            </p>
            <h3 className="mt-2 font-display text-2xl md:text-3xl lg:text-4xl font-bold text-ink leading-tight">
              Descrição
            </h3>
            <div className="mt-6 space-y-4 max-w-[62ch] text-[15px] md:text-base leading-relaxed text-foreground/85">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          </motion.div>

          {/* Image column */}
          {(sideImages.length > 0 || heroImage) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
              className="min-w-0 flex flex-col gap-5"
            >
              {heroImage ? (
                <ImageCard image={heroImage} title={title} large />
              ) : (
                sideImages.map((img, i) => (
                  <ImageCard key={i} image={img} title={title} />
                ))
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageCard({
  image,
  title,
  large = false,
}: {
  image: ProductImage;
  title: string;
  large?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl bg-surface-muted/60 border border-border/60 overflow-hidden flex items-center justify-center ${
        large ? "aspect-[4/5]" : "aspect-square"
      }`}
    >
      <img
        src={image.url}
        alt={image.altText || title}
        loading="lazy"
        className="w-full h-full object-contain p-6 md:p-8"
      />
    </div>
  );
}

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
