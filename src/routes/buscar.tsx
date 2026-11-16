import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { fetchProducts } from "@/lib/shopify";
import { filterSearchableProducts } from "@/lib/searchFilters";
import { ProductCard } from "@/components/ProductCard";

const searchSchema = z.object({ q: z.string().optional().default("") });

function buildQuery(q: string) {
  const t = q.trim();
  if (!t) return undefined;
  // Escape quotes and wrap in wildcards across multiple searchable fields.
  const safe = t.replace(/"/g, "");
  return `title:*${safe}* OR vendor:*${safe}* OR product_type:*${safe}* OR tag:*${safe}*`;
}

const searchQueryOpts = (q: string) =>
  queryOptions({
    queryKey: ["search", q],
    // Buscamos um lote maior porque produtos sem preço válido são descartados
    // antes de renderizar; isso evita perder resultados válidos pelo limite.
    queryFn: () => fetchProducts(120, buildQuery(q)),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/buscar")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ q: search.q ?? "" }),
  loader: ({ deps, context }) => context.queryClient.ensureQueryData(searchQueryOpts(deps.q)),
  head: ({ match }: any) => {
    const q = (match?.search as { q?: string } | undefined)?.q ?? "";
    const title = q ? `Busca: ${q} · GDN Store` : "Buscar · GDN Store";
    const description = q
      ? `Resultados da busca por "${q}" na GDN Store: produtos de tecnologia com envio rastreado e parcelamento no cartão.`
      : "Busque smartphones, computadores, games e acessórios no catálogo da GDN Store.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex,follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [value, setValue] = useState(q);
  const { data } = useSuspenseQuery(searchQueryOpts(q));

  const results = useMemo(() => filterSearchableProducts(data), [data]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/buscar", search: { q: value.trim() } });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <form onSubmit={onSubmit} className="relative max-w-2xl mx-auto">
        <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="O que você procura?"
          className="w-full h-12 pl-12 pr-28 rounded-lg border border-input bg-background text-sm focus:outline-none focus:border-ink"
        />
        <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-5 rounded-md bg-ink text-ink-foreground text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition">
          Buscar
        </button>
      </form>

      <div className="mt-10">
        {!q ? (
          <p className="text-center text-muted-foreground">Digite acima para buscar produtos.</p>
        ) : results.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-2xl max-w-xl mx-auto">
            <p className="font-display text-xl font-semibold">Nenhum produto encontrado para "{q}"</p>
            <p className="text-sm text-muted-foreground mt-2">Tente outros termos ou explore as <Link to="/" className="underline">categorias</Link>.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-5">{results.length} resultado(s) para <strong className="text-foreground">"{q}"</strong></p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {results.map((p, i) => (<ProductCard key={p.node.id} product={p} index={i} />))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
