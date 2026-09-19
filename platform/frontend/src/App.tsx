import React from "react"
import { RouterProvider, createRouter, createRoute, createRootRoute } from "@tanstack/react-router"
import { AuthLayout } from "./components/layouts/AuthLayout"

// 1. Create a root route
const rootRoute = createRootRoute({
  component: AuthLayout,
})

// 2. Create placeholder views
const IndexComponent = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl border border-border-default bg-surface-default p-6 shadow-sm">
        <h3 className="text-sm font-medium text-text-secondary">Packages Today</h3>
        <p className="mt-2 text-3xl font-bold text-text-primary">24</p>
      </div>
    </div>
  </div>
)

const AddComponent = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Add Package</h1>
    <div className="rounded-xl border border-border-default bg-surface-default p-6 shadow-sm">
      <p className="text-text-secondary">Package entry form will go here...</p>
    </div>
  </div>
)

const PackagesComponent = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Packages</h1>
    <div className="rounded-xl border border-border-default bg-surface-default p-6 shadow-sm">
      <p className="text-text-secondary">Package list and search will go here...</p>
    </div>
  </div>
)

const SettingsComponent = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings</h1>
    <div className="rounded-xl border border-border-default bg-surface-default p-6 shadow-sm">
      <p className="text-text-secondary">Business settings will go here...</p>
    </div>
  </div>
)

// 3. Create route tree
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: IndexComponent })
const addRoute = createRoute({ getParentRoute: () => rootRoute, path: "/add", component: AddComponent })
const packagesRoute = createRoute({ getParentRoute: () => rootRoute, path: "/packages", component: PackagesComponent })
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/settings", component: SettingsComponent })

const routeTree = rootRoute.addChildren([indexRoute, addRoute, packagesRoute, settingsRoute])

// 4. Create router instance
const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return <RouterProvider router={router} />
}
