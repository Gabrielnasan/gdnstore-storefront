import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Premium accordion block used on the product page.
 * - Click anywhere on the header (title or icon) toggles open/closed.
 * - Open  → shows a "−" icon.
 * - Closed → shows a "+" icon.
 * - Smooth height + opacity animation.
 */
export function ProductAccordion({ title, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group w-full flex items-center justify-between gap-4 px-5 md:px-7 py-5 md:py-6 text-left transition-colors hover:bg-surface-muted/40 cursor-pointer"
      >
        <h2 className="font-display text-xl md:text-2xl font-bold text-ink group-hover:text-highlight transition-colors">
          {title}
        </h2>
        <span
          className={`shrink-0 inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full border border-border text-ink transition-colors group-hover:bg-highlight group-hover:border-highlight group-hover:text-highlight-foreground`}
          aria-hidden="true"
        >
          {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <div>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
