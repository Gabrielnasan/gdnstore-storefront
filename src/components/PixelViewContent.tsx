import { useEffect } from "react";
import { track } from "@/lib/pixel";

interface Props {
  /** ID numérico da variante Shopify (string) ou null quando indisponível. */
  contentId: string | null;
  contentName: string;
  value: number | null;
}

/**
 * Dispara ViewContent uma vez por variante selecionada.
 * A dependência é o contentId (string), nunca o objeto do produto.
 */
export function PixelViewContent({ contentId, contentName, value }: Props) {
  useEffect(() => {
    if (!contentId || value === null || !Number.isFinite(value) || value <= 0) return;
    track("ViewContent", {
      content_ids: [contentId],
      content_type: "product",
      content_name: contentName,
      value,
      currency: "BRL",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  return null;
}
