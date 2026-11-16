import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// O entry de servidor do TanStack Start aponta para src/server.ts (wrapper de erros de SSR);
// é a partir dele que o plugin da Cloudflare gera o worker.
export default defineConfig(({ command }) => ({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    ...(command === "build" ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : []),
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
  ],
  resolve: { dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"] },
}));
