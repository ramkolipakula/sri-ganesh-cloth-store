import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { Product } from "@/lib/queries";
import { inr } from "@/lib/format";
import { stockLevel, totalStock } from "@/lib/inventory";
import { useImageUrls, getProductImageUrl } from "@/lib/storage";
import { Skeleton } from "@/components/ui/skeleton";

export function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  const lvl = stockLevel(stock, threshold);
  if (lvl === "out")
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
        Out of stock
      </span>
    );
  if (lvl === "low")
    return (
      <span className="rounded-full bg-warning/30 px-2 py-0.5 text-[11px] font-bold text-warning-foreground">
        Only {stock} left
      </span>
    );
  return (
    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
      In stock
    </span>
  );
}

export function ProductImg({
  url,
  alt,
  className = "",
}: {
  url?: string | undefined;
  alt: string;
  className?: string;
}) {
  const [loadError, setLoadError] = useState(false);

  return url && !loadError ? (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setLoadError(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
      <ImageOff className="size-8" />
    </div>
  );
}

export function ProductGrid({
  products,
  threshold,
  loading,
}: {
  products?: Product[] | undefined;
  threshold: number;
  loading?: boolean | undefined;
}) {
  const { data: urls } = useImageUrls("product-images", products?.map((p) => p.image_path) ?? []);
  if (loading)
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  if (!products?.length)
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        No products here yet. Please check back soon.
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => {
        const stock = totalStock(p);
        const imgUrl = p.image_path
          ? (urls?.[p.image_path] ?? getProductImageUrl(p.image_path))
          : undefined;
        return (
          <Link
            key={p.id}
            to="/product/$slug"
            params={{ slug: p.slug }}
            className="group overflow-hidden rounded-xl bg-card shadow-card transition hover:-translate-y-0.5"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <ProductImg
                url={imgUrl}
                alt={p.name}
                className={stock <= 0 ? "opacity-60" : ""}
              />
              <div className="absolute left-2 top-2">
                <StockBadge stock={stock} threshold={threshold} />
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground">{p.category?.name}</p>
              <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-bold text-primary">{inr(p.price)}</span>
                {p.original_price && Number(p.original_price) > Number(p.price) && (
                  <span className="text-xs text-muted-foreground line-through">
                    {inr(p.original_price)}
                  </span>
                )}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
