import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { HeroCarousel } from "@/components/HeroCarousel";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ProductSection } from "@/components/ProductSection";
import { PromoBanners, NewsletterSection, BrandsStrip } from "@/components/MarketingSections";
import { fetchProducts, hasUsableImage, isProductAvailable } from "@/lib/shopify";
import { isCommerciallyAvailable } from "@/lib/commerce";

const allProductsQuery = queryOptions({
  queryKey: ["products", "all"],
  queryFn: () => fetchProducts(150),
  staleTime: 60_000,
});

const gamesQuery = queryOptions({
  queryKey: ["products", "games"],
  queryFn: () =>
    fetchProducts(
      50,
      "product_type:Games OR product_type:Console* OR product_type:Videogame* OR tag:games OR tag:console OR tag:playstation OR tag:xbox OR tag:nintendo OR title:playstation OR title:xbox OR title:nintendo OR title:switch OR title:console",
    ),
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(allProductsQuery),
      context.queryClient.ensureQueryData(gamesQuery),
    ]),
  head: () => ({
    meta: [
      { title: "GDN Store · Tecnologia Premium" },
      { name: "description", content: "Notebooks, smartphones, games e acessórios das melhores marcas. Parcelamento no cartão e envio com rastreio." },
      { property: "og:title", content: "GDN Store · Tecnologia Premium" },
      { property: "og:description", content: "Notebooks, smartphones, games e acessórios das melhores marcas. Parcelamento no cartão e envio com rastreio." },
      { property: "og:url", content: "https://gdnstore.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://gdnstore.com.br/" }],
  }),
  component: Home,
});

// Pick items round-robin across buckets (by key) so a section shows variety
function diversify<T>(items: T[], keyFn: (t: T) => string, limit: number): T[] {
  const buckets = new Map<string, T[]>();
  for (const it of items) {
    const k = (keyFn(it) || "_").toLowerCase();
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(it);
  }
  const queues = Array.from(buckets.values());
  const out: T[] = [];
  let progress = true;
  while (out.length < limit && progress) {
    progress = false;
    for (const q of queues) {
      if (out.length >= limit) break;
      const next = q.shift();
      if (next) {
        out.push(next);
        progress = true;
      }
    }
  }
  return out;
}

function shuffle<T>(arr: T[], seed = 1): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Home() {
  const { data: products } = useSuspenseQuery(allProductsQuery);
  const { data: gamesData } = useSuspenseQuery(gamesQuery);

  // Filter out demo "Example product" entries, products without a usable image,
  // and unavailable products — home sections só mostram produtos vendáveis.
  const real = products
    .filter((p) => !/example product/i.test(p.node.title))
    .filter((p) => hasUsableImage(p.node))
    .filter((p) => isProductAvailable(p.node))
    .filter((p) => isCommerciallyAvailable(p));

  // Seed fixa: a ordem precisa ser idêntica no servidor e no cliente,
  // caso contrário a hidratação do React falha.
  const seed = 7;
  const shuffled = shuffle(real, seed);

  const notebooks = real.filter((p) => /notebook|macbook/i.test(p.node.productType + " " + p.node.title));
  const smartphones = real.filter((p) => /celulares|smartphone/i.test(p.node.productType));
  const gameRe = /console|game|videogame|playstation|\bps[345]\b|xbox|nintendo|switch|controle|joystick/i;
  // Merge dedicated games query with any games found in the general product set
  const gamesMap = new Map<string, (typeof real)[number]>();
  for (const p of gamesData
    .filter((p) => !/example product/i.test(p.node.title))
    .filter((p) => hasUsableImage(p.node) && isProductAvailable(p.node) && isCommerciallyAvailable(p))) {
    gamesMap.set(p.node.id, p);
  }
  for (const p of real) {
    if (gameRe.test(`${p.node.productType} ${p.node.title} ${p.node.vendor} ${(p.node.tags || []).join(" ")}`)) {
      gamesMap.set(p.node.id, p);
    }
  }
  const games = Array.from(gamesMap.values());

  // Featured: diversified across productType
  const featured = diversify(shuffled, (p) => p.node.productType || p.node.vendor || "", 8);

  // New arrivals: take the tail, also diversified, excluding what's already in featured
  const featuredIds = new Set(featured.map((p) => p.node.id));
  const tail = [...real].reverse().filter((p) => !featuredIds.has(p.node.id));
  const newArrivals = diversify(shuffle(tail, seed + 1), (p) => p.node.productType || p.node.vendor || "", 8);

  return (
    <>
      <HeroCarousel />

      <BrandsStrip />





      {real.length === 0 ? (
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="font-display text-2xl font-bold">Nenhum produto encontrado</h2>
          <p className="text-muted-foreground mt-2">Adicione produtos na sua loja Shopify para vê-los aqui.</p>
        </div>
      ) : (
        <>
          <ProductSection
            eyebrow="DESTAQUES"
            title="Destaques"
            products={featured}
          />


          <PromoBanners />

          {smartphones.length > 0 && (
            <ProductSection eyebrow="Smartphones" title="Smartphones de última geração" products={diversify(shuffle(smartphones, seed + 2), (p) => p.node.vendor || "", 8)} />
          )}

          <CategoryGrid />

          {notebooks.length > 0 && (
            <ProductSection eyebrow="Computadores" title="Notebooks para alta performance" products={diversify(shuffle(notebooks, seed + 3), (p) => p.node.vendor || "", 8)} />
          )}

          {games.length > 0 && (
            <ProductSection eyebrow="Games" title="Games e acessórios" products={diversify(shuffle(games, seed + 4), (p) => p.node.vendor || "", 8)} />
          )}

          <ProductSection eyebrow="Novidades" title="Acabaram de chegar" products={newArrivals} />

          <NewsletterSection />
        </>
      )}
    </>
  );
}

