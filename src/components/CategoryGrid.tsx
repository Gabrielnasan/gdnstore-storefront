import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

const computadoresImg = { url: "/images/categories/computadores.svg" };
const smartphonesImg = { url: "/images/categories/smartphones.svg" };
const tabletsImg = { url: "/images/categories/tablets.svg" };
const smartwatchImg = { url: "/images/categories/smartwatch.svg" };
const gamesImg = { url: "/images/categories/games.svg" };
const audioImg = { url: "/images/categories/Audio.svg" };
const cameraImg = { url: "/images/categories/camera.svg" };
const droneImg = { url: "/images/categories/drone.svg" };
const acessoriosImg = { url: "/images/categories/assessorios.svg" };

type CatLink = { label: string; image: string; handle: string };

const CATS: CatLink[] = [
  { label: "Computadores", image: computadoresImg.url, handle: "computadores" },
  { label: "Smartphones", image: smartphonesImg.url, handle: "smartphones" },
  { label: "Tablets", image: tabletsImg.url, handle: "tablets" },
  { label: "Smartwatch", image: smartwatchImg.url, handle: "smartwatch" },
  { label: "Games", image: gamesImg.url, handle: "games" },
  { label: "Áudio", image: audioImg.url, handle: "audio" },
  { label: "Câmeras", image: cameraImg.url, handle: "cameras" },
  { label: "Drones", image: droneImg.url, handle: "drones" },
  { label: "Acessórios", image: acessoriosImg.url, handle: "acessorios" },
];

export function CategoryGrid() {
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <div className="flex items-end justify-between mb-6 md:mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Navegue por categoria</p>
          <h2 className="font-display text-xl md:text-2xl font-bold mt-1">Tudo o que você procura</h2>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3 md:gap-4 mx-auto">
        {CATS.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.25) }}
          >
            <Link
              to="/categoria/$handle"
              params={{ handle: c.handle }}
              className="group flex flex-col items-center gap-2 cursor-pointer"
              aria-label={c.label}
            >
              <div className="relative w-full aspect-square rounded-2xl bg-highlight overflow-hidden border border-highlight/0 group-hover:border-ink/10 shadow-sm group-hover:shadow-elegant group-hover:-translate-y-1 transition-all duration-300 ease-out flex items-center justify-center p-3">
                <img
                  src={c.image}
                  alt={c.label}
                  width={400}
                  height={400}
                  loading={i < 5 ? "eager" : "lazy"}
                  fetchPriority={i < 5 ? "high" : "low"}
                  decoding="async"
                  className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-110"
                />
              </div>
              <span className="text-[11px] md:text-xs font-medium text-center text-foreground/80 group-hover:text-foreground transition-colors">{c.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
