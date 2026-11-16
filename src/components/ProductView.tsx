import { Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Truck, CreditCard, RotateCcw, Loader2, ArrowRight, Star, Lock, ShoppingCart, ShoppingBag, ZapIcon, MapPin, MessageCircle } from "lucide-react";
import { fetchProductByHandle, fetchProducts, formatBRL, stripVendorFromTitle, whatsappProductInquiryUrl, hasUsableImage, isProductAvailable, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuestions } from "@/components/ProductQuestions";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductSpecSheet } from "@/components/ProductSpecSheet";
import { ProductDescriptionBlocks } from "@/components/ProductDescriptionBlocks";
import { ProductHighlights, hasProductHighlights } from "@/components/ProductHighlights";
import { ProductAccordion } from "@/components/ProductAccordion";
import { ProductVariantSelector } from "@/components/ProductVariantSelector";
import { isCommerciallyValidVariant, parseCommercialPrice } from "@/lib/productFamily";
import { INSTALLMENT_BADGE, INSTALLMENT_FULL, isCommerciallyAvailable } from "@/lib/commerce";

import { ZoomableImage } from "@/components/ZoomableImage";
import { PixelViewContent } from "@/components/PixelViewContent";
import { track, toNumericId } from "@/lib/pixel";



export const productQuery = (handle: string) =>
  queryOptions({
    queryKey: ["product", handle],
    queryFn: () => fetchProductByHandle(handle),
    staleTime: 60_000,
  });

const relatedQuery = (vendor: string, productType: string, handle: string) =>
  queryOptions({
    queryKey: ["related", vendor || productType || "all"],
    queryFn: async () => {
      const q = vendor ? `vendor:${JSON.stringify(vendor)}` : productType ? `product_type:${JSON.stringify(productType)}` : undefined;
      const list = await fetchProducts(12, q);
      return list
        .filter((p) => p.node.handle !== handle)
        .filter((p) => !/example product/i.test(p.node.title))
        .filter((p) => hasUsableImage(p.node) && isProductAvailable(p.node))
        .filter((p) => isCommerciallyAvailable(p))
        .slice(0, 4);
    },
    staleTime: 60_000,
  });

export function ProductView({ handle }: { handle: string }) {
  const { data: product } = useSuspenseQuery(productQuery(handle));

  const [variantId, setVariantId] = useState<string | null>(null);
  const [imageIdx, setImageIdx] = useState(0);

  // Ao navegar entre membros da família, nenhum estado do produto anterior
  // pode permanecer (variante, imagem, preço derivado).
  const productKey = product?.id ?? handle;
  const lastKeyRef = useRef(productKey);
  if (lastKeyRef.current !== productKey) {
    lastKeyRef.current = productKey;
    if (variantId !== null) setVariantId(null);
    if (imageIdx !== 0) setImageIdx(0);
  }

  const addItem = useCartStore((s) => s.addItem);
  const getCheckoutUrl = useCartStore((s) => s.getCheckoutUrl);
  const isLoading = useCartStore((s) => s.isLoading);

  const { data: related = [] } = useQuery(
    relatedQuery(product?.vendor ?? "", product?.productType ?? "", product?.handle ?? "")
  );

  const highlights = useMemo(() => extractHighlights(product?.description ?? ""), [product?.description]);
  const descriptionHtml = product?.descriptionHtml?.trim();

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-bold">Produto em breve</h2>
        <p className="text-muted-foreground mt-2">Este produto ainda não está disponível em nossa loja. Volte em breve!</p>
        <Link to="/" className="inline-block mt-6 bg-highlight text-highlight-foreground px-5 py-2.5 rounded-lg font-semibold">

          Voltar à loja
        </Link>
      </div>
    );
  }

  const allVariants = product.variants.edges.map((e) => e.node);
  const variant =
    (variantId ? allVariants.find((v) => v.id === variantId) : undefined) ??
    allVariants.find((v) => isCommerciallyValidVariant(v) && v.availableForSale) ??
    allVariants.find((v) => isCommerciallyValidVariant(v)) ??
    allVariants[0] ??
    null;
  const images = product.images.edges.map((e) => e.node);

  // Preço comercial: nunca cai para 0 por ausência/invalidez.
  const price = variant ? parseCommercialPrice(variant.price) : null;
  const hasValidPrice = price !== null && isCommerciallyValidVariant(variant);
  const canPurchase = hasValidPrice && !!variant?.availableForSale;

  const handleAdd = async () => {
    // Proteção lógica: nunca enviar variante inválida/indisponível ao carrinho.
    if (!variant || !isCommerciallyValidVariant(variant) || !variant.availableForSale) return false;
    await addItem({
      product: { node: product },
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions,
    });
    const contentId = toNumericId(variant.id);
    if (contentId && price !== null) {
      track("AddToCart", {
        content_ids: [contentId],
        content_type: "product",
        content_name: product.title,
        value: price,
        currency: "BRL",
        contents: [{ id: contentId, quantity: 1 }],
      });
    }
    return true;
  };

  const handleBuyNow = async () => {
    const ok = await handleAdd();
    if (!ok) return;
    const url = getCheckoutUrl();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };


  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <PixelViewContent
        contentId={hasValidPrice ? toNumericId(variant?.id) : null}
        contentName={product.title}
        value={hasValidPrice ? price : null}
      />
      <nav className="text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Início</Link>
        <span className="mx-2">/</span>
        <span>{product.productType || product.vendor}</span>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-3">
          <motion.div
            key={imageIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="aspect-square rounded-3xl border border-border bg-surface-muted p-3 md:p-4 shadow-sm"
          >
            <div className="w-full h-full rounded-2xl bg-[#f5f5f5] overflow-hidden p-6 md:p-10 flex items-center justify-center">
              {images[imageIdx] && (
                <ZoomableImage
                  src={images[imageIdx].url}
                  alt={images[imageIdx].altText ?? product.title}
                />
              )}
            </div>
          </motion.div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIdx(i)}
                  aria-label={`Imagem ${i + 1}`}
                  className={`aspect-square rounded-xl bg-[#f5f5f5] overflow-hidden p-2 border-2 transition-all duration-300 ease-out hover:-translate-y-0.5 ${i === imageIdx ? "border-ink shadow-sm" : "border-transparent hover:border-border"}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{product.vendor}</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 leading-tight">{stripVendorFromTitle(product.title, product.vendor)}</h1>

          {/* Estrelas placeholder (sem reviews fake) */}
          <div className="mt-3 flex items-center gap-2 text-sm">
            <div className="flex" aria-label="Sem avaliações ainda">
              {[0,1,2,3,4].map((i) => (
                <Star key={i} className="w-4 h-4 text-muted-foreground/40" />
              ))}
            </div>
            <span className="text-muted-foreground">Sem avaliações ainda</span>
          </div>

          {/* Estoque */}
          <div className="mt-3">
            {canPurchase ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success" /> Em estoque · Pronta entrega
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />{" "}
                {hasValidPrice ? "Produto indisponível no momento" : "Configuração indisponível"}
              </span>
            )}
          </div>

          <div className="mt-6 p-6 rounded-2xl bg-surface-muted">
            {hasValidPrice ? (
              <>
                <span className="font-display text-4xl font-bold text-ink">{formatBRL(price!)}</span>
                <p className="text-xs leading-snug text-muted-foreground mt-1">
                  {INSTALLMENT_FULL}
                </p>
              </>
            ) : (
              <>
                <span className="font-display text-2xl font-bold text-ink">Esta configuração não está disponível no momento.</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecione outra configuração disponível ou fale com a gente pelo WhatsApp.
                </p>
              </>
            )}
          </div>


          {/* Variantes entre produtos irmãos (cor / armazenamento) */}
          <ProductVariantSelector product={product} />

          {product.options.length > 0 && product.options[0].values.length > 1 && (
            <div className="mt-6 space-y-4">
              {product.options.map((opt) => (
                <div key={opt.name}>
                  <span className="text-sm font-semibold mb-2 block">{opt.name}</span>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.edges.map((v) => {
                      const value = v.node.selectedOptions.find((o) => o.name === opt.name)?.value;
                      if (!value) return null;
                      const active = v.node.id === variant?.id;
                      const invalid = !isCommerciallyValidVariant(v.node);
                      return (
                        <button
                          key={v.node.id}
                          onClick={() => !invalid && setVariantId(v.node.id)}
                          disabled={invalid}
                          title={invalid ? "Configuração indisponível" : undefined}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${active ? "bg-ink text-ink-foreground border-ink" : invalid ? "bg-card border-border text-muted-foreground/60 opacity-50 cursor-not-allowed line-through" : "bg-card border-border hover:border-ink"}`}
                        >
                          {invalid ? `${value} — Indisponível` : value}
                        </button>
                      );

                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            {canPurchase ? (
              <>
                <button
                  onClick={handleBuyNow}
                  disabled={isLoading}
                  className="h-14 bg-highlight text-highlight-foreground rounded-lg font-bold text-base flex items-center justify-center gap-2 hover:brightness-95 transition disabled:opacity-50 cursor-pointer order-1"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Comprar agora"}
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isLoading}
                  className="h-14 bg-card text-foreground border-2 border-ink rounded-lg font-semibold text-base flex items-center justify-center gap-2 hover:bg-ink hover:text-ink-foreground transition disabled:opacity-50 cursor-pointer order-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingCart className="w-5 h-5" /> Adicionar ao carrinho</>}
                </button>
              </>
            ) : (
              <a
                href={whatsappProductInquiryUrl({ title: product.title, handle: product.handle, vendor: product.vendor })}
                target="_blank"
                rel="noopener noreferrer"
                className="sm:col-span-2 h-14 bg-[#25D366] text-white rounded-lg font-bold text-base flex items-center justify-center gap-2 hover:brightness-95 transition cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" /> Consultar disponibilidade no WhatsApp
              </a>
            )}
          </div>

          

          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { Icon: CreditCard, label: INSTALLMENT_BADGE },
              { Icon: ZapIcon, label: "PIX" },
              { Icon: Lock, label: "Compra 100% segura" },
              { Icon: ShieldCheck, label: "Garantia conforme política do produto" },
              { Icon: RotateCcw, label: "7 dias para troca" },
              { Icon: Truck, label: "Frete calculado no checkout" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4 text-highlight-foreground bg-highlight rounded-full p-0.5 shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Descrição + Ficha Técnica em acordeão */}
      <div className="mt-14 space-y-4">
        <ProductAccordion title="Descrição" defaultOpen>
          <ProductDescriptionBlocks
            title={product.title}
            description={product.description ?? ""}
            descriptionHtml={product.descriptionHtml}
            images={images}
          />
        </ProductAccordion>

        {hasProductHighlights(product.descriptionHtml) && (
          <ProductAccordion title="Principais Destaques" defaultOpen={false}>
            <ProductHighlights descriptionHtml={product.descriptionHtml} />
          </ProductAccordion>
        )}


        <ProductAccordion title="Ficha Técnica" defaultOpen={false}>
          <ProductSpecSheet
            embedded
            description={product.description ?? ""}
            descriptionHtml={product.descriptionHtml}
            title={product.title}
            vendor={product.vendor}
            productType={product.productType}
            tags={product.tags}
            variantOptions={variant?.selectedOptions}
            sku={hasValidPrice ? (variant as { sku?: string } | null)?.sku ?? undefined : undefined}
            barcode={hasValidPrice ? (variant as { barcode?: string } | null)?.barcode ?? undefined : undefined}

          />
        </ProductAccordion>

        <section className="rounded-2xl border border-border bg-card px-5 md:px-7 py-6">
          <h3 className="font-display text-lg md:text-xl font-bold mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-highlight" /> Compra segura com suporte GDN
          </h3>
          <div className="text-sm text-foreground/85 leading-relaxed space-y-3">
            <p>
              Todos os produtos contam com garantia legal e suporte dedicado da GDN Store. Em caso de defeito de fabricação ou divergência no recebimento, nossa equipe acompanha o atendimento de forma próxima, transparente e organizada.
            </p>
            <Link to="/garantia" className="inline-flex items-center gap-1 text-ink hover:text-highlight font-semibold">
              Saiba mais sobre a garantia <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>


      {product.tags?.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {product.tags.slice(0, 8).map((t) => (
            <span key={t} className="text-xs px-3 py-1 rounded-full bg-surface-muted text-muted-foreground">{t}</span>
          ))}
        </div>
      )}

      <ProductQuestions
        shopifyProductId={product.id}
        productHandle={product.handle}
        returnTo={`/product/${product.handle}`}
      />
      <ProductReviews shopifyProductId={product.id} productHandle={product.handle} />

      {/* Produtos relacionados */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">Você também pode gostar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {related.map((p: ShopifyProduct, i) => (
              <ProductCard key={p.node.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface SpecMeta {
  title?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  variantOptions?: Array<{ name: string; value: string }>;
  available?: boolean;
}

/** Build a rich spec list from description "Key: Value" lines + product metadata + smart inference. */
function extractSpecs(desc: string, meta: SpecMeta = {}): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const seen = new Set<string>();
  const push = (k: string, v?: string | null) => {
    if (!k || !v) return;
    const key = k.trim();
    const val = String(v).trim();
    const dedupKey = key.toLowerCase();
    if (!val || seen.has(dedupKey)) return;
    if (key.length > 32 || val.length > 100) return;
    seen.add(dedupKey);
    out.push([key, val]);
  };

  const title = meta.title ?? "";
  const t = title.toLowerCase();
  const vendor = meta.vendor ?? inferVendor(title);

  if (vendor) push("Marca", vendor);
  if (meta.productType) push("Categoria", meta.productType);

  // Variant options (cor, tamanho, capacidade selecionada)
  for (const opt of meta.variantOptions ?? []) {
    if (opt.value && opt.value.toLowerCase() !== "default title") push(opt.name, opt.value);
  }

  // Modelo / linha (ex: iPhone 17 Pro Max, MacBook Pro, Galaxy S24 Ultra)
  const modelo = inferModelLine(title);
  if (modelo) push("Modelo", modelo);

  // Armazenamento e RAM: pega todos os tokens de capacidade no título.
  // O ÚLTIMO é o armazenamento; quando há um GB "pequeno" (≤64GB)
  // junto com outro maior ou TB, o pequeno é a RAM.
  const capacityMatches = Array.from(title.matchAll(/\b(\d+)\s?(GB|TB)\b/gi));
  const gbMatches = capacityMatches.filter((m) => m[2].toUpperCase() === "GB");
  const hasTb = capacityMatches.some((m) => m[2].toUpperCase() === "TB");

  if (capacityMatches.length > 0) {
    const last = capacityMatches[capacityMatches.length - 1];
    const lastVal = parseInt(last[1], 10);
    const lastUnit = last[2].toUpperCase();
    push("Armazenamento", `${lastVal} ${lastUnit}`);
  }

  // RAM explícita (ex: 8GB RAM, 16GB de memória)
  const explicitRam = title.match(/\b(\d+)\s?GB\s*(RAM|de\s*mem[óo]ria)\b/i);
  if (explicitRam) {
    push("Memória RAM", `${explicitRam[1]} GB`);
  } else if (gbMatches.length > 0 && (gbMatches.length >= 2 || hasTb)) {
    // Se há múltiplos GB ou GB+TB, o menor GB (quando ≤64GB) provavelmente é RAM
    const smallestGb = gbMatches
      .map((m) => parseInt(m[1], 10))
      .sort((a, b) => a - b)[0];
    if (smallestGb <= 64 && !seen.has("memória ram")) {
      push("Memória RAM", `${smallestGb} GB`);
    }
  }

  // Cor a partir do título (quando não há variante)
  const cor = inferColor(title);
  if (cor && !seen.has("cor")) push("Cor", cor);

  // Tela / display
  const screen = inferScreenSize(title);
  if (screen) push("Tela", screen);

  // Chip / processador
  const chip = inferChip(title);
  if (chip) push("Processador", chip);

  // Conectividade
  if (/\b5G\b/i.test(title)) push("Conectividade", "5G");
  else if (/\b4G\b/i.test(title)) push("Conectividade", "4G LTE");

  // Sistema operacional inferido
  const so = inferOS(title, vendor);
  if (so) push("Sistema operacional", so);

  // Câmera (ex: 48MP, 200MP)
  const cam = title.match(/(\d{2,3})\s?MP/i);
  if (cam) push("Câmera principal", `${cam[1]} MP`);

  // Apple Watch case
  const watchCase = title.match(/(\d{2})\s?mm/i);
  if (watchCase && /watch/i.test(t)) push("Tamanho da caixa", `${watchCase[1]} mm`);

  // Geração / ano
  const gen = title.match(/\((\d{4})\)|\b(\d{1,2})ª?\s*gera[çc][ãa]o/i);
  if (gen) push("Geração", gen[1] ? gen[1] : `${gen[2]}ª geração`);

  // Linhas do "Key: Value" da descrição
  if (desc) {
    const lines = desc.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const cleaned = line.replace(/^[\-\*•·▪◦]\s*/, "");
      const m = cleaned.match(/^([A-Za-zÀ-ÿ0-9 \-/()]+?)\s*[:：]\s*(.+)$/);
      if (m && !/^https?:/.test(m[2])) push(m[1], m[2]);
      if (out.length >= 20) break;
    }
  }

  if (meta.tags?.length) {
    const interesting = meta.tags.filter((tag) => !/^(novo|destaque|promo|oferta)$/i.test(tag)).slice(0, 3);
    if (interesting.length) push("Tags", interesting.join(", "));
  }

  if (typeof meta.available === "boolean") push("Disponibilidade", meta.available ? "Em estoque" : "Indisponível");

  return out;
}

function inferVendor(title: string): string {
  const t = title.toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/\b(iphone|ipad|macbook|imac|airpods|apple\s*watch|apple)\b/, "Apple"],
    [/\b(galaxy|samsung)\b/, "Samsung"],
    [/\b(xiaomi|redmi|poco)\b/, "Xiaomi"],
    [/\b(playstation|ps5|ps4|dualsense)\b/, "Sony"],
    [/\b(xbox)\b/, "Microsoft"],
    [/\b(nintendo|switch)\b/, "Nintendo"],
    [/\b(motorola|moto\s*g|moto\s*edge)\b/, "Motorola"],
    [/\b(pixel)\b/, "Google"],
    [/\b(huawei|honor)\b/, "Huawei"],
    [/\b(jbl)\b/, "JBL"],
    [/\b(dell|alienware)\b/, "Dell"],
    [/\b(lenovo|thinkpad)\b/, "Lenovo"],
    [/\b(asus|rog)\b/, "Asus"],
  ];
  for (const [re, name] of map) if (re.test(t)) return name;
  return "";
}

function inferModelLine(title: string): string {
  const patterns = [
    /iPhone\s*\d+\s*(Pro\s*Max|Pro|Plus|Mini)?/i,
    /iPad\s*(Pro|Air|Mini)?\s*\d*/i,
    /MacBook\s*(Pro|Air)\s*\d*/i,
    /Apple\s*Watch\s*(Ultra\s*\d*|Series\s*\d+|SE)/i,
    /AirPods\s*(Pro|Max)?\s*\d*/i,
    /Galaxy\s*[A-Z]?\s*\d+\s*(Ultra|Plus|FE)?/i,
    /Galaxy\s*(Note|Z\s*Fold|Z\s*Flip|Tab)\s*\d+/i,
    /PlayStation\s*\d+|PS\s*\d+/i,
    /Xbox\s*(Series\s*[XS]|One)/i,
    /Nintendo\s*Switch\s*(OLED|Lite|\d+)?/i,
    /Pixel\s*\d+\s*(Pro|XL|a)?/i,
    /Redmi\s*(Note)?\s*\d+\s*(Pro)?/i,
  ];
  for (const re of patterns) {
    const m = title.match(re);
    if (m) return m[0].replace(/\s+/g, " ").trim();
  }
  return "";
}

function inferColor(title: string): string {
  const t = title.toLowerCase();
  const colors: Array<[RegExp, string]> = [
    [/titânio\s*natural|natural\s*titanium/, "Titânio Natural"],
    [/titânio\s*azul|blue\s*titanium/, "Titânio Azul"],
    [/titânio\s*preto|black\s*titanium/, "Titânio Preto"],
    [/titânio\s*branco|white\s*titanium/, "Titânio Branco"],
    [/titânio\s*deserto|desert\s*titanium/, "Titânio Deserto"],
    [/space\s*black|preto\s*espacial/, "Preto Espacial"],
    [/midnight|meia[\s-]?noite/, "Meia-noite"],
    [/starlight|estelar/, "Estelar"],
    [/\bpreto\b|\bblack\b/, "Preto"],
    [/\bbranco\b|\bwhite\b/, "Branco"],
    [/\bazul\b|\bblue\b/, "Azul"],
    [/\bverde\b|\bgreen\b/, "Verde"],
    [/\bvermelho\b|\bred\b/, "Vermelho"],
    [/\bdourado\b|\bgold\b/, "Dourado"],
    [/\bprateado\b|\bsilver\b/, "Prateado"],
    [/\brosa\b|\bpink\b/, "Rosa"],
    [/\broxo\b|\bpurple\b/, "Roxo"],
    [/\bcinza\b|\bgray\b|\bgrey\b/, "Cinza"],
  ];
  for (const [re, name] of colors) if (re.test(t)) return name;
  return "";
}

function inferScreenSize(title: string): string {
  const t = title.toLowerCase();
  // Polegadas explícitas
  const explicit = title.match(/(\d{1,2}[.,]?\d?)\s?(?:"|''|polegadas|inch|in\b)/i);
  if (explicit) return `${explicit[1].replace(",", ".")}"`;

  // iPhone models
  const iphone: Record<string, string> = {
    "17 pro max": '6,9" Super Retina XDR OLED',
    "17 pro": '6,3" Super Retina XDR OLED',
    "17 plus": '6,7" Super Retina XDR OLED',
    "17": '6,1" Super Retina XDR OLED',
    "16 pro max": '6,9" Super Retina XDR OLED',
    "16 pro": '6,3" Super Retina XDR OLED',
    "16 plus": '6,7" Super Retina XDR OLED',
    "16": '6,1" Super Retina XDR OLED',
    "15 pro max": '6,7" Super Retina XDR OLED',
    "15 pro": '6,1" Super Retina XDR OLED',
    "15 plus": '6,7" Super Retina XDR OLED',
    "15": '6,1" Super Retina XDR OLED',
    "14 pro max": '6,7" Super Retina XDR OLED',
    "14 pro": '6,1" Super Retina XDR OLED',
    "14 plus": '6,7" Super Retina XDR OLED',
    "14": '6,1" Super Retina XDR OLED',
    "13 pro max": '6,7" Super Retina XDR OLED',
    "13 pro": '6,1" Super Retina XDR OLED',
    "13": '6,1" Super Retina XDR OLED',
    "13 mini": '5,4" Super Retina XDR OLED',
  };
  if (/iphone/.test(t)) {
    for (const key of Object.keys(iphone)) {
      if (t.includes(`iphone ${key}`)) return iphone[key];
    }
  }

  // MacBook
  if (/macbook\s*air/i.test(title)) {
    if (/15/.test(title)) return '15,3" Liquid Retina';
    return '13,6" Liquid Retina';
  }
  if (/macbook\s*pro/i.test(title)) {
    if (/16/.test(title)) return '16,2" Liquid Retina XDR';
    if (/14/.test(title)) return '14,2" Liquid Retina XDR';
    return '13,3" Retina';
  }

  // iPad
  if (/ipad\s*pro/i.test(title)) {
    if (/13/.test(title)) return '13" Ultra Retina XDR';
    if (/11/.test(title)) return '11" Ultra Retina XDR';
  }
  if (/ipad\s*air/i.test(title)) {
    if (/13/.test(title)) return '13" Liquid Retina';
    return '11" Liquid Retina';
  }
  if (/ipad\s*mini/i.test(title)) return '8,3" Liquid Retina';

  return "";
}

function inferChip(title: string): string {
  const m = title.match(/\b(A\d{2}\s*(?:Pro|Bionic)?|M\d\s*(?:Pro|Max|Ultra)?|Snapdragon\s*\d+\s*(?:Gen\s*\d)?|Exynos\s*\d+|Dimensity\s*\d+|Tensor\s*G?\d*)\b/i);
  if (m) return m[1].replace(/\s+/g, " ");
  const t = title.toLowerCase();
  if (/iphone\s*17\s*pro/.test(t)) return "Apple A19 Pro";
  if (/iphone\s*17/.test(t)) return "Apple A19";
  if (/iphone\s*16\s*pro/.test(t)) return "Apple A18 Pro";
  if (/iphone\s*16/.test(t)) return "Apple A18";
  if (/iphone\s*15\s*pro/.test(t)) return "Apple A17 Pro";
  if (/iphone\s*15/.test(t)) return "Apple A16 Bionic";
  if (/iphone\s*14\s*pro/.test(t)) return "Apple A16 Bionic";
  if (/iphone\s*14/.test(t)) return "Apple A15 Bionic";
  return "";
}

function inferOS(title: string, vendor: string): string {
  const t = title.toLowerCase();
  if (/iphone/.test(t)) return "iOS";
  if (/ipad/.test(t)) return "iPadOS";
  if (/macbook|imac|mac\s*mini/.test(t)) return "macOS";
  if (/apple\s*watch/.test(t)) return "watchOS";
  if (/galaxy|pixel|motorola|moto\s*g|xiaomi|redmi|poco/.test(t)) return "Android";
  if (/playstation|ps[45]/.test(t)) return "PlayStation OS";
  if (/xbox/.test(t)) return "Xbox OS";
  if (/switch/.test(t)) return "Nintendo Switch OS";
  if (vendor === "Apple") return "iOS";
  return "";
}

/** Pull short, scannable highlight bullets from a free-form description. */
function extractHighlights(desc: string): string[] {
  if (!desc) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (s: string) => {
    const t = s.replace(/\s+/g, " ").trim().replace(/[.;]+$/, "");
    const key = t.toLowerCase();
    if (t.length < 20 || t.length > 140 || seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };

  // Bullet lines first
  for (const raw of desc.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l) continue;
    if (/^[\-\*•·▪◦]\s+/.test(l)) add(l.replace(/^[\-\*•·▪◦]\s+/, ""));
    if (out.length >= 6) break;
  }

  // Fallback: split sentences
  if (out.length < 4) {
    const sentences = desc.replace(/\n+/g, " ").split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      if (/[:：]/.test(s) && s.length < 80) continue; // skip spec-looking lines
      add(s);
      if (out.length >= 6) break;
    }
  }

  return out.slice(0, 6);
}


