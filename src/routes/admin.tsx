import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  CreditCard,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Upload,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  ArrowRight,
  Filter,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { inr, fmtDate } from "@/lib/format";
import { useSettings, useCategories, PRODUCT_SELECT, type Product } from "@/lib/queries";
import { StatusPill } from "@/components/site/OrderBits";
import { totalStock, validateSizeRows, FREE_SIZE } from "@/lib/inventory";
import { ImagePicker } from "@/components/site/ImagePicker";
import { uploadWithProgress, extFor, useImageUrls } from "@/lib/storage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Sri Ganesh Cloth Centre" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "products" | "categories" | "orders" | "payments" | "settings";

function AdminPage() {
  const qc = useQueryClient();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Global settings and categories
  const { data: settings } = useSettings();
  const { data: categories, refetch: refetchCategories } = useCategories({ all: true });

  // Admin stats & data queries
  const {
    data: products,
    refetch: refetchProducts,
    isLoading: loadingProducts,
  } = useQuery({
    queryKey: ["admin-products"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  const {
    data: orders,
    refetch: refetchOrders,
    isLoading: loadingOrders,
  } = useQuery({
    queryKey: ["admin-orders"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), payments(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // State for Product Modal (create/edit)
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOriginalPrice, setProdOriginalPrice] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodInventoryMode, setProdInventoryMode] = useState<"size_based" | "free_size">(
    "size_based",
  );
  const [prodFreeStock, setProdFreeStock] = useState("0");
  const [prodSizes, setProdSizes] = useState<{ size_label: string; stock: number }[]>([
    { size_label: "S", stock: 5 },
    { size_label: "M", stock: 5 },
    { size_label: "L", stock: 5 },
  ]);
  const [prodIsActive, setProdIsActive] = useState(true);
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // State for Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catSortOrder, setCatSortOrder] = useState("0");
  const [savingCategory, setSavingCategory] = useState(false);

  // State for Payment review modal
  const [reviewPaymentId, setReviewPaymentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewingAction, setReviewingAction] = useState(false);

  // State for Store settings form
  const [settingsForm, setSettingsForm] = useState({
    store_name: "",
    phone: "",
    whatsapp: "",
    address: "",
    tagline: "",
    upi_id: "",
    payee_name: "",
    delivery_fee: 0,
    delivery_enabled: true,
    pickup_enabled: true,
    low_stock_threshold: 3,
    reservation_hours: 24,
  });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Sync settings when loaded
  useState(() => {
    if (settings) {
      setSettingsForm({
        store_name: settings.store_name ?? "Sri Ganesh Cloth Centre",
        phone: settings.phone ?? "7981809751",
        whatsapp: settings.whatsapp ?? "917981809751",
        address: settings.address ?? "",
        tagline: settings.tagline ?? "",
        upi_id: settings.upi_id ?? "",
        payee_name: settings.payee_name ?? "Sri Ganesh Cloth Centre",
        delivery_fee: Number(settings.delivery_fee ?? 0),
        delivery_enabled: settings.delivery_enabled ?? true,
        pickup_enabled: settings.pickup_enabled ?? true,
        low_stock_threshold: settings.low_stock_threshold ?? 3,
        reservation_hours: settings.reservation_hours ?? 24,
      });
    }
  });

  // Calculate overview metrics
  const totalProducts = products?.length ?? 0;
  const activeProducts = products?.filter((p) => p.is_active).length ?? 0;
  const lowStockThreshold = settings?.low_stock_threshold ?? 3;
  const lowStockProducts =
    products?.filter((p) => {
      const stock = totalStock(p);
      return stock > 0 && stock <= lowStockThreshold;
    }).length ?? 0;
  const outOfStockProducts = products?.filter((p) => totalStock(p) <= 0).length ?? 0;

  const pendingPayments =
    orders?.filter(
      (o) => o.payment_status === "proof_submitted" || o.payment_status === "under_review",
    ) ?? [];
  const awaitingVerificationCount = pendingPayments.length;

  // Payments for review with screenshots
  const screenshotPaths = pendingPayments.flatMap(
    (o) => o.payments?.map((p) => p.screenshot_path) ?? [],
  );
  const { data: proofUrls } = useImageUrls("payment-proofs", screenshotPaths);

  // Access Control verification
  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">
        Checking admin authorization…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Shield className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold">Admin Portal Access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please sign in with your shop administrator account.
        </p>
        <Link
          to="/auth"
          search={{ redirect: "/admin" }}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertTriangle className="mx-auto size-12 text-warning-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Access Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account ({user.email}) does not possess database-level administrator privileges for
          Sri Ganesh Cloth Centre.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  // Handle open Product Create/Edit modal
  const openProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProdName(prod.name);
      setProdCategory(prod.category_id);
      setProdPrice(String(prod.price));
      setProdOriginalPrice(prod.original_price ? String(prod.original_price) : "");
      setProdDescription(prod.description ?? "");
      setProdInventoryMode(prod.inventory_mode as "size_based" | "free_size");
      setProdFreeStock(String(prod.free_size_stock ?? 0));
      setProdSizes(
        prod.product_sizes?.map((s) => ({ size_label: s.size_label, stock: s.stock })) ?? [
          { size_label: "Free Size", stock: 10 },
        ],
      );
      setProdIsActive(prod.is_active);
      setProdIsFeatured(prod.is_featured);
      setProdImageFile(null);
    } else {
      setEditingProduct(null);
      setProdName("");
      setProdCategory(categories?.[0]?.id ?? "");
      setProdPrice("");
      setProdOriginalPrice("");
      setProdDescription("");
      setProdInventoryMode("size_based");
      setProdFreeStock("0");
      setProdSizes([
        { size_label: "S", stock: 5 },
        { size_label: "M", stock: 5 },
        { size_label: "L", stock: 5 },
      ]);
      setProdIsActive(true);
      setProdIsFeatured(false);
      setProdImageFile(null);
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!prodCategory) {
      toast.error("Please select a category");
      return;
    }
    const priceNum = parseFloat(prodPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const origPriceNum = prodOriginalPrice ? parseFloat(prodOriginalPrice) : null;
    if (origPriceNum !== null && origPriceNum < priceNum) {
      toast.error("Original MRP cannot be less than selling price");
      return;
    }

    if (prodInventoryMode === "size_based") {
      const sizeErr = validateSizeRows(prodSizes);
      if (sizeErr) {
        toast.error(sizeErr);
        return;
      }
    }

    setSavingProduct(true);
    try {
      let imagePath = editingProduct?.image_path ?? null;

      // Upload new image if chosen
      if (prodImageFile) {
        const ext = extFor(prodImageFile);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        imagePath = fileName;
        await uploadWithProgress("product-images", fileName, prodImageFile);
      }

      const slug =
        editingProduct?.slug ??
        `${prodName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}-${Date.now().toString(36).slice(-4)}`;

      if (editingProduct) {
        // Update product
        const { error: prodErr } = await supabase
          .from("products")
          .update({
            name: prodName.trim(),
            category_id: prodCategory,
            price: priceNum,
            original_price: origPriceNum,
            description: prodDescription.trim() || null,
            inventory_mode: prodInventoryMode,
            free_size_stock: prodInventoryMode === "free_size" ? parseInt(prodFreeStock) || 0 : 0,
            image_path: imagePath,
            is_active: prodIsActive,
            is_featured: prodIsFeatured,
          })
          .eq("id", editingProduct.id);
        if (prodErr) throw prodErr;

        // If size_based, sync sizes
        if (prodInventoryMode === "size_based") {
          await supabase.from("product_sizes").delete().eq("product_id", editingProduct.id);
          const { error: sizeErr } = await supabase.from("product_sizes").insert(
            prodSizes.map((s, idx) => ({
              product_id: editingProduct.id,
              size_label: s.size_label.trim(),
              stock: Number(s.stock),
              sort_order: idx,
            })),
          );
          if (sizeErr) throw sizeErr;
        }

        toast.success("Product updated successfully!");
      } else {
        // Create product
        const { data: newProd, error: prodErr } = await supabase
          .from("products")
          .insert({
            name: prodName.trim(),
            slug,
            category_id: prodCategory,
            price: priceNum,
            original_price: origPriceNum,
            description: prodDescription.trim() || null,
            inventory_mode: prodInventoryMode,
            free_size_stock: prodInventoryMode === "free_size" ? parseInt(prodFreeStock) || 0 : 0,
            image_path: imagePath,
            is_active: prodIsActive,
            is_featured: prodIsFeatured,
          })
          .select("id")
          .single();
        if (prodErr) throw prodErr;

        if (prodInventoryMode === "size_based" && newProd) {
          const { error: sizeErr } = await supabase.from("product_sizes").insert(
            prodSizes.map((s, idx) => ({
              product_id: newProd.id,
              size_label: s.size_label.trim(),
              stock: Number(s.stock),
              sort_order: idx,
            })),
          );
          if (sizeErr) throw sizeErr;
        }

        toast.success("Product created successfully!");
      }

      setProductModalOpen(false);
      refetchProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save product";
      toast.error(message);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleArchiveProduct = async (id: string, name: string) => {
    if (
      !confirm(`Are you sure you want to archive "${name}"? It will no longer show in the shop.`)
    ) {
      return;
    }
    try {
      const { error } = await supabase
        .from("products")
        .update({ archived_at: new Date().toISOString(), is_active: false })
        .eq("id", id);
      if (error) throw error;
      toast.success("Product archived");
      refetchProducts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to archive product");
    }
  };

  // Review payment actions
  const handleReviewPayment = async (
    paymentId: string,
    action: "verify" | "reject" | "under_review",
  ) => {
    if (action === "reject" && (!rejectionReason.trim() || rejectionReason.trim().length < 3)) {
      toast.error("Please enter a clear rejection reason (e.g. UTR not found in bank)");
      return;
    }
    setReviewingAction(true);
    try {
      const { data: res, error } = await supabase.rpc(
        "admin_review_payment",
        action === "reject"
          ? {
              p_payment_id: paymentId,
              p_action: action,
              p_reason: rejectionReason.trim(),
            }
          : {
              p_payment_id: paymentId,
              p_action: action,
            },
      );
      if (error) throw error;
      toast.success(
        action === "verify"
          ? "Payment verified! Order confirmed."
          : action === "reject"
            ? "Payment proof rejected. Customer notified."
            : "Marked under review.",
      );
      setReviewPaymentId(null);
      setRejectionReason("");
      refetchOrders();
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to review payment");
    } finally {
      setReviewingAction(false);
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.rpc("admin_update_order_status", {
        p_order_id: orderId,
        p_status: newStatus,
      });
      if (error) throw error;
      toast.success(`Order status updated to ${newStatus}`);
      refetchOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update order status");
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      let qrImagePath = settings?.qr_image_path ?? null;
      if (qrFile) {
        const ext = extFor(qrFile);
        const fileName = `shop-qr-${Date.now()}.${ext}`;
        qrImagePath = fileName;
        await uploadWithProgress("store-assets", fileName, qrFile);
      }

      const { error } = await supabase
        .from("store_settings")
        .update({
          store_name: settingsForm.store_name.trim(),
          phone: settingsForm.phone.trim(),
          whatsapp: settingsForm.whatsapp.trim(),
          address: settingsForm.address.trim(),
          tagline: settingsForm.tagline.trim(),
          upi_id: settingsForm.upi_id.trim() || null,
          payee_name: settingsForm.payee_name.trim() || null,
          delivery_fee: Number(settingsForm.delivery_fee),
          delivery_enabled: settingsForm.delivery_enabled,
          pickup_enabled: settingsForm.pickup_enabled,
          low_stock_threshold: Number(settingsForm.low_stock_threshold),
          reservation_hours: Number(settingsForm.reservation_hours),
          qr_image_path: qrImagePath,
        })
        .eq("id", 1);
      if (error) throw error;
      toast.success("Store settings updated successfully!");
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Admin Header */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-navy p-6 text-navy-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gold text-navy font-bold">
            <Shield className="size-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold">
              Management Portal
            </span>
            <h1 className="font-display text-2xl font-bold">Sri Ganesh Cloth Centre</h1>
            <p className="text-xs text-navy-foreground/70">
              Admin: {user.email} • Visakhapatnam Store
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/20 transition"
          >
            Visit Storefront
          </Link>
          <Button
            size="sm"
            onClick={() => openProductModal()}
            className="rounded-full bg-gold text-navy hover:bg-gold/90 font-bold text-xs"
          >
            <Plus className="mr-1 size-3.5" /> Add New Product
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b pb-1 scrollbar-none">
        {[
          { id: "overview", label: "Dashboard", icon: LayoutDashboard },
          { id: "products", label: `Products (${totalProducts})`, icon: Package },
          {
            id: "payments",
            label: `Verify Payments (${awaitingVerificationCount})`,
            icon: CreditCard,
          },
          { id: "orders", label: `Orders (${orders?.length ?? 0})`, icon: ShoppingBag },
          { id: "categories", label: `Categories (${categories?.length ?? 0})`, icon: FolderTree },
          { id: "settings", label: "Store Settings", icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as Tab)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {t.label}
              {t.id === "payments" && awaitingVerificationCount > 0 && (
                <span className="size-2 rounded-full bg-destructive" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW */}
      {activeTab === "overview" && (
        <div className="mt-6 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border bg-card p-5 shadow-2xs">
              <span className="text-xs font-semibold text-muted-foreground">
                Total Active Products
              </span>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">
                {activeProducts}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {totalProducts} total in database
              </span>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-2xs">
              <span className="text-xs font-semibold text-muted-foreground">
                Pending Payment Verifications
              </span>
              <p className="mt-2 font-display text-3xl font-bold text-primary">
                {awaitingVerificationCount}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Awaiting UPI screenshot check
              </span>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-2xs">
              <span className="text-xs font-semibold text-muted-foreground">
                Low Stock Warnings
              </span>
              <p className="mt-2 font-display text-3xl font-bold text-warning-foreground">
                {lowStockProducts}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Below {lowStockThreshold} units left
              </span>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-2xs">
              <span className="text-xs font-semibold text-muted-foreground">Out of Stock</span>
              <p className="mt-2 font-display text-3xl font-bold text-destructive">
                {outOfStockProducts}
              </p>
              <span className="text-[11px] text-muted-foreground">Disabled automatically</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Urgent Payments to Verify */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold">Payments Awaiting Verification</h3>
                <button
                  onClick={() => setActiveTab("payments")}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View All ({pendingPayments.length})
                </button>
              </div>

              {pendingPayments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No payment proofs awaiting verification right now.
                </p>
              ) : (
                <div className="divide-y text-xs">
                  {pendingPayments.slice(0, 4).map((o) => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold">{o.order_number}</span> — {o.customer_name}
                        <p className="text-muted-foreground">{fmtDate(o.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary">{inr(o.total)}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveTab("payments")}
                          className="ml-2 h-7 text-[11px]"
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders Overview */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold">Recent Orders</h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View All ({orders?.length ?? 0})
                </button>
              </div>

              {!orders?.length ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No orders placed yet.
                </p>
              ) : (
                <div className="divide-y text-xs">
                  {orders.slice(0, 4).map((o) => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold">{o.order_number}</span>
                        <div className="flex gap-1.5 mt-0.5">
                          <StatusPill value={o.status} kind="order" />
                          <StatusPill value={o.payment_status} kind="payment" />
                        </div>
                      </div>
                      <span className="font-bold text-foreground">{inr(o.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCT MANAGEMENT */}
      {activeTab === "products" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Manage Products</h2>
            <Button size="sm" onClick={() => openProductModal()} className="rounded-full text-xs">
              <Plus className="mr-1 size-3.5" /> Add Product
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-bold text-muted-foreground">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock Mode</th>
                  <th className="p-3">Total Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products?.map((p) => {
                  const stock = totalStock(p);
                  return (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="size-10 shrink-0 rounded-lg border bg-muted overflow-hidden">
                            {p.image_path ? (
                              <img
                                src={`https://jfdltecrsdblwsmmcvzr.supabase.co/storage/v1/object/public/product-images/${p.image_path}`}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">
                                No img
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold block">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground">{p.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{p.category?.name}</td>
                      <td className="p-3 font-bold text-primary">{inr(p.price)}</td>
                      <td className="p-3 text-muted-foreground capitalize">
                        {p.inventory_mode === "free_size" ? "Free Size" : "Size-based"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold ${
                            stock <= 0
                              ? "text-destructive"
                              : stock <= lowStockThreshold
                                ? "text-warning-foreground"
                                : "text-success"
                          }`}
                        >
                          {stock} units
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.is_active
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openProductModal(p)}
                            className="size-7 p-0"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchiveProduct(p.id, p.name)}
                            className="size-7 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. VERIFY PAYMENTS */}
      {activeTab === "payments" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Payment Proof Verification</h2>
            <span className="text-xs text-muted-foreground">
              {pendingPayments.length} pending verification
            </span>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto size-12 text-success/60" />
              <h3 className="mt-3 font-bold text-base">All payments up to date!</h3>
              <p className="text-xs mt-1">There are no pending customer screenshot submissions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((order) => {
                const payment = order.payments?.[0];
                const screenshotUrl = payment?.screenshot_path
                  ? proofUrls?.[payment.screenshot_path]
                  : null;

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border bg-card p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
                      <div>
                        <span className="font-display text-lg font-bold">{order.order_number}</span>
                        <p className="text-xs text-muted-foreground">
                          Customer: <strong>{order.customer_name}</strong> (+91{" "}
                          {order.customer_phone}) • {fmtDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-display text-xl font-bold text-primary">
                          {inr(order.total)}
                        </span>
                        <StatusPill value={order.payment_status} kind="payment" />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 text-xs">
                        <p>
                          <span className="text-muted-foreground">UTR / Transaction Ref:</span>{" "}
                          <strong className="text-foreground text-sm font-mono">
                            {payment?.transaction_ref}
                          </strong>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Submission Time:</span>{" "}
                          {payment ? fmtDate(payment.submitted_at) : "N/A"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Fulfillment:</span>{" "}
                          <span className="capitalize">{order.fulfillment}</span>
                        </p>
                        {order.fulfillment === "delivery" && (
                          <p>
                            <span className="text-muted-foreground">Address:</span>{" "}
                            {order.delivery_address}
                          </p>
                        )}
                      </div>

                      {/* Payment Screenshot */}
                      <div>
                        <span className="text-xs font-bold block mb-1.5">
                          Submitted Screenshot:
                        </span>
                        {screenshotUrl ? (
                          <a href={screenshotUrl} target="_blank" rel="noreferrer">
                            <img
                              src={screenshotUrl}
                              alt="Payment Screenshot"
                              className="size-48 rounded-xl border object-cover hover:opacity-95 transition"
                            />
                            <span className="text-[10px] text-primary underline mt-1 block">
                              Click to view full image in new tab
                            </span>
                          </a>
                        ) : (
                          <div className="size-48 flex items-center justify-center rounded-xl border bg-muted text-xs text-muted-foreground">
                            Loading screenshot…
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                      {payment && (
                        <>
                          <Button
                            size="sm"
                            disabled={reviewingAction}
                            onClick={() => handleReviewPayment(payment.id, "verify")}
                            className="rounded-full bg-success text-success-foreground hover:bg-success/90 text-xs font-bold"
                          >
                            <Check className="mr-1 size-3.5" /> Approve & Confirm Order
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={reviewingAction}
                            onClick={() => {
                              const reason = prompt(
                                "Enter reason for rejecting this payment proof:",
                              );
                              if (reason) {
                                setRejectionReason(reason);
                                handleReviewPayment(payment.id, "reject");
                              }
                            }}
                            className="rounded-full text-xs font-bold"
                          >
                            <X className="mr-1 size-3.5" /> Reject Proof
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={reviewingAction}
                            onClick={() => handleReviewPayment(payment.id, "under_review")}
                            className="rounded-full text-xs"
                          >
                            Mark Under Review
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. ORDERS MANAGEMENT */}
      {activeTab === "orders" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">All Orders ({orders?.length ?? 0})</h2>
          </div>

          <div className="space-y-3">
            {orders?.map((order) => (
              <div key={order.id} className="rounded-2xl border bg-card p-5 shadow-2xs space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-display text-base font-bold">{order.order_number}</span>
                    <p className="text-xs text-muted-foreground">
                      Customer: {order.customer_name} (+91 {order.customer_phone}) • Placed{" "}
                      {fmtDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-bold text-primary">{inr(order.total)}</span>
                    <StatusPill value={order.status} kind="order" />
                    <StatusPill value={order.payment_status} kind="payment" />
                  </div>
                </div>

                {/* Items preview */}
                <div className="rounded-xl border bg-muted/20 p-3 text-xs space-y-1">
                  {order.order_items?.map((it) => (
                    <div key={it.id} className="flex justify-between">
                      <span>
                        {it.product_name} ({it.size_label}) × {it.quantity}
                      </span>
                      <span className="font-semibold">{inr(it.line_total)}</span>
                    </div>
                  ))}
                </div>

                {/* Status Transitions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
                  <span className="text-muted-foreground font-semibold">Change status:</span>
                  {order.status === "confirmed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateOrderStatus(order.id, "processing")}
                      className="h-7 text-xs"
                    >
                      Move to Processing
                    </Button>
                  )}
                  {order.status === "processing" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                      className="h-7 text-xs font-bold text-success border-success"
                    >
                      Mark Completed
                    </Button>
                  )}
                  {order.status !== "cancelled" && order.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const reason = prompt("Enter cancellation reason:");
                        if (reason) {
                          supabase
                            .rpc("admin_update_order_status", {
                              p_order_id: order.id,
                              p_status: "cancelled",
                              p_reason: reason,
                            })
                            .then(({ error }) => {
                              if (error) toast.error(error.message);
                              else {
                                toast.success("Order cancelled");
                                refetchOrders();
                              }
                            });
                        }
                      }}
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Cancel Order
                    </Button>
                  )}
                  {order.status === "cancelled" && order.payment_status === "verified" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        supabase
                          .rpc("admin_mark_refunded", { p_order_id: order.id })
                          .then(({ error }) => {
                            if (error) toast.error(error.message);
                            else {
                              toast.success("Marked as refunded");
                              refetchOrders();
                            }
                          });
                      }}
                      className="h-7 text-xs"
                    >
                      Mark Refunded
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. CATEGORIES */}
      {activeTab === "categories" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">
              Categories ({categories?.length ?? 0})
            </h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingCatId(null);
                setCatName("");
                setCatSlug("");
                setCatSortOrder(String((categories?.length ?? 0) + 1));
                setCatModalOpen(true);
              }}
              className="rounded-full text-xs"
            >
              <Plus className="mr-1 size-3.5" /> Add Category
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-bold text-muted-foreground">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories?.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="p-3 font-mono">{c.sort_order}</td>
                    <td className="p-3 font-semibold">{c.name}</td>
                    <td className="p-3 text-muted-foreground">{c.slug}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.is_active
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCatId(c.id);
                          setCatName(c.name);
                          setCatSlug(c.slug);
                          setCatSortOrder(String(c.sort_order));
                          setCatModalOpen(true);
                        }}
                        className="size-7 p-0"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. STORE SETTINGS */}
      {activeTab === "settings" && (
        <div className="mt-6 max-w-2xl">
          <form
            onSubmit={handleSaveSettings}
            className="rounded-2xl border bg-card p-6 shadow-xs space-y-4"
          >
            <h2 className="font-display text-xl font-bold">Store Configuration</h2>
            <p className="text-xs text-muted-foreground">
              Configure store identity, actual UPI payment ID, QR code, and delivery terms.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold">Store Name</label>
                <input
                  type="text"
                  required
                  value={settingsForm.store_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold">Store Phone</label>
                <input
                  type="text"
                  required
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold">WhatsApp Number</label>
                <input
                  type="text"
                  required
                  value={settingsForm.whatsapp}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold">Store UPI ID</label>
                <input
                  type="text"
                  required
                  value={settingsForm.upi_id}
                  onChange={(e) => setSettingsForm({ ...settingsForm, upi_id: e.target.value })}
                  placeholder="e.g. 7981809751@upi"
                  className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold">Store Address</label>
              <textarea
                rows={2}
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                className="mt-1 w-full rounded-xl border bg-background p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold">Tagline</label>
              <input
                type="text"
                value={settingsForm.tagline}
                onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold">Delivery Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={settingsForm.delivery_fee}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      delivery_fee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold">Low Stock Alert (units)</label>
                <input
                  type="number"
                  min="1"
                  value={settingsForm.low_stock_threshold}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      low_stock_threshold: parseInt(e.target.value) || 3,
                    })
                  }
                  className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold">Order Hold (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settingsForm.reservation_hours}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      reservation_hours: parseInt(e.target.value) || 24,
                    })
                  }
                  className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                />
              </div>
            </div>

            {/* Shop QR Code Upload */}
            <div>
              <label className="text-xs font-bold block mb-1">Shop UPI QR Code</label>
              <ImagePicker
                label="Upload Shop QR Image"
                camera={false}
                onChange={(f) => setQrFile(f)}
              />
            </div>

            <Button
              type="submit"
              disabled={savingSettings}
              className="rounded-full px-6 text-xs font-semibold"
            >
              {savingSettings ? "Saving Settings…" : "Save Store Settings"}
            </Button>
          </form>
        </div>
      )}

      {/* PRODUCT CREATE/EDIT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-lg font-bold">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold">Product Name</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Pure Cotton Daily Wear Nighty"
                  className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                  >
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold">Inventory Mode</label>
                  <select
                    value={prodInventoryMode}
                    onChange={(e) =>
                      setProdInventoryMode(e.target.value as "size_based" | "free_size")
                    }
                    className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                  >
                    <option value="size_based">Size-Based (S, M, L, XL, etc.)</option>
                    <option value="free_size">Free Size (Universal)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="299.00"
                    className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold">Original MRP (Optional ₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodOriginalPrice}
                    onChange={(e) => setProdOriginalPrice(e.target.value)}
                    placeholder="499.00"
                    className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                  />
                </div>
              </div>

              {/* Sizes / Inventory Rows */}
              {prodInventoryMode === "free_size" ? (
                <div>
                  <label className="text-xs font-bold">Free Size Stock (units)</label>
                  <input
                    type="number"
                    min="0"
                    value={prodFreeStock}
                    onChange={(e) => setProdFreeStock(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                  />
                </div>
              ) : (
                <div className="rounded-xl border p-3 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">Sizes & Inventory</span>
                    <button
                      type="button"
                      onClick={() => setProdSizes([...prodSizes, { size_label: "", stock: 0 }])}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      + Add Size
                    </button>
                  </div>
                  <div className="space-y-2">
                    {prodSizes.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={s.size_label}
                          onChange={(e) => {
                            const next = [...prodSizes];
                            next[idx] = { ...s, size_label: e.target.value };
                            setProdSizes(next);
                          }}
                          placeholder="Label (e.g. XL)"
                          className="h-8 w-24 rounded-lg border bg-background px-2 text-xs"
                        />
                        <input
                          type="number"
                          min="0"
                          required
                          value={s.stock}
                          onChange={(e) => {
                            const next = [...prodSizes];
                            next[idx] = { ...s, stock: parseInt(e.target.value) || 0 };
                            setProdSizes(next);
                          }}
                          placeholder="Stock"
                          className="h-8 w-24 rounded-lg border bg-background px-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setProdSizes(prodSizes.filter((_, i) => i !== idx))}
                          className="text-destructive p-1"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold">Description</label>
                <textarea
                  rows={3}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Fabric details, washing instructions, fit..."
                  className="mt-1 w-full rounded-xl border bg-background p-2.5 text-xs"
                />
              </div>

              {/* Photo Image Picker with Phone Camera & Desktop Gallery */}
              <div>
                <ImagePicker
                  label="Product Photo"
                  currentUrl={
                    editingProduct?.image_path
                      ? `https://jfdltecrsdblwsmmcvzr.supabase.co/storage/v1/object/public/product-images/${editingProduct.image_path}`
                      : undefined
                  }
                  onChange={(f) => setProdImageFile(f)}
                  camera={true}
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={prodIsActive}
                    onChange={(e) => setProdIsActive(e.target.checked)}
                    className="size-4 rounded"
                  />
                  Active (Visible in shop)
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={prodIsFeatured}
                    onChange={(e) => setProdIsFeatured(e.target.checked)}
                    className="size-4 rounded"
                  />
                  Featured on homepage
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setProductModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingProduct} className="text-xs font-semibold">
                  {savingProduct ? "Saving…" : "Save Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY CREATE/EDIT MODAL */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold border-b pb-3">
              {editingCatId ? "Edit Category" : "Add New Category"}
            </h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingCategory(true);
                try {
                  const slug =
                    catSlug.trim() ||
                    catName
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "");

                  if (editingCatId) {
                    const { error } = await supabase
                      .from("categories")
                      .update({
                        name: catName.trim(),
                        slug,
                        sort_order: parseInt(catSortOrder) || 0,
                      })
                      .eq("id", editingCatId);
                    if (error) throw error;
                    toast.success("Category updated");
                  } else {
                    const { error } = await supabase.from("categories").insert({
                      name: catName.trim(),
                      slug,
                      sort_order: parseInt(catSortOrder) || 0,
                    });
                    if (error) throw error;
                    toast.success("Category added");
                  }
                  setCatModalOpen(false);
                  refetchCategories();
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : "Failed to save category");
                } finally {
                  setSavingCategory(false);
                }
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="text-xs font-bold">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Cotton Dress Materials"
                  className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold">Slug</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. cotton-dress-materials"
                  className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold">Sort Order</label>
                <input
                  type="number"
                  value={catSortOrder}
                  onChange={(e) => setCatSortOrder(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCatModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingCategory} className="text-xs font-semibold">
                  {savingCategory ? "Saving…" : "Save Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
