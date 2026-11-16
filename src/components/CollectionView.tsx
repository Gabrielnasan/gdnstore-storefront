import { Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { fetchProducts, hasUsableImage, type ShopifyProduct } from "@/lib/shopify";
import { findCategory, CATEGORIES } from "@/lib/categories";
import { ProductCard } from "@/components/ProductCard";
import { isCommerciallyAvailable } from "@/lib/commerce";

export const collectionQuery = (handle: string, query: string) =>
  queryOptions({
    queryKey: ["collection", handle],
    queryFn: () => fetchProducts(60, query),
    staleTime: 60_000,
  });

type SortKey = "relevance" | "price-asc" | "price-desc" | "discount" | "newest" | "name";

const DYNAMIC_OPTIONS = ["cor", "color", "armazenamento", "capacidade", "storage", "memória", "memoria", "ram"];

export function CollectionView({ handle }: { handle: string }) {
  const cat = findCategory(handle)!;
  const { data: products } = useSuspenseQuery(collectionQuery(cat.handle, cat.query));

  const [sort, setSort] = useState<SortKey>("relevance");
  const [vendor, setVendor] = useState<string>("all");
  const [inStock, setInStock] = useState(false);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);
  const [selectedOpts, setSelectedOpts] = useState<Record<string, string>>({});

  const baseList = useMemo(
    () =>
      products
        .filter((p) => !/example product/i.test(p.node.title))
        .filter((p) => hasUsableImage(p.node))
        .filter((p) => isCommerciallyAvailable(p)),
    [products]
  );

  const vendors = useMemo(() => {
    const s = new Set<string>();
    baseList.forEach((p) => p.node.vendor && s.add(p.node.vendor));
    return Array.from(s).sort();
  }, [baseList]);

  // Bounds de preço vêm SÓ dos produtos que passariam nos filtros atuais,
  // ignorando o próprio filtro de preço — evita máximo absurdo por produto
  // antigo/indisponível.
  const priceCandidates = useMemo(() => {
    let l = baseList;
    if (vendor !== "all") l = l.filter((p) => p.node.vendor === vendor);
    if (inStock) l = l.filter((p) => p.node.variants.edges.some((v) => v.node.availableForSale));
    if (onlyDiscount) {
      l = l.filter((p) => {
        const c = p.node.compareAtPriceRange ? parseFloat(p.node.compareAtPriceRange.minVariantPrice.amount) : 0;
        const pr = parseFloat(p.node.priceRange.minVariantPrice.amount);
        return c > pr;
      });
    }
    // Considera apenas produtos vendáveis para calcular o máximo/mínimo real
    l = l.filter((p) => p.node.variants.edges.some((v) => v.node.availableForSale));
    return l;
  }, [baseList, vendor, inStock, onlyDiscount]);

  const priceBounds = useMemo(() => {
    const prices = priceCandidates.map((p) => parseFloat(p.node.priceRange.minVariantPrice.amount));
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [priceCandidates]);

  const [priceMax, setPriceMax] = useState<number | null>(null);
  const effectiveMax = priceMax ?? priceBounds.max;

  // Aggregate dynamic options across products (color, storage, RAM…)
  const dynamicFilters = useMemo(() => {
    const map = new Map<string, Set<string>>();
    baseList.forEach((p) => {
      p.node.options.forEach((opt) => {
        const norm = opt.name.toLowerCase();
        if (!DYNAMIC_OPTIONS.some((k) => norm.includes(k))) return;
        if (!map.has(opt.name)) map.set(opt.name, new Set());
        opt.values.forEach((v) => map.get(opt.name)!.add(v));
      });
    });
    return Array.from(map.entries()).map(([name, set]) => ({ name, values: Array.from(set).sort() }));
  }, [baseList]);

  const list = useMemo(() => {
    let l: ShopifyProduct[] = baseList;
    if (vendor !== "all") l = l.filter((p) => p.node.vendor === vendor);
    if (inStock) l = l.filter((p) => p.node.variants.edges.some((v) => v.node.availableForSale));
    if (onlyDiscount) {
      l = l.filter((p) => {
        const c = p.node.compareAtPriceRange ? parseFloat(p.node.compareAtPriceRange.minVariantPrice.amount) : 0;
        const pr = parseFloat(p.node.priceRange.minVariantPrice.amount);
        return c > pr;
      });
    }
    if (priceMax !== null) {
      l = l.filter((p) => parseFloat(p.node.priceRange.minVariantPrice.amount) <= priceMax);
    }
    for (const [optName, val] of Object.entries(selectedOpts)) {
      if (!val) continue;
      l = l.filter((p) =>
        p.node.variants.edges.some((v) =>
          v.node.selectedOptions.some((o) => o.name === optName && o.value === val)
        )
      );
    }

    const priceOf = (p: ShopifyProduct) => parseFloat(p.node.priceRange.minVariantPrice.amount);
    const compareOf = (p: ShopifyProduct) =>
      p.node.compareAtPriceRange ? parseFloat(p.node.compareAtPriceRange.minVariantPrice.amount) : 0;
    switch (sort) {
      case "price-asc": l = [...l].sort((a, b) => priceOf(a) - priceOf(b)); break;
      case "price-desc": l = [...l].sort((a, b) => priceOf(b) - priceOf(a)); break;
      case "newest": l = [...l].reverse(); break;
      case "name": l = [...l].sort((a, b) => a.node.title.localeCompare(b.node.title)); break;
      case "discount":
        l = [...l].sort((a, b) => {
          const da = compareOf(a) > priceOf(a) ? (compareOf(a) - priceOf(a)) / compareOf(a) : 0;
          const db = compareOf(b) > priceOf(b) ? (compareOf(b) - priceOf(b)) / compareOf(b) : 0;
          return db - da;
        }); break;
    }
    return l;
  }, [baseList, sort, vendor, inStock, onlyDiscount, priceMax, selectedOpts]);

  const clearFilters = () => {
    setVendor("all"); setInStock(false); setOnlyDiscount(false); setPriceMax(null); setSelectedOpts({});
  };

  const filtersContent = (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm mb-3">Marca</h3>
        <div className="space-y-1.5 max-h-56 overflow-auto pr-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={vendor === "all"} onChange={() => setVendor("all")} className="accent-ink" />
            Todas
          </label>
          {vendors.map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={vendor === v} onChange={() => setVendor(v)} className="accent-ink" />
              {v}
            </label>
          ))}
        </div>
      </div>

      {priceBounds.max > priceBounds.min && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Faixa de preço</h3>
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            step={Math.max(50, Math.round((priceBounds.max - priceBounds.min) / 50))}
            value={effectiveMax}
            onChange={(e) => setPriceMax(parseInt(e.target.value, 10))}
            className="w-full accent-ink"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>R$ {priceBounds.min}</span>
            <span className="font-semibold text-foreground">até R$ {effectiveMax}</span>
          </div>
          {priceMax !== null && (
            <button onClick={() => setPriceMax(null)} className="text-xs text-muted-foreground hover:text-ink mt-1 underline">
              Limpar
            </button>
          )}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">Disponibilidade</h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-ink" />
          Somente em estoque
        </label>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Promoções</h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={onlyDiscount} onChange={(e) => setOnlyDiscount(e.target.checked)} className="accent-ink" />
          Somente com desconto
        </label>
      </div>

      {dynamicFilters.map((f) => (
        <div key={f.name}>
          <h3 className="font-semibold text-sm mb-3 capitalize">{f.name}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedOpts((s) => { const n = { ...s }; delete n[f.name]; return n; })}
              className={`px-2.5 py-1 text-xs rounded-md border transition ${!selectedOpts[f.name] ? "bg-ink text-ink-foreground border-ink" : "border-border hover:border-ink"}`}
            >
              Todos
            </button>
            {f.values.map((v) => (
              <button
                key={v}
                onClick={() => setSelectedOpts((s) => ({ ...s, [f.name]: v }))}
                className={`px-2.5 py-1 text-xs rounded-md border transition ${selectedOpts[f.name] === v ? "bg-ink text-ink-foreground border-ink" : "border-border hover:border-ink"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button onClick={clearFilters} className="w-full text-sm text-muted-foreground hover:text-ink underline-offset-2 hover:underline">
        Limpar todos os filtros
      </button>

      <div className="pt-4 border-t border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Outras categorias</p>
        <ul className="space-y-1">
          {CATEGORIES.filter((c) => c.handle !== cat.handle).slice(0, 8).map((c) => (
            <li key={c.handle}>
              <Link to="/categoria/$handle" params={{ handle: c.handle }} className="text-sm text-muted-foreground hover:text-ink">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 pt-6">
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Link to="/" className="hover:text-ink">Início</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{cat.label}</span>
        </nav>
      </div>

      <header className="container mx-auto px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold">{cat.label}</h1>
          {cat.description && <p className="text-muted-foreground mt-2 max-w-2xl">{cat.description}</p>}
          <p className="text-sm text-muted-foreground mt-2">{list.length} {list.length === 1 ? "produto" : "produtos"}</p>
        </motion.div>
      </header>

      <div className="container mx-auto px-4 pb-16 grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="hidden lg:block">
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-32">
            {filtersContent}
          </div>
        </aside>

        {/* Mobile drawer */}
        {openFilters && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpenFilters(false)} />
            <div className="relative ml-auto h-full w-[85%] max-w-sm bg-card overflow-y-auto p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold">Filtros</h2>
                <button onClick={() => setOpenFilters(false)} aria-label="Fechar filtros">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {filtersContent}
              <button
                onClick={() => setOpenFilters(false)}
                className="mt-6 w-full h-12 rounded-full bg-ink text-ink-foreground font-semibold"
              >
                Ver {list.length} {list.length === 1 ? "produto" : "produtos"}
              </button>
            </div>
          </div>
        )}

        <main>
          <div className="flex items-center justify-between gap-3 mb-5">
            <button
              onClick={() => setOpenFilters(true)}
              className="lg:hidden inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border border-border"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filtros
            </button>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Ordenar:</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 rounded-lg border border-input bg-background text-sm px-3 focus:outline-none focus:border-ink"
              >
                <option value="relevance">Mais relevantes</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="discount">Maiores descontos</option>
                <option value="newest">Lançamentos</option>
                <option value="name">Nome (A–Z)</option>
              </select>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-2xl">
              <p className="font-display text-xl font-semibold">Nenhum produto encontrado com esses filtros.</p>
              <p className="text-sm text-muted-foreground mt-2">Ajuste os filtros ou explore as demais categorias.</p>
              <button onClick={clearFilters} className="mt-4 text-sm font-semibold text-ink underline">Limpar filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {list.map((p, i) => (<ProductCard key={p.node.id} product={p} index={i} />))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
