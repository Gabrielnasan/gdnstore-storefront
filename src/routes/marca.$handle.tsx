import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { BrandView, brandQuery } from "@/components/BrandView";
import { findBrand } from "@/lib/brands";

export const Route = createFileRoute("/marca/$handle")({
  loader: async ({ params, context }) => {
    const brand = findBrand(params.handle);
    if (!brand) throw notFound();
    await context.queryClient.ensureQueryData(brandQuery(brand.handle, brand.query));
    return { brand };
  },
  head: ({ params, loaderData }) => {
    const url = `https://gdnstore.com.br/marca/${params.handle}`;
    if (!loaderData?.brand) {
      const fallbackTitle = "Marca · GDN Store";
      const fallbackDescription = `Conheça os produtos da marca "${params.handle}" na GDN Store: tecnologia premium, parcelamento no cartão e envio com rastreio.`;
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
    const title = `${loaderData.brand.label} · GDN Store`;
    const description = loaderData.brand.description ?? `Produtos ${loaderData.brand.label} na GDN Store.`;
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
  component: BrandPage,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Marca não encontrada</h1>
      <Link to="/" className="inline-block mt-4 text-ink underline">Voltar à loja</Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-xl font-bold">Erro ao carregar a marca</h2>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 bg-ink text-ink-foreground px-5 py-2.5 rounded-full font-semibold">
          Tentar novamente
        </button>
      </div>
    );
  },
});

function BrandPage() {
  const { handle } = Route.useParams();
  return <BrandView handle={handle} />;
}
