import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? s["q"] : undefined }),
  head: () => ({ meta: [{ title: "Shop — Sri Ganesh Cloth Centre" }, { name: "description", content: "Shop at Sri Ganesh Cloth Centre, Visakhapatnam." }, { property: "og:title", content: "Shop — Sri Ganesh Cloth Centre" }, { property: "og:description", content: "Shop at Sri Ganesh Cloth Centre." }] }),
  component: () => <div className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-3xl">Shop</h1><p className="mt-3 text-muted-foreground">This page is not built yet.</p></div>,
});
