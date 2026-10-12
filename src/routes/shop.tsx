import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Filter, X, ArrowUpDown, Tag } from "lucide-react";
import { useCategories, useProducts, useSettings } from "@/lib/queries";
import { ProductGrid } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { totalStock } from "@/lib/inventory";

export type ShopSearch = {
  q?: string | undefined;
  category?: string | undefined;
  sort?: "newest" | "price_asc" | "price_desc" | undefined;
};

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    q: typeof s["q"] === "string" && s["q"].trim() ? s["q"] : undefined,
    category: typeof s["category"] === "string" && s["category"].trim() ? s["category"] : undefined,
    sort: s["sort"] === "price_asc" || s["sort"] === "price_desc" ? s["sort"] : "newest",
  }),
  head: () => ({
    meta: [
      { title: "Shop — Sri Ganesh Cloth Centre" },
      {
        name: "description",
        content:
          "Browse Sarees, Nighties, Kurtis, Innerwear, Bedsheets and more at Sri Ganesh Cloth Centre, Visakhapatnam.",
      },
      { property: "og:title", content: "Shop — Sri Ganesh Cloth Centre" },
      {
        property: "og:description",
        content: "Wholesale Rate ki Retail Ammabadanu. Quality clothes for every you.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(search.q ?? "");
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data: settings } = useSettings();
  const { data: categories } = useCategories();
  const {
    data: products,
    isLoading,
    error,
  } = useProducts({
    category: search.category,
    q: search.q,
    sort: search.sort,
  });

  const lowStockThreshold = settings?.low_stock_threshold ?? 3;

  const updateSearch = (patch: Partial<ShopSearch>) => {
    navigate({
      to: "/shop",
      search: {
        ...search,
        ...patch,
      },
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch({ q: searchInput.trim() || undefined });
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!inStockOnly) return products;
    return products.filter((p) => totalStock(p) > 0);
  }, [products, inStockOnly]);

  const activeCategoryName = categories?.find((c) => c.slug === search.category)?.name;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header & Title */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {activeCategoryName ? activeCategoryName : "All Collections"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeCategoryName
              ? `Showing clothing items in ${activeCategoryName}`
              : "Explore wholesale rate retail collections from Sri Ganesh Cloth Centre"}
          </p>
        </div>

        {/* Clear Filters button if filters applied */}
        {(search.category || search.q || inStockOnly) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchInput("");
              setInStockOnly(false);
              navigate({ to: "/shop", search: {} });
            }}
            className="self-start text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 size-3.5" /> Clear all filters
          </Button>
        )}
      </div>

      {/* Search & Sort Controls Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search within shop…"
            className="h-10 w-full rounded-full border bg-card pl-9 pr-20 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateSearch({ q: undefined });
              }}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
          >
            Go
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* In-Stock Toggle */}
          <button
            type="button"
            onClick={() => setInStockOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${
              inStockOnly
                ? "border-primary bg-primary/10 text-primary"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Filter className="size-3.5" /> In-stock only
          </button>

          {/* Sort Dropdown */}
          <div className="relative inline-flex items-center">
            <ArrowUpDown className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground" />
            <select
              value={search.sort ?? "newest"}
              onChange={(e) =>
                updateSearch({
                  sort: e.target.value as "newest" | "price_asc" | "price_desc",
                })
              }
              className="h-10 appearance-none rounded-full border bg-card pl-8 pr-8 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills Scroller */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => updateSearch({ category: undefined })}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            !search.category
              ? "bg-navy text-navy-foreground shadow-xs"
              : "border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          All Items
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => updateSearch({ category: cat.slug })}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              search.category === cat.slug
                ? "bg-navy text-navy-foreground shadow-xs"
                : "border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-semibold text-destructive">Failed to load catalog.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please check your connection and refresh.
          </p>
        </div>
      )}

      {/* Product Results */}
      {!error && (
        <>
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isLoading
                ? "Loading products…"
                : `${filteredProducts.length} ${filteredProducts.length === 1 ? "product" : "products"} found`}
            </span>
            {search.category && (
              <span className="flex items-center gap-1 font-semibold text-primary">
                <Tag className="size-3" /> Filtered by category
              </span>
            )}
          </div>

          <ProductGrid
            products={filteredProducts}
            threshold={lowStockThreshold}
            loading={isLoading}
          />
        </>
      )}
    </div>
  );
}
