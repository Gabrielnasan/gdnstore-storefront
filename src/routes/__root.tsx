import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartSync } from "@/hooks/useCartSync";
import { usePixelPageView } from "@/hooks/usePixelPageView";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">A página que você procura não existe ou foi movida.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground hover:bg-highlight hover:text-highlight-foreground transition">
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tente novamente em alguns segundos.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground hover:bg-highlight hover:text-highlight-foreground transition"
          >
            Tentar novamente
          </button>
          <a href="/" className="rounded-full border border-input px-5 py-2.5 text-sm font-semibold hover:bg-accent transition">
            Ir para a loja
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GDN Store · Tecnologia Premium" },
      { name: "description", content: "Notebooks, smartphones, games e acessórios das melhores marcas. Parcelamento no cartão e envio com rastreio." },
      { property: "og:title", content: "GDN Store · Tecnologia Premium" },
      { property: "og:description", content: "Notebooks, smartphones, games e acessórios das melhores marcas. Parcelamento no cartão e envio com rastreio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "GDN Store · Tecnologia Premium" },
      { name: "twitter:description", content: "Notebooks, smartphones, games e acessórios das melhores marcas. Parcelamento no cartão e envio com rastreio." },
      { property: "og:site_name", content: "GDN Store" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "shortcut icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" } as any,
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
    ],
    scripts: [
      {
        children: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', '000000000000000');`,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "OnlineStore",
          name: "GDN Store",
          url: "https://gdnstore.com.br/",
          description:
            "Loja de tecnologia premium: notebooks, smartphones, tablets, games, áudio, drones, câmeras e acessórios.",
          telephone: "+55 00 00000-0000",
          areaServed: "BR",
          contactPoint: [
            {
              "@type": "ContactPoint",
              telephone: "+55 00 00000-0000",
              contactType: "customer service",
              availableLanguage: ["Portuguese"],
            },
          ],
        }),
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=000000000000000&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppShell() {
  useCartSync();
  usePixelPageView();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
