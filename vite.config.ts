import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Alvo do proxy em DEV: aponte para sua API (local ou EC2) via VITE_API_PROXY_TARGET.
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://localhost:3000";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Tudo em /api é encaminhado para a API — o browser vê mesma origem (sem CORS).
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          // Verificação do certificado TLS do upstream:
          //  - LOCAL (mode "development"): false — contorna proxy corporativo
          //    que intercepta TLS (CA interna que o Node não conhece).
          //  - PROD (mode "production"): true — valida o certificado.
          // (Vale só para o dev server do Vite — produção usa o Caddy, não isto.)
          secure: mode === "production",
        },
      },
    },
    build: {
      target: "es2022",
      sourcemap: false,
    },
  };
});
