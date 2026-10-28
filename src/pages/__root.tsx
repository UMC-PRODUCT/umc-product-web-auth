import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router"
import { ToastProvider } from "@umc-product/react"

export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: "UMC" }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <ToastProvider>
      <HeadContent />
      <main className="relative flex min-h-dvh items-center justify-center bg-white px-6">
        <Outlet />
      </main>
    </ToastProvider>
  )
}
