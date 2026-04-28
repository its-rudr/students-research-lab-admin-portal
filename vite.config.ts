import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Plugin to handle Prisma client resolution
const prismaPlugin = {
  name: 'prisma-resolver',
  resolveId(id) {
    if (id === '@prisma/client' || id === '.prisma/client') {
      return path.resolve(__dirname, "./src/lib/prismaClient.ts");
    }
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  preview: {
    port: 4173,
    host: "::",
  },
  plugins: [prismaPlugin, react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
