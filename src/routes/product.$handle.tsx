import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ProductView, productQuery } from "@/components/ProductView";
import { productHead } from "@/lib/productMeta";

export const Route = createFileRoute("/product/$handle")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.handle)),
  head: ({ params, loaderData }) => productHead("product", params.handle, loaderData),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h2 className="font-display text-2xl font-bold">Produto não encontrado</h2>
      <Link to="/" className="text-highlight-foreground bg-highlight px-4 py-2 rounded-full inline-block mt-4 font-semibold">Voltar à loja</Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-xl font-bold">Erro ao carregar o produto</h2>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 bg-ink text-ink-foreground px-5 py-2.5 rounded-full font-semibold">
          Tentar novamente
        </button>
      </div>
    );
  },
});

function ProductPage() {
  const { handle } = Route.useParams();
  return <ProductView handle={handle} />;
}
