import { motion } from "framer-motion";
import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { parseProductSections } from "@/lib/productHtml";

interface Props {
  descriptionHtml?: string;
}

/**
 * Premium "Principais destaques" grid — renders each <li>/<strong> highlight
 * from the Shopify descriptionHtml as a card.
 *
 * Returns null if the source HTML has no highlights section, so the parent
 * can decide whether to render the accordion wrapper.
 */
export function ProductHighlights({ descriptionHtml }: Props) {
  const highlights = useMemo(
    () => parseProductSections(descriptionHtml).highlights,
    [descriptionHtml]
  );

  if (highlights.length === 0) return null;

  return (
    <div className="px-5 md:px-7 py-7 md:py-9 bg-card">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {highlights.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: i * 0.04 }}
            className="group rounded-2xl border border-border bg-card hover:border-highlight/40 hover:shadow-lg transition-all p-5 md:p-6 min-w-0"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-highlight/10 text-highlight mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-display text-base md:text-lg font-bold text-ink leading-snug">
              {h.title}
            </h4>
            {h.body && (
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {h.body}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Helper so ProductView can know whether to render the accordion at all. */
export function hasProductHighlights(descriptionHtml?: string): boolean {
  return parseProductSections(descriptionHtml).highlights.length > 0;
}
