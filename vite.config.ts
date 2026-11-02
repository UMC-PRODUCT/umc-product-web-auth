import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

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
        // Apple JS 팝업 로그인은 부모 페이지 origin을 확인하므로 no-referrer를 쓰면 안 된다. origin만 보내는 정책을 쓴다.
        "Referrer-Policy": "strict-origin-when-cross-origin",
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
        // Apple JS 팝업 로그인은 부모 페이지 origin을 확인하므로 no-referrer를 쓰면 안 된다. origin만 보내는 정책을 쓴다.
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    },
  }
})
