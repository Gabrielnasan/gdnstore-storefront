import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/pageMeta";
import { CollectionView, collectionQuery } from "@/components/CollectionView";
import { findCategory } from "@/lib/categories";

export const Route = createFileRoute("/ofertas")({
  loader: async ({ context }) => {
    const cat = findCategory("ofertas")!;
    await context.queryClient.ensureQueryData(collectionQuery(cat.handle, cat.query));
  },
  head: () => pageHead("/ofertas", "Ofertas · GDN Store", "As melhores ofertas em tecnologia selecionadas para você."),
  component: OfertasPage,
});

function OfertasPage() {
  return <CollectionView handle="ofertas" />;
}
