import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Sri Ganesh Cloth Centre" }, { name: "description", content: "Notifications at Sri Ganesh Cloth Centre, Visakhapatnam." }, { property: "og:title", content: "Notifications — Sri Ganesh Cloth Centre" }, { property: "og:description", content: "Notifications at Sri Ganesh Cloth Centre." }] }),
  component: () => <div className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-3xl">Notifications</h1><p className="mt-3 text-muted-foreground">This page is not built yet.</p></div>,
});
