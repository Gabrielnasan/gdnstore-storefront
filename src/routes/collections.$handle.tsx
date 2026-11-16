import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { CollectionView, collectionQuery } from "@/components/CollectionView";
import { findCategory } from "@/lib/categories";

export const Route = createFileRoute("/collections/$handle")({
  loader: async ({ params, context }) => {
    const cat = findCategory(params.handle);
    if (!cat) throw notFound();
    await context.queryClient.ensureQueryData(collectionQuery(cat.handle, cat.query));
    return { category: cat };
  },
  head: ({ params, loaderData }) => {
    const cat = loaderData?.category;
    const title = cat ? `${cat.label} · GDN Store` : "Categoria · GDN Store";
    const description = cat
      ? (cat.description ?? `Compre ${cat.label} na GDN Store.`)
      : "Explore as categorias da GDN Store: smartphones, computadores, games e acessórios com envio rastreado e atendimento humano.";
    const url = `https://gdnstore.com.br/collections/${params.handle}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CollectionPage,
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

function CollectionPage() {
  const { handle } = Route.useParams();
  return <CollectionView handle={handle} />;
}
