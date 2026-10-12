import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — Sri Ganesh Cloth Centre" }, { name: "description", content: "Account at Sri Ganesh Cloth Centre, Visakhapatnam." }, { property: "og:title", content: "Account — Sri Ganesh Cloth Centre" }, { property: "og:description", content: "Account at Sri Ganesh Cloth Centre." }] }),
  component: () => <div className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-3xl">Account</h1><p className="mt-3 text-muted-foreground">This page is not built yet.</p></div>,
});
