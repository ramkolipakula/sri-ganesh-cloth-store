import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShoppingBag,
  Sparkles,
  Phone,
  MessageCircle,
  MapPin,
  Search,
  ArrowRight,
  ShieldCheck,
  Tag,
  Truck,
} from "lucide-react";
import { useCategories, useProducts, useSettings } from "@/lib/queries";
import { ProductGrid } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: settings } = useSettings();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: featuredProducts, isLoading: loadingFeatured } = useProducts({
    featured: true,
    limit: 8,
  });
  const { data: recentProducts, isLoading: loadingRecent } = useProducts({
    limit: 8,
  });

  const lowStockThreshold = settings?.low_stock_threshold ?? 3;
  const storePhone = settings?.phone ?? "7981809751";
  const storeWhatsapp = settings?.whatsapp ?? "917981809751";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({
        to: "/shop",
        search: { q: searchQuery.trim() },
      });
    } else {
      navigate({ to: "/shop", search: {} });
    }
  };

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-primary text-navy-foreground">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-12 text-center md:py-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-4 py-1.5 text-xs font-bold text-gold backdrop-blur sm:text-sm">
            <Sparkles className="size-4 text-gold animate-pulse" />
            Wholesale Rate ki Retail Ammabadanu
          </div>

          <h1 className="max-w-3xl font-display text-3xl font-normal leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Sri Ganesh Cloth Centre
          </h1>

          <p className="mt-3 max-w-2xl text-base text-navy-foreground/80 sm:text-lg">
            {settings?.tagline || "Quality Clothes, Comfort for Every You"}
          </p>

          <p className="mt-2 text-xs text-navy-foreground/70 sm:text-sm">
            Visakhapatnam’s trusted destination for Sarees, Nighties, Kurtis, Sets & Family Wear.
          </p>

          {/* Search box inside hero */}
          <form
            onSubmit={handleSearch}
            className="mt-8 flex w-full max-w-lg items-center overflow-hidden rounded-full border border-white/20 bg-background/95 p-1.5 shadow-lg backdrop-blur"
          >
            <Search className="ml-3 size-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sarees, nighties, kurtis, bedsheets…"
              className="flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Button type="submit" size="sm" className="rounded-full px-5">
              Search
            </Button>
          </form>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/shop"
              search={{}}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
            >
              <ShoppingBag className="size-4" /> Browse Shop
            </Link>
            <a
              href={`https://wa.me/${storeWhatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition"
            >
              <MessageCircle className="size-4" /> WhatsApp Order
            </a>
            <a
              href={`tel:+91${storePhone}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition"
            >
              <Phone className="size-4" /> Call Store
            </a>
          </div>
        </div>
      </section>

      {/* Feature Badges Bar */}
      <section className="mx-auto -mt-6 max-w-6xl px-4 w-full">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3 p-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Tag className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm">Wholesale Rates</p>
              <p className="text-[11px] text-muted-foreground">Retail for wholesale price</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-navy">
              <Truck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm">Doorstep & Pickup</p>
              <p className="text-[11px] text-muted-foreground">Fast delivery or store pickup</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm">Verified Payments</p>
              <p className="text-[11px] text-muted-foreground">Manual UPI check for safety</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy/10 text-navy">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold sm:text-sm">16 Collections</p>
              <p className="text-[11px] text-muted-foreground">Ladies, Men's & Family wear</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mx-auto max-w-6xl px-4 w-full">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">Explore Categories</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Discover quality fabrics, nighties, sarees and essentials
            </p>
          </div>
          <Link
            to="/shop"
            search={{}}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline sm:text-sm"
          >
            All Categories <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-8">
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                to="/shop"
                search={{ category: cat.slug }}
                className="group flex flex-col items-center justify-center rounded-xl border bg-card p-3 text-center shadow-xs transition hover:border-primary hover:bg-primary/5 hover:-translate-y-0.5"
              >
                <span className="line-clamp-2 text-xs font-bold group-hover:text-primary">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      {(loadingFeatured || (featuredProducts && featuredProducts.length > 0)) && (
        <section className="mx-auto max-w-6xl px-4 w-full">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="size-3.5" /> Handpicked Picks
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold">
                Featured Collections
              </h2>
            </div>
            <Link
              to="/shop"
              search={{}}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline sm:text-sm"
            >
              View All <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <ProductGrid
            products={featuredProducts}
            threshold={lowStockThreshold}
            loading={loadingFeatured}
          />
        </section>
      )}

      {/* Recent Products */}
      <section className="mx-auto max-w-6xl px-4 w-full">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">Latest Arrivals</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Fresh stock added directly from Sri Ganesh Cloth Centre
            </p>
          </div>
          <Link
            to="/shop"
            search={{}}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline sm:text-sm"
          >
            Explore Catalog <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <ProductGrid
          products={recentProducts}
          threshold={lowStockThreshold}
          loading={loadingRecent}
        />
      </section>

      {/* Visit Store Banner */}
      <section className="mx-auto max-w-6xl px-4 w-full">
        <div className="overflow-hidden rounded-3xl border bg-card shadow-sm md:flex">
          <div className="flex-1 p-6 sm:p-10">
            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-navy">
              Visit Our Shop in Arilova
            </span>
            <h3 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
              Sri Ganesh Cloth Centre
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Experience the fabric quality in person. Friendly customer service and instant store
              pickup for online orders.
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4.5 shrink-0 text-primary" />
                <span>
                  {settings?.address ||
                    "Door No. 199/3, Near Ramalayam Temple, Durga Bazar, Arilova Colony, Visakhapatnam, Andhra Pradesh – 530040"}
                </span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="size-4.5 shrink-0 text-primary" />
                <a href={`tel:+91${storePhone}`} className="font-semibold hover:underline">
                  +91 {storePhone}
                </a>
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${storeWhatsapp}?text=${encodeURIComponent("Hello Sri Ganesh Cloth Centre, I would like to inquire about your clothes collection.")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-navy-foreground shadow hover:bg-navy/90 transition"
              >
                <MessageCircle className="size-4" /> Message on WhatsApp
              </a>
              <Link
                to="/shop"
                search={{}}
                className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold hover:bg-muted transition"
              >
                View Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
