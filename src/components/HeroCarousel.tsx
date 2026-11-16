import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroIphoneMacbook from "@/assets/hero-iphone-macbook.png";
import heroIphoneMobile from "@/assets/hero-iphone-mobile.png";
import heroMacbook from "@/assets/hero-macbook.png";
import heroMacbookMobile from "@/assets/hero-macbook-mobile.png";
const consolesBanner = { url: "/images/banners/banners-gdn-solucoes-consoles.svg" };
const consolesBannerMobile = { url: "/images/banners/banners-gdn-solucoes-consoles-mobile.svg" };

type SlideLink =
  | { to: "/product/$handle"; handle: string }
  | { to: "/categoria/$handle"; handle: string };

interface Slide {
  link: SlideLink;
  image: string;
  imageMobile?: string;
  imageAlt: string;
}

const SLIDES: Slide[] = [
  {
    link: { to: "/product/$handle", handle: "iphone-17-pro-max-256gb" },
    image: heroIphoneMacbook,
    imageMobile: heroIphoneMobile,
    imageAlt: "iPhone 17 Pro Max",
  },
  {
    link: { to: "/product/$handle", handle: "macbook-pro-m5-14-2-24gb-1tb-ssd" },
    image: heroMacbook,
    imageMobile: heroMacbookMobile,
    imageAlt: "MacBook Pro M5",
  },
  {
    link: { to: "/categoria/$handle", handle: "games" },
    image: consolesBanner.url,
    imageMobile: consolesBannerMobile.url,
    imageAlt: "GDN Soluções Consoles",
  },
];

function SlideLinkWrapper({ link, children, className }: { link: SlideLink; children: React.ReactNode; className?: string }) {
  if (link.to === "/product/$handle") {
    return (
      <Link to="/product/$handle" params={{ handle: link.handle }} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/categoria/$handle" params={{ handle: link.handle }} className={className}>
      {children}
    </Link>
  );
}

export function HeroCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 9000);
    return () => clearInterval(t);
  }, [idx]);

  const goTo = (i: number) => setIdx(i);
  const next = () => setIdx((i) => (i + 1) % SLIDES.length);
  const prev = () => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length);

  const slide = SLIDES[idx];

  return (
    <section
      className={`relative w-full overflow-hidden bg-ink md:aspect-[1920/684] md:max-h-[72vh] ${
        slide.imageMobile ? "aspect-[3/4] max-h-[78vh]" : "aspect-[16/10]"
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <SlideLinkWrapper link={slide.link} className="block w-full h-full">
            <picture>
              {slide.imageMobile && (
                <source media="(max-width: 767px)" srcSet={slide.imageMobile} />
              )}
              <img
                src={slide.image}
                alt={slide.imageAlt}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
            </picture>
          </SlideLinkWrapper>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur text-white"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-highlight w-8" : "bg-white/40 w-2"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur text-white"
          aria-label="Próximo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
