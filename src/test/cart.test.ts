import { describe, expect, it } from "vitest";
import { mergeCartItem, type CartItem } from "@/lib/cart";

describe("Cart Operations", () => {
  const sampleItemA: CartItem = {
    productId: "prod-1",
    slug: "cotton-nighty",
    name: "Cotton Daily Nighty",
    price: 299,
    imagePath: null,
    size: "L",
    quantity: 2,
    maxStock: 5,
  };

  const sampleItemB: CartItem = {
    productId: "prod-1",
    slug: "cotton-nighty",
    name: "Cotton Daily Nighty",
    price: 299,
    imagePath: null,
    size: "XL",
    quantity: 1,
    maxStock: 3,
  };

  it("adds new distinct items to cart", () => {
    const cart = mergeCartItem([], sampleItemA);
    expect(cart).toHaveLength(1);
    expect(cart[0]?.productId).toBe("prod-1");
    expect(cart[0]?.size).toBe("L");
    expect(cart[0]?.quantity).toBe(2);

    const updated = mergeCartItem(cart, sampleItemB);
    expect(updated).toHaveLength(2);
    expect(updated[1]?.size).toBe("XL");
  });

  it("merges quantities when adding identical product and size", () => {
    const cart = [sampleItemA];
    const itemToAdd: CartItem = {
      ...sampleItemA,
      quantity: 2,
    };
    const merged = mergeCartItem(cart, itemToAdd);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.quantity).toBe(4);
  });

  it("clamps quantity to maxStock when merging identical items", () => {
    const cart = [sampleItemA]; // qty: 2, maxStock: 5
    const itemToAdd: CartItem = {
      ...sampleItemA,
      quantity: 10,
    };
    const merged = mergeCartItem(cart, itemToAdd);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.quantity).toBe(5); // capped at maxStock: 5
  });

  it("caps initial addition if requested quantity exceeds maxStock", () => {
    const oversizeItem: CartItem = {
      ...sampleItemA,
      quantity: 100,
      maxStock: 10,
    };
    const cart = mergeCartItem([], oversizeItem);
    expect(cart[0]?.quantity).toBe(10);
  });
});
