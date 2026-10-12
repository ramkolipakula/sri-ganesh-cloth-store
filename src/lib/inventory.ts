// Pure inventory/cart helpers — shared by UI and covered by tests.
export type SizeRow = { size_label: string; stock: number; sort_order?: number | null };
export type StockProduct = {
  inventory_mode: string;
  free_size_stock: number;
  product_sizes?: SizeRow[] | null;
};

export const FREE_SIZE = "Free Size";

export function totalStock(p: StockProduct): number {
  if (p.inventory_mode === "free_size") return p.free_size_stock;
  return (p.product_sizes ?? []).reduce((s, r) => s + r.stock, 0);
}

/** Options shown to customers. Free-size products expose only "Free Size". */
export function sizeOptions(
  p: StockProduct,
): { label: string; stock: number; available: boolean }[] {
  if (p.inventory_mode === "free_size") {
    return [{ label: FREE_SIZE, stock: p.free_size_stock, available: p.free_size_stock > 0 }];
  }
  return [...(p.product_sizes ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((r) => ({ label: r.size_label, stock: r.stock, available: r.stock > 0 }));
}

export function stockForSize(p: StockProduct, size: string): number {
  return sizeOptions(p).find((o) => o.label === size)?.stock ?? 0;
}

export function stockLevel(stock: number, threshold: number): "out" | "low" | "in" {
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "in";
}

export function clampQty(qty: number, max: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.min(Math.floor(qty), Math.max(1, max)));
}

/** Detect duplicate or invalid size rows before saving (DB also enforces uniqueness). */
export function validateSizeRows(rows: { size_label: string; stock: number }[]): string | null {
  const seen = new Set<string>();
  for (const r of rows) {
    const label = r.size_label.trim();
    if (!label) return "Every size needs a label";
    if (label.length > 20) return "Size labels must be 20 characters or less";
    const key = label.toUpperCase();
    if (seen.has(key)) return `Size "${label}" is listed twice`;
    seen.add(key);
    if (!Number.isInteger(r.stock) || r.stock < 0)
      return `Stock for ${label} must be a whole number 0 or more`;
  }
  return null;
}
