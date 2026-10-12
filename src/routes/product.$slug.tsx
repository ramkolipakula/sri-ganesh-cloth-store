import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ShoppingBag,
  ArrowLeft,
  Check,
  Phone,
  MessageCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useProduct, useSettings } from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/format";
import { FREE_SIZE, sizeOptions, stockForSize, totalStock, stockLevel } from "@/lib/inventory";
import { useImageUrls } from "@/lib/storage";
import { ProductImg, StockBadge } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Product — Sri Ganesh Cloth Centre` },
      {
        name: "description",
        content: `Buy high quality clothing at Sri Ganesh Cloth Centre, Visakhapatnam.`,
      },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { data: settings } = useSettings();
  const { data: product, isLoading, error } = useProduct(slug);

  const lowStockThreshold = settings?.low_stock_threshold ?? 3;
  const storePhone = settings?.phone ?? "7981809751";
  const storeWhatsapp = settings?.whatsapp ?? "917981809751";

  // Fetch signed image URL if present
  const { data: imageUrls } = useImageUrls(
    "product-images",
    product?.image_path ? [product.image_path] : [],
  );

  const availableSizes = useMemo(() => {
    if (!product) return [];
    return sizeOptions(product);
  }, [product]);

  // Default size selection: first available in-stock size, or first size
  const defaultSize = useMemo(() => {
    if (!product) return "";
    if (product.inventory_mode === "free_size") return FREE_SIZE;
    const firstInStock = availableSizes.find((s) => s.available);
    return firstInStock ? firstInStock.label : (availableSizes[0]?.label ?? "");
  }, [product, availableSizes]);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const activeSize = selectedSize || defaultSize;

  const currentSizeStock = useMemo(() => {
    if (!product) return 0;
    return stockForSize(product, activeSize);
  }, [product, activeSize]);

  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-8 w-1/4 animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This item may have been moved or is currently unavailable.
        </p>
        <Link
          to="/shop"
          search={{}}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Shop
        </Link>
      </div>
    );
  }

  const overallStock = totalStock(product);
  const isOverallOutOfStock = overallStock <= 0;
  const isSelectedSizeOutOfStock = currentSizeStock <= 0;

  const handleAddToCart = () => {
    if (isSelectedSizeOutOfStock) {
      toast.error(`Size ${activeSize} is currently out of stock`);
      return;
    }

    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      imagePath: product.image_path,
      size: activeSize,
      quantity,
      maxStock: currentSizeStock,
    });

    toast.success(`Added ${product.name} (${activeSize}) to cart!`, {
      action: {
        label: "View Cart",
        onClick: () => navigate({ to: "/cart" }),
      },
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      {/* Breadcrumb / Back button */}
      <div className="mb-6">
        <Link
          to="/shop"
          search={product.category ? { category: product.category.slug } : {}}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to {product.category?.name ?? "Shop"}
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        {/* Left: Product Image */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="relative aspect-[3/4] w-full">
            <ProductImg
              url={product.image_path ? imageUrls?.[product.image_path] : undefined}
              alt={product.name}
              className={isOverallOutOfStock ? "opacity-60" : ""}
            />
            <div className="absolute left-3 top-3">
              <StockBadge stock={overallStock} threshold={lowStockThreshold} />
            </div>
          </div>
        </div>

        {/* Right: Details & Buying Flow */}
        <div className="flex flex-col justify-start">
          {product.category && (
            <Link
              to="/shop"
              search={{ category: product.category.slug }}
              className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl md:text-4xl">
            {product.name}
          </h1>

          {/* Pricing */}
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-2xl font-bold text-primary sm:text-3xl">
              {inr(product.price)}
            </span>
            {product.original_price && Number(product.original_price) > Number(product.price) && (
              <span className="text-sm text-muted-foreground line-through">
                MRP {inr(product.original_price)}
              </span>
            )}
            <span className="rounded-full bg-gold/25 px-2.5 py-0.5 text-xs font-bold text-navy">
              Wholesale Rate
            </span>
          </div>

          {/* Stock Level Indicator */}
          <div className="mt-4">
            {isOverallOutOfStock ? (
              <p className="text-sm font-semibold text-muted-foreground">Currently Out of Stock</p>
            ) : isSelectedSizeOutOfStock ? (
              <p className="text-sm font-semibold text-destructive">
                Size {activeSize} is sold out. Please pick another size.
              </p>
            ) : currentSizeStock <= lowStockThreshold ? (
              <p className="text-sm font-semibold text-warning-foreground">
                Hurry! Only {currentSizeStock} left in {activeSize}
              </p>
            ) : (
              <p className="text-sm font-semibold text-success">
                In Stock ({currentSizeStock} units available)
              </p>
            )}
          </div>

          <hr className="my-6" />

          {/* Size Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Select Size:</span>
              <span className="text-xs text-muted-foreground">
                {product.inventory_mode === "free_size"
                  ? "Universal Fit"
                  : `${availableSizes.filter((s) => s.available).length} sizes available`}
              </span>
            </div>

            {product.inventory_mode === "free_size" ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary bg-primary/5 px-4 py-2 text-sm font-bold text-primary">
                <Check className="size-4" /> Free Size (Universal)
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((s) => {
                  const isSelected = activeSize === s.label;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      disabled={!s.available}
                      onClick={() => {
                        setSelectedSize(s.label);
                        setQuantity(1);
                      }}
                      className={`relative flex min-w-12 items-center justify-center rounded-xl border px-3.5 py-2 text-sm font-bold transition ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : s.available
                            ? "bg-card text-foreground hover:border-primary/50"
                            : "cursor-not-allowed border-dashed bg-muted text-muted-foreground line-through opacity-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-bold">Quantity:</span>
            <div className="flex items-center rounded-xl border bg-card">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isSelectedSizeOutOfStock}
                className="px-3 py-1.5 text-base font-bold disabled:opacity-40"
              >
                -
              </button>
              <span className="w-10 text-center text-sm font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(currentSizeStock, q + 1))}
                disabled={quantity >= currentSizeStock || isSelectedSizeOutOfStock}
                className="px-3 py-1.5 text-base font-bold disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart & Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              disabled={isOverallOutOfStock || isSelectedSizeOutOfStock}
              onClick={handleAddToCart}
              className="flex-1 rounded-full text-base font-semibold shadow-md"
            >
              <ShoppingBag className="mr-2 size-5" />
              {isOverallOutOfStock
                ? "Out of Stock"
                : isSelectedSizeOutOfStock
                  ? "Select Another Size"
                  : "Add to Cart"}
            </Button>

            <a
              href={`https://wa.me/${storeWhatsapp}?text=${encodeURIComponent(
                `Hello Sri Ganesh Cloth Centre, I am inquiring about "${product.name}" (${inr(product.price)}). Is this available in ${activeSize}?`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted transition"
            >
              <MessageCircle className="size-4 text-success" /> Ask on WhatsApp
            </a>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8 rounded-2xl border bg-muted/30 p-5">
              <h2 className="text-sm font-bold">Product Description</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Store Guarantee highlights */}
          <div className="mt-8 space-y-3 rounded-2xl border bg-card p-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <Truck className="size-4 text-primary shrink-0" />
              Fast store pickup at Durga Bazar or doorstep local delivery
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-success shrink-0" />
              Direct UPI payment with manual shopkeeper verification
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-4 text-navy shrink-0" />
              Direct assistance: Call +91 {storePhone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
