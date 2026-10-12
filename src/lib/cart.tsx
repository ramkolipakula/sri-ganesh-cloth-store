import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number; // display only — the database recalculates at checkout
  imagePath: string | null;
  size: string;
  quantity: number;
  maxStock: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (item: CartItem) => void;
  setQty: (productId: string, size: string, qty: number) => void;
  remove: (productId: string, size: string) => void;
  clear: () => void;
};

const KEY = "sgcc-cart-v1";
const Ctx = createContext<CartCtx | null>(null);

export function mergeCartItem(items: CartItem[], item: CartItem): CartItem[] {
  const i = items.findIndex((x) => x.productId === item.productId && x.size === item.size);
  if (i === -1) return [...items, { ...item, quantity: Math.min(item.quantity, item.maxStock) }];
  const next = [...items];
  next[i] = {
    ...(next[i] as CartItem),

    ...item,
    quantity: Math.min((next[i] as CartItem).quantity + item.quantity, item.maxStock),
  };
  return next;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupt cart */
    }
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(e.newValue ? JSON.parse(e.newValue) : []);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((item: CartItem) => setItems((s) => mergeCartItem(s, item)), []);
  const setQty = useCallback(
    (productId: string, size: string, qty: number) =>
      setItems((s) =>
        s.map((x) =>
          x.productId === productId && x.size === size
            ? { ...x, quantity: Math.max(1, Math.min(qty, x.maxStock)) }
            : x,
        ),
      ),
    [],
  );
  const remove = useCallback(
    (productId: string, size: string) =>
      setItems((s) => s.filter((x) => !(x.productId === productId && x.size === size))),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      ready,
      count: items.reduce((s, x) => s + x.quantity, 0),
      subtotal: items.reduce((s, x) => s + x.quantity * x.price, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, ready, add, setQty, remove, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
