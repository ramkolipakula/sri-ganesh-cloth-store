import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  ShoppingBag,
  LogOut,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  Upload,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  PackageCheck,
  RefreshCw,
  QrCode,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { inr, fmtDate } from "@/lib/format";
import { StatusPill, OrderTimeline } from "@/components/site/OrderBits";
import { ImagePicker } from "@/components/site/ImagePicker";
import { uploadWithProgress, extFor, useImageUrls } from "@/lib/storage";
import { useSettings } from "@/lib/queries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account & Orders — Sri Ganesh Cloth Centre" },
      {
        name: "description",
        content: "Track your orders and manage your account at Sri Ganesh Cloth Centre.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const { data: settings } = useSettings();

  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Profile Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Re-submission / Payment Proof state
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitTxRef, setResubmitTxRef] = useState("");
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Fetch Customer Profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setAddress(data.address ?? "");
      }
      return data;
    },
  });

  // Fetch Customer Orders
  const {
    data: orders,
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["customer-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), payments(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Selected Order
  const selectedOrder = orders?.find((o) => o.id === selectedOrderId);

  // Fetch private screenshot for selected order's payment if available
  const latestPayment = selectedOrder?.payments?.[0];
  const { data: paymentScreenshots } = useImageUrls(
    "payment-proofs",
    latestPayment?.screenshot_path ? [latestPayment.screenshot_path] : [],
  );

  // Store QR code
  const { data: storeAssets } = useImageUrls(
    "store-assets",
    settings?.qr_image_path ? [settings.qr_image_path] : [],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">
        Loading account…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <User className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Please sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to view your order history and manage your delivery details.
        </p>
        <Link
          to="/auth"
          search={{ redirect: "/account" }}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    toast.success("Signed out successfully");
    navigate({ to: "/" });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated successfully!");
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const trimmedRef = resubmitTxRef.trim();
    if (trimmedRef.length < 4 || trimmedRef.length > 64) {
      toast.error("Please enter a valid UPI reference number");
      return;
    }

    if (!resubmitFile) {
      toast.error("Please choose a payment screenshot");
      return;
    }

    setResubmitting(true);
    try {
      const ext = extFor(resubmitFile);
      const fileName = `${Date.now()}.${ext}`;
      const storagePath = `${user.id}/${selectedOrder.id}/${fileName}`;

      await uploadWithProgress("payment-proofs", storagePath, resubmitFile, (pct) =>
        setUploadProgress(pct),
      );

      const { error: rpcError } = await supabase.rpc("submit_payment_proof", {
        p_order_id: selectedOrder.id,
        p_transaction_ref: trimmedRef,
        p_screenshot_path: storagePath,
      });

      if (rpcError) throw rpcError;

      toast.success("Payment proof submitted successfully!");
      setResubmitFile(null);
      setResubmitTxRef("");
      refetchOrders();
      qc.invalidateQueries({ queryKey: ["customer-orders"] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit proof";
      toast.error(message);
    } finally {
      setResubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Account Header */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User className="size-7" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold sm:text-2xl">
              {profile?.full_name || user.email?.split("@")[0] || "Customer Account"}
            </h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            {profile?.phone && (
              <p className="text-xs text-muted-foreground">Mobile: +91 {profile.phone}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs">
            <LogOut className="mr-1 size-3.5" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b">
        <button
          type="button"
          onClick={() => {
            setActiveTab("orders");
            setSelectedOrderId(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingBag className="size-4" /> My Orders ({orders?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("profile");
            setSelectedOrderId(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="size-4" /> Profile & Address
        </button>
      </div>

      {/* Order Detail Modal / View */}
      {selectedOrder ? (
        <div className="mt-6 space-y-6">
          <button
            type="button"
            onClick={() => setSelectedOrderId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            ← Back to all orders
          </button>

          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order Details
                </span>
                <h2 className="font-display text-2xl font-bold">{selectedOrder.order_number}</h2>
                <p className="text-xs text-muted-foreground">
                  Placed on {fmtDate(selectedOrder.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill value={selectedOrder.status} kind="order" />
                <StatusPill value={selectedOrder.payment_status} kind="payment" />
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-6 border-b pb-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Order Status Timeline
              </h3>
              <OrderTimeline
                status={selectedOrder.status}
                paymentStatus={selectedOrder.payment_status}
              />
            </div>

            {/* Ordered Items */}
            <div className="mt-6 border-b pb-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Items in this order
              </h3>
              <div className="divide-y rounded-xl border">
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3.5 text-sm">
                    <div>
                      <p className="font-semibold">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Size: <span className="font-bold text-foreground">{item.size_label}</span> ×{" "}
                        {item.quantity}
                      </p>
                    </div>
                    <span className="font-display font-bold">{inr(item.line_total)}</span>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="mt-4 space-y-1.5 text-sm text-right">
                <p className="text-xs text-muted-foreground">
                  Subtotal: <strong>{inr(selectedOrder.subtotal)}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Fulfillment ({selectedOrder.fulfillment}):{" "}
                  <strong>
                    {Number(selectedOrder.delivery_fee) > 0
                      ? inr(selectedOrder.delivery_fee)
                      : "Free"}
                  </strong>
                </p>
                <p className="font-display text-base font-bold text-primary">
                  Total: {inr(selectedOrder.total)}
                </p>
              </div>
            </div>

            {/* Delivery / Fulfillment info */}
            <div className="mt-6 border-b pb-6 text-xs text-muted-foreground">
              <h3 className="mb-2 font-bold uppercase tracking-wider text-foreground">
                Recipient & Fulfillment
              </h3>
              <p>Name: {selectedOrder.customer_name}</p>
              <p>Phone: +91 {selectedOrder.customer_phone}</p>
              {selectedOrder.fulfillment === "delivery" ? (
                <p className="mt-1">
                  Delivery Address:{" "}
                  <span className="font-medium text-foreground">
                    {selectedOrder.delivery_address}
                  </span>
                </p>
              ) : (
                <p className="mt-1">
                  Pickup: Sri Ganesh Cloth Centre, Durga Bazar, Arilova Colony, Visakhapatnam
                </p>
              )}
            </div>

            {/* Payment Proof Section */}
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Payment Verification Info
              </h3>

              {selectedOrder.payment_status === "rejected" && (
                <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                  <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                    <AlertCircle className="size-4" /> Proof was rejected by the shop
                  </div>
                  <p className="mt-1 text-xs text-destructive">
                    Reason: {latestPayment?.rejection_reason || "Invalid transaction details."}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Please submit a new payment proof below with your valid UPI transaction receipt.
                  </p>
                </div>
              )}

              {/* Resubmit form if payment is unpaid or rejected */}
              {(selectedOrder.payment_status === "unpaid" ||
                selectedOrder.payment_status === "rejected") &&
                selectedOrder.status !== "cancelled" && (
                  <form
                    onSubmit={handleResubmitProof}
                    className="mt-4 rounded-2xl border bg-muted/20 p-5 space-y-4"
                  >
                    <h4 className="font-bold text-sm">
                      {selectedOrder.payment_status === "rejected"
                        ? "Resubmit Payment Proof"
                        : "Submit Payment Proof"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Pay <strong>{inr(selectedOrder.total)}</strong> to UPI ID:{" "}
                      <strong>{settings?.upi_id || "7981809751@upi"}</strong>, then upload proof.
                    </p>

                    <div>
                      <label className="text-xs font-bold">Transaction ID / UTR Reference</label>
                      <input
                        type="text"
                        required
                        value={resubmitTxRef}
                        onChange={(e) => setResubmitTxRef(e.target.value)}
                        placeholder="e.g. 324512984561"
                        className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <ImagePicker
                      label="Payment Screenshot"
                      onChange={(f) => setResubmitFile(f)}
                      camera={true}
                    />

                    {uploadProgress !== null && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>Uploading…</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={resubmitting || !resubmitFile || !resubmitTxRef.trim()}
                      className="rounded-full text-xs"
                    >
                      {resubmitting ? "Submitting…" : "Upload & Submit Proof"}
                    </Button>
                  </form>
                )}

              {/* Display existing payment submissions */}
              {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                <div className="mt-4 space-y-3">
                  {selectedOrder.payments.map((p) => (
                    <div key={p.id} className="rounded-xl border bg-card p-4 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Transaction Ref: {p.transaction_ref}</span>
                        <StatusPill value={p.status} kind="payment" />
                      </div>
                      <p className="text-muted-foreground">Submitted: {fmtDate(p.submitted_at)}</p>
                      {p.rejection_reason && (
                        <p className="text-destructive">Rejection Note: {p.rejection_reason}</p>
                      )}
                      {latestPayment?.screenshot_path &&
                        paymentScreenshots?.[latestPayment.screenshot_path] && (
                          <div className="mt-2">
                            <span className="font-semibold block mb-1">Uploaded Screenshot:</span>
                            <img
                              src={paymentScreenshots[latestPayment.screenshot_path]}
                              alt="Payment Evidence"
                              className="size-32 rounded-lg border object-cover"
                            />
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "orders" ? (
        /* Orders List */
        <div className="mt-6 space-y-4">
          {loadingOrders ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl border bg-muted/40" />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center">
              <ShoppingBag className="mx-auto size-12 text-muted-foreground" />
              <h2 className="mt-3 font-display text-lg font-bold">No orders yet</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Your past and active orders from Sri Ganesh Cloth Centre will show up here.
              </p>
              <Link
                to="/shop"
                search={{}}
                className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="group flex cursor-pointer flex-col justify-between gap-3 rounded-2xl border bg-card p-5 shadow-2xs transition hover:border-primary/50 hover:shadow-xs sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-bold text-foreground">
                      {order.order_number}
                    </span>
                    <StatusPill value={order.status} kind="order" />
                    <StatusPill value={order.payment_status} kind="payment" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Placed on {fmtDate(order.created_at)} • {order.order_items?.length ?? 0} item(s)
                    • {order.fulfillment === "delivery" ? "Home Delivery" : "Store Pickup"}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="font-display text-lg font-bold text-primary">
                    {inr(order.total)}
                  </span>
                  <div className="flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                    View Details <ChevronRight className="size-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Profile Tab */
        <div className="mt-6 max-w-xl">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl border bg-card p-6 shadow-xs space-y-4"
          >
            <h2 className="font-display text-lg font-bold">Personal & Delivery Details</h2>
            <p className="text-xs text-muted-foreground">
              These details are prefilled when placing new orders.
            </p>

            <div>
              <label className="text-xs font-bold">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Name"
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold">Mobile Phone (10 digits)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 7981809751"
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold">Default Delivery Address</label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Door No, Street, Landmark, Arilova Colony, Visakhapatnam, 530040"
                className="mt-1 w-full rounded-xl border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={savingProfile}
              className="rounded-full px-6 text-xs font-semibold"
            >
              {savingProfile ? "Saving…" : "Save Profile"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
