import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// TODO: SSO alpha api 호스트는 미확정이다. 이 값은 기존 개발 API 주소다.
const DEFAULT_DEV_API_PROXY_TARGET = "https://api-dev.university.neordinary.com"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiProxyTarget =
    env.VITE_DEV_API_PROXY_TARGET || DEFAULT_DEV_API_PROXY_TARGET

  return {
    plugins: [
      TanStackRouterVite({
        routesDirectory: "./src/pages",
        generatedRouteTree: "./src/routeTree.gen.ts",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      headers: {
        "Referrer-Policy": "no-referrer",
      },
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          // 302는 브라우저가 따라간다. 프록시가 리다이렉트를 소비하지 않는다.
          configure: (proxy) => {
            proxy.on("proxyRes", (proxyRes) => {
              const raw = proxyRes.headers["set-cookie"]
              if (!raw) {
                return
              }
              const cookies = Array.isArray(raw) ? raw : [raw]
              proxyRes.headers["set-cookie"] = cookies.map((cookie) =>
                cookie.replace(/;\s*Domain=[^;]*/gi, ""),
              )
            })
          },
        },
      },
    },
    preview: {
      headers: {
        "Referrer-Policy": "no-referrer",
      },
    },
  }
})
