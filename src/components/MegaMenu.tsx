import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { MEGA_MENU, type MegaItem, type MegaLinkTarget } from "@/lib/megaMenu";

function TargetLink({
  target,
  className,
  onClick,
  children,
}: {
  target: MegaLinkTarget;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  switch (target.kind) {
    case "collection":
      return (
        <Link
          to="/collections/$handle"
          params={{ handle: target.handle }}
          className={className}
          onClick={onClick}
        >
          {children}
        </Link>
      );
    case "brand":
      return (
        <Link
          to="/marca/$handle"
          params={{ handle: target.handle }}
          className={className}
          onClick={onClick}
        >
          {children}
        </Link>
      );
    case "search":
      return (
        <Link
          to="/buscar"
          search={{ q: target.q }}
          className={className}
          onClick={onClick}
        >
          {children}
        </Link>
      );
    case "route":
      return (
        <Link
          to={target.to as never}
          className={className}
          onClick={onClick}
        >
          {children}
        </Link>
      );
  }
}

function DesktopItem({ item }: { item: MegaItem }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenu = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };
  const closeMenu = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const hasGroups = !!item.groups?.length;

  const label = (
    <span className="inline-flex items-center gap-1">
      {item.label}
      {hasGroups && <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
    </span>
  );

  const trigger = item.target ? (
    <TargetLink
      target={item.target}
      className="block px-2 lg:px-4 py-2.5 lg:py-3 text-[13px] lg:text-sm font-medium text-white/80 hover:text-highlight transition whitespace-nowrap"
    >
      {label}
    </TargetLink>
  ) : (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="block px-2 lg:px-4 py-2.5 lg:py-3 text-[13px] lg:text-sm font-medium text-white/80 hover:text-highlight transition whitespace-nowrap"
    >
      {label}
    </button>
  );

  // Mantém o painel dentro da viewport: mede a posição real e desloca
  // horizontalmente o necessário para não sair pela esquerda/direita.
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [shift, setShift] = useState(0);
  const shiftRef = useRef(0);
  shiftRef.current = shift;

  useIsoLayoutEffect(() => {
    if (!open) {
      setShift(0);
      return;
    }
    const adjust = () => {
      const el = panelRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // posição "sem deslocamento" = posição atual menos o shift já aplicado
      const left = r.left - shiftRef.current;
      const right = r.right - shiftRef.current;
      const margin = 12;
      let next = 0;
      if (left < margin) next = margin - left;
      else if (right > window.innerWidth - margin) next = window.innerWidth - margin - right;
      if (next !== shiftRef.current) setShift(next);
    };
    adjust();
    window.addEventListener("resize", adjust);
    window.addEventListener("scroll", adjust, { passive: true });
    return () => {
      window.removeEventListener("resize", adjust);
      window.removeEventListener("scroll", adjust);
    };
  }, [open, shift]);


  return (
    <li
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onFocus={openMenu}
      onBlur={closeMenu}
    >
      {trigger}
      {hasGroups && open && (
        <div
          ref={panelRef}
          style={{ ["--mm-shift" as string]: `${shift}px` }}
          className="absolute left-1/2 top-full pt-2 z-50 translate-x-[calc(-50%+var(--mm-shift,0px))]"
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
        >
          <div className="w-[min(92vw,520px)] bg-card text-foreground rounded-2xl shadow-2xl border border-border p-4 lg:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {item.groups!.map((g) => (
              <div key={g.title}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  {g.title}
                </p>
                <ul className="space-y-1">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <TargetLink
                        target={l.target}
                        className="block px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-surface-muted hover:text-highlight-foreground transition"
                        onClick={() => setOpen(false)}
                      >
                        {l.label}
                      </TargetLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}


export function MegaMenuDesktop() {
  return (
    <ul className="hidden md:flex flex-wrap items-center justify-center gap-x-0.5 gap-y-0 lg:gap-1 overflow-visible">
      {MEGA_MENU.map((item) => (
        <DesktopItem key={item.label} item={item} />
      ))}
    </ul>
  );
}

export function MegaMenuMobile({ onNavigate }: { onNavigate: () => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <ul>
      {MEGA_MENU.map((item, idx) => {
        const hasGroups = !!item.groups?.length;
        const isOpen = openIdx === idx;
        return (
          <li key={item.label} className="border-b border-white/5">
            <div className="flex items-stretch">
              {item.target ? (
                <TargetLink
                  target={item.target}
                  className="flex-1 block px-4 py-3 text-sm text-white/90 hover:bg-white/5"
                  onClick={onNavigate}
                >
                  {item.label}
                </TargetLink>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex-1 text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5"
                >
                  {item.label}
                </button>
              )}
              {hasGroups && (
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-label={isOpen ? "Fechar submenu" : "Abrir submenu"}
                  className="px-4 text-white/70 hover:text-white"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
            {hasGroups && isOpen && (
              <div className="bg-white/5 px-2 py-2">
                {item.groups!.map((g) => (
                  <div key={g.title} className="mb-2 last:mb-0">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                      {g.title}
                    </p>
                    <ul>
                      {g.links.map((l) => (
                        <li key={l.label}>
                          <TargetLink
                            target={l.target}
                            className="block px-4 py-2 text-sm text-white/85 hover:bg-white/10 rounded"
                            onClick={onNavigate}
                          >
                            {l.label}
                          </TargetLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
