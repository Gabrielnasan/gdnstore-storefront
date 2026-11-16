import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { CollectionView, collectionQuery } from "@/components/CollectionView";
import { findCategory } from "@/lib/categories";

export const Route = createFileRoute("/categoria/$handle")({
  loader: async ({ params, context }) => {
    const cat = findCategory(params.handle);
    if (!cat) throw notFound();
    await context.queryClient.ensureQueryData(collectionQuery(cat.handle, cat.query));
    return { category: cat };
  },
  head: ({ params, loaderData }) => {
    const url = `https://gdnstore.com.br/categoria/${params.handle}`;
    if (!loaderData?.category) {
      const fallbackTitle = "Categoria · GDN Store";
      const fallbackDescription = `Veja os produtos da categoria "${params.handle}" na GDN Store: tecnologia premium, parcelamento no cartão e envio com rastreio.`;
      return {
        meta: [
          { title: fallbackTitle },
          { name: "description", content: fallbackDescription },
          { property: "og:title", content: fallbackTitle },
          { property: "og:description", content: fallbackDescription },
          { property: "og:url", content: url },
        ],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const title = `${loaderData.category.label} · GDN Store`;
    const description = loaderData.category.description ?? `Compre ${loaderData.category.label} na GDN Store.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Categoria não encontrada</h1>
      <Link to="/" className="inline-block mt-4 text-ink underline">Voltar à loja</Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-xl font-bold">Erro ao carregar a categoria</h2>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 bg-ink text-ink-foreground px-5 py-2.5 rounded-full font-semibold">
          Tentar novamente
        </button>
      </div>
    );
  },
});

function CategoryPage() {
  const { handle } = Route.useParams();
  return <CollectionView handle={handle} />;
}
