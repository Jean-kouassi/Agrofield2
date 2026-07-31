import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart(),
    viteReact(),
    tailwindcss(),
    nitro(),
    tsConfigPaths(),
  ],
  server: {
    port: 8080,
    strictPort: true,
  },
  tanstackStart: {
    server: { entry: "server" },
  },
} as any);