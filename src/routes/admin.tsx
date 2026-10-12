import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Sri Ganesh Cloth Centre" }, { name: "description", content: "Admin at Sri Ganesh Cloth Centre, Visakhapatnam." }, { property: "og:title", content: "Admin — Sri Ganesh Cloth Centre" }, { property: "og:description", content: "Admin at Sri Ganesh Cloth Centre." }] }),
  component: () => <div className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-3xl">Admin</h1><p className="mt-3 text-muted-foreground">This page is not built yet.</p></div>,
});
