import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, User, Search, Shield } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { NotificationBell } from "./NotificationBell";

export function SiteHeader() {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 flex-col leading-none">
          <span className="font-display text-lg text-navy sm:text-xl">Sri Ganesh</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Cloth Centre</span>
        </Link>
        <form
          className="relative hidden flex-1 sm:block"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/shop", search: { q: q || undefined } });
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search products"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sarees, kurtis, nighties…"
            className="h-10 w-full rounded-full border bg-card pl-9 pr-4 text-sm"
          />
        </form>
        <nav className="ml-auto flex items-center gap-1">
          <Link to="/shop" className="hidden rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted md:block">
            Shop
          </Link>
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1 rounded-md px-2 py-2 text-sm font-semibold text-primary hover:bg-muted" aria-label="Admin dashboard">
              <Shield className="size-5" /> <span className="hidden md:inline">Admin</span>
            </Link>
          )}
          {user && <NotificationBell />}
          <Link to={user ? "/account" : "/auth"} className="rounded-md p-2 hover:bg-muted" aria-label="Account">
            <User className="size-5" />
          </Link>
          <Link to="/cart" className="relative rounded-md p-2 hover:bg-muted" aria-label={`Cart, ${count} items`}>
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
      <form
        className="px-4 pb-3 sm:hidden"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/shop", search: { q: q || undefined } });
        }}
      >
        <input
          aria-label="Search products"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          className="h-10 w-full rounded-full border bg-card px-4 text-sm"
        />
      </form>
    </header>
  );
}
