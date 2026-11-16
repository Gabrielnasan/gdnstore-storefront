import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, User, Heart, ShoppingBag, Menu, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { filterSearchableProducts } from "@/lib/searchFilters";
import { MegaMenuDesktop, MegaMenuMobile } from "@/components/MegaMenu";
import { getCurrentCustomer, getCustomerSessionToken, redirectToLogin } from "@/lib/customerSession";
import { getCurrentAdmin } from "@/lib/adminQuestions";
import logo from "@/assets/logo-gdn.svg";



export function Header() {
  const items = useCartStore((s) => s.items);
  const setOpen = useCartStore((s) => s.setOpen);
  const totalItems = items.reduce((a, b) => a + b.quantity, 0);
  const wishCount = useWishlistStore((s) => s.items.length);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<ShopifyProduct[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountLabel, setAccountLabel] = useState<string>("Conta");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!getCustomerSessionToken()) {
      setIsAdmin(false);
      setLoggedIn(false);
      setAccountLabel("Conta");
      return;
    }
    (async () => {
      const [adminRes, custRes] = await Promise.all([
        getCurrentAdmin(),
        getCurrentCustomer(),
      ]);
      if (cancelled) return;
      setIsAdmin(adminRes.admin === true);
      if (custRes.authenticated) {
        setLoggedIn(true);
        const c = custRes.customer;
        const first =
          (c.display_name && c.display_name.trim().split(/\s+/)[0]) ||
          c.first_name ||
          (c.email ? c.email.split("@")[0] : null);
        const label = (first || "Conta").trim();
        setAccountLabel(label.length > 14 ? `${label.slice(0, 13)}…` : label);
      } else {
        setLoggedIn(false);
        setAccountLabel("Conta");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    if (getCustomerSessionToken()) {
      navigate({ to: "/minha-conta" });
    } else {
      redirectToLogin("/minha-conta");
    }
  };

  // Live search suggestions (debounced)
  useEffect(() => {
    const t = search.trim();
    if (t.length < 2) { setSuggestions([]); setLoadingSuggest(false); return; }
    setLoadingSuggest(true);
    const id = setTimeout(async () => {
      try {
        // Busca mais itens do que exibimos: produtos com preço inválido são
        // removidos e não podem "consumir" o limite de sugestões.
        const res = await fetchProducts(30, `title:*${t.replace(/"/g, "")}* OR vendor:*${t.replace(/"/g, "")}*`);
        setSuggestions(filterSearchableProducts(res).slice(0, 6));
      } catch { setSuggestions([]); }
      finally { setLoadingSuggest(false); }
    }, 250);
    return () => clearTimeout(id);
  }, [search]);

  // Close suggestions on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowSuggest(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = search.trim();
    if (!q) return;
    setShowSuggest(false);
    setMobileOpen(false);
    navigate({ to: "/buscar", search: { q } });
  };

  return (
    <header className="sticky top-0 z-50 bg-ink text-ink-foreground border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-ink/95">

      <div className="container mx-auto px-4 py-4 grid grid-cols-[auto_1fr_auto] items-center gap-6">
        <Link to="/" className="flex items-center shrink-0 group" aria-label="GDN Store">
          <img src={logo} alt="GDN Store" className="h-[60px] md:h-[83px] w-auto max-w-none object-contain block transition-transform group-hover:scale-[1.03]" />
        </Link>

        <div ref={wrapRef} className="hidden md:flex relative justify-self-center w-full max-w-xl">
          <form onSubmit={submitSearch} className="w-full relative">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggest(true); }}
              onFocus={() => setShowSuggest(true)}
              placeholder="O que você procura hoje?"
              aria-label="Buscar produtos"
              className="w-full h-11 pl-12 pr-4 rounded-lg bg-white border border-white/20 text-ink placeholder:text-ink/50 text-sm focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight transition shadow-sm"
            />
            <button type="submit" aria-label="Buscar" className="absolute left-0 top-0 h-11 w-12 flex items-center justify-center text-ink/70 hover:text-ink">
              <Search className="w-5 h-5" />
            </button>
          </form>
          <AnimatePresence>
            {showSuggest && search.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card text-foreground rounded-2xl shadow-2xl border border-border overflow-hidden z-50"
              >
                {loadingSuggest ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Buscando…</p>
                ) : suggestions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum resultado.</p>
                ) : (
                  <ul className="py-2 max-h-96 overflow-auto">
                    {suggestions.map((s) => {
                      const img = s.node.images.edges[0]?.node;
                      return (
                        <li key={s.node.id}>
                          <Link
                            to="/product/$handle"
                            params={{ handle: s.node.handle }}
                            onClick={() => setShowSuggest(false)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-muted"
                          >
                            <div className="w-10 h-10 rounded bg-surface-muted overflow-hidden flex-shrink-0">
                              {img && <img src={img.url} alt="" className="w-full h-full object-contain" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{s.node.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{s.node.vendor}</p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <button
                  onClick={() => submitSearch()}
                  className="block w-full text-left px-4 py-2.5 text-sm font-semibold bg-surface-muted hover:bg-highlight hover:text-highlight-foreground border-t border-border"
                >
                  Ver todos os resultados para "{search.trim()}" →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <a href="/minha-conta" onClick={handleAccountClick} className="hidden md:flex flex-col items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition max-w-[120px]">
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 truncate max-w-full">{loggedIn ? accountLabel : "Conta"}</span>
          </a>
          {isAdmin && (
            <Link to="/admin" className="hidden md:flex flex-col items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition" activeProps={{ className: "text-highlight" }}>
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Admin</span>
            </Link>
          )}
          <Link to="/favoritos" className="hidden md:flex flex-col items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition relative group">
            <Heart className={`w-5 h-5 transition ${wishCount > 0 ? "fill-highlight text-highlight" : "group-hover:scale-110"}`} />
            <span className="text-[10px] mt-0.5">Favoritos</span>
            {wishCount > 0 && (
              <span className="absolute -top-0.5 right-1 w-5 h-5 rounded-full bg-highlight text-ink text-[10px] font-bold flex items-center justify-center">
                {wishCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="relative flex flex-col items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition"
            aria-label="Abrir carrinho"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden md:block text-[10px] mt-0.5">Carrinho</span>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 right-1 w-5 h-5 rounded-full bg-highlight text-ink text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden p-2" aria-label="Menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="md:hidden container mx-auto px-4 pb-3">
        <form onSubmit={submitSearch} className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="O que você procura hoje?"
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white border border-white/20 text-ink placeholder:text-ink/50 text-sm focus:outline-none focus:ring-2 focus:ring-highlight focus:border-highlight"
          />
          <button type="submit" aria-label="Buscar" className="absolute left-0 top-0 h-10 w-10 flex items-center justify-center text-ink/70">
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      <nav className="border-t border-white/10 bg-ink">
        <div className="container mx-auto px-4">
          <div className="hidden md:block">
            <MegaMenuDesktop />
          </div>
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden"
              >
                <ul>
                  <li className="border-b border-white/5 flex">
                    <a href="/minha-conta" onClick={handleAccountClick} className="flex-1 px-4 py-3 text-sm text-white/90 hover:bg-white/5 flex items-center gap-2">
                      <User className="w-4 h-4" /> Minha conta
                    </a>
                    <Link to="/favoritos" aria-label={`Favoritos (${wishCount})`} onClick={() => setMobileOpen(false)} className="px-4 py-3 text-sm text-white/90 hover:bg-white/5 flex items-center gap-2 border-l border-white/5">
                      <Heart className={`w-4 h-4 ${wishCount > 0 ? "fill-highlight text-highlight" : ""}`} /> {wishCount}
                    </Link>
                  </li>
                  {isAdmin && (
                    <li className="border-b border-white/5">
                      <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Admin
                      </Link>
                    </li>
                  )}
                </ul>
                <MegaMenuMobile onNavigate={() => setMobileOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

    </header>
  );
}
