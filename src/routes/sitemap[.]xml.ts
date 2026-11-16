import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { CATEGORIES } from "@/lib/categories";
import { BRANDS } from "@/lib/brands";

const BASE_URL = "https://gdnstore.com.br";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/ofertas", changefreq: "daily", priority: "0.9" },
          ...CATEGORIES.map((c) => ({ path: `/categoria/${c.handle}`, changefreq: "daily" as const, priority: "0.8" })),
          ...BRANDS.map((b) => ({ path: `/marca/${b.handle}`, changefreq: "weekly" as const, priority: "0.7" })),
          { path: "/sobre-nos", changefreq: "yearly", priority: "0.5" },
          { path: "/fale-conosco", changefreq: "yearly", priority: "0.5" },
          { path: "/perguntas-frequentes", changefreq: "monthly", priority: "0.5" },
          { path: "/politica-de-entrega", changefreq: "yearly", priority: "0.3" },
          { path: "/trocas-e-devolucoes", changefreq: "yearly", priority: "0.3" },
          { path: "/garantia", changefreq: "yearly", priority: "0.3" },
          { path: "/politica-de-privacidade", changefreq: "yearly", priority: "0.3" },
          { path: "/termos-de-uso", changefreq: "yearly", priority: "0.3" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
