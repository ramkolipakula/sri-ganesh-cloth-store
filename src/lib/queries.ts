import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type Settings = Tables<"store_settings">;
export type ProductSize = Pick<Tables<"product_sizes">, "id" | "size_label" | "stock" | "sort_order">;
export type Product = Tables<"products"> & {
  category: { name: string; slug: string; is_active?: boolean } | null;
  product_sizes: ProductSize[];
};

export const PRODUCT_SELECT = "*, category:categories(name,slug,is_active), product_sizes(id,size_label,stock,sort_order)";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCategories(opts: { all?: boolean } = {}) {
  return useQuery({
    queryKey: ["categories", opts.all ? "all" : "active"],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("categories").select("*").order("sort_order").order("name");
      if (!opts.all) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export type ProductFilters = {
  category?: string; // slug
  q?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  featured?: boolean;
  limit?: number;
};

/** Storefront products — only active, unarchived, in an active category. */
export function useProducts(f: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", f],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select(PRODUCT_SELECT.replace("category:categories", "category:categories!inner"))
        .eq("is_active", true)
        .is("archived_at", null)
        .eq("category.is_active", true);
      if (f.category) q = q.eq("category.slug", f.category);
      if (f.q?.trim()) q = q.ilike("name", `%${f.q.trim().replace(/[%_,()]/g, " ")}%`);
      if (f.featured) q = q.eq("is_featured", true);
      if (f.sort === "price_asc") q = q.order("price", { ascending: true });
      else if (f.sort === "price_desc") q = q.order("price", { ascending: false });
      else q = q.order("created_at", { ascending: false });
      q = q.limit(f.limit ?? 60);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Product[];
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .eq("is_active", true)
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Product | null;
    },
  });
}
