import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Sri Ganesh Cloth Centre" }, { name: "description", content: "Sign in at Sri Ganesh Cloth Centre, Visakhapatnam." }, { property: "og:title", content: "Sign in — Sri Ganesh Cloth Centre" }, { property: "og:description", content: "Sign in at Sri Ganesh Cloth Centre." }] }),
  component: () => <div className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-3xl">Sign in</h1><p className="mt-3 text-muted-foreground">This page is not built yet.</p></div>,
});
