import { describe, expect, it } from "vitest";
import {
  totalStock,
  sizeOptions,
  stockForSize,
  stockLevel,
  clampQty,
  validateSizeRows,
  FREE_SIZE,
  type StockProduct,
} from "@/lib/inventory";

describe("Inventory Logic", () => {
  const freeSizeProduct: StockProduct = {
    inventory_mode: "free_size",
    free_size_stock: 12,
  };

  const sizeBasedProduct: StockProduct = {
    inventory_mode: "size_based",
    free_size_stock: 0,
    product_sizes: [
      { size_label: "S", stock: 4, sort_order: 1 },
      { size_label: "M", stock: 0, sort_order: 2 },
      { size_label: "L", stock: 8, sort_order: 3 },
    ],
  };

  it("calculates total stock for free size and size-based products", () => {
    expect(totalStock(freeSizeProduct)).toBe(12);
    expect(totalStock(sizeBasedProduct)).toBe(12); // 4 + 0 + 8
  });

  it("exposes ONLY 'Free Size' for free-size products", () => {
    const options = sizeOptions(freeSizeProduct);
    expect(options).toHaveLength(1);
    expect(options[0]?.label).toBe(FREE_SIZE);
    expect(options[0]?.stock).toBe(12);
    expect(options[0]?.available).toBe(true);
  });

  it("exposes ordered sizes and marks 0-stock sizes as unavailable", () => {
    const options = sizeOptions(sizeBasedProduct);
    expect(options).toHaveLength(3);
    expect(options[0]?.label).toBe("S");
    expect(options[0]?.available).toBe(true);

    // M has 0 stock -> must be unavailable
    expect(options[1]?.label).toBe("M");
    expect(options[1]?.available).toBe(false);

    expect(options[2]?.label).toBe("L");
    expect(options[2]?.available).toBe(true);
  });

  it("returns correct stock for requested size", () => {
    expect(stockForSize(freeSizeProduct, FREE_SIZE)).toBe(12);
    expect(stockForSize(freeSizeProduct, "XL")).toBe(0);

    expect(stockForSize(sizeBasedProduct, "S")).toBe(4);
    expect(stockForSize(sizeBasedProduct, "M")).toBe(0);
    expect(stockForSize(sizeBasedProduct, "XXL")).toBe(0);
  });

  it("computes stock levels against configurable thresholds", () => {
    expect(stockLevel(0, 3)).toBe("out");
    expect(stockLevel(2, 3)).toBe("low");
    expect(stockLevel(3, 3)).toBe("low");
    expect(stockLevel(4, 3)).toBe("in");
  });

  it("clamps quantity correctly", () => {
    expect(clampQty(0, 5)).toBe(1);
    expect(clampQty(3, 5)).toBe(3);
    expect(clampQty(10, 5)).toBe(5);
    expect(clampQty(NaN, 5)).toBe(1);
  });

  describe("validateSizeRows", () => {
    it("accepts valid size rows", () => {
      const result = validateSizeRows([
        { size_label: "S", stock: 5 },
        { size_label: "M", stock: 10 },
      ]);
      expect(result).toBeNull();
    });

    it("rejects empty size labels", () => {
      const result = validateSizeRows([{ size_label: "   ", stock: 5 }]);
      expect(result).toContain("Every size needs a label");
    });

    it("rejects duplicate size labels case-insensitively", () => {
      const result = validateSizeRows([
        { size_label: "XL", stock: 5 },
        { size_label: "xl", stock: 2 },
      ]);
      expect(result).toContain("listed twice");
    });

    it("rejects negative stock values", () => {
      const result = validateSizeRows([{ size_label: "L", stock: -3 }]);
      expect(result).toContain("whole number 0 or more");
    });
  });
});
