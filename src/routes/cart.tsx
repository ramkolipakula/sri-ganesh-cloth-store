import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Upload,
  QrCode,
  MapPin,
  Clock,
  Sparkles,
  ArrowLeft,
  Store,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useCart, type CartItem } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { ProductImg } from "@/components/site/ProductCard";
import { useImageUrls, uploadWithProgress, extFor } from "@/lib/storage";
import { ImagePicker } from "@/components/site/ImagePicker";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart & Checkout — Sri Ganesh Cloth Centre" },
      {
        name: "description",
        content: "Review your cart and checkout safely at Sri Ganesh Cloth Centre, Visakhapatnam.",
      },
    ],
  }),
  component: CartPage,
});

type OrderPlacedDetails = {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  fulfillment: string;
};

function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, count, subtotal, setQty, remove, clear, ready } = useCart();
  const { data: settings } = useSettings();

  // Fetch product images for items in cart
  const { data: cartImages } = useImageUrls(
    "product-images",
    items.map((i) => i.imagePath),
  );

  // Store QR code signed URL if configured
  const { data: storeAssets } = useImageUrls(
    "store-assets",
    settings?.qr_image_path ? [settings.qr_image_path] : [],
  );

  // Checkout inputs
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderPlacedDetails | null>(null);

  // Payment proof submission inputs
  const [transactionRef, setTransactionRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);

  // Prefill profile data if available
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name, phone, address")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.full_name) setCustomerName(data.full_name);
            if (data.phone) setCustomerPhone(data.phone);
            if (data.address) setDeliveryAddress(data.address);
          }
        });
    }
  }, [user]);

  // Delivery fee calculation
  const deliveryFee =
    fulfillment === "delivery" && settings?.delivery_enabled
      ? Number(settings?.delivery_fee ?? 0)
      : 0;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/cart" } });
      return;
    }

    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }

    const trimmedName = customerName.trim();
    const cleanPhone = customerPhone.replace(/[^0-9]/g, "");

    if (trimmedName.length < 2) {
      toast.error("Please enter your full name");
      return;
    }

    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (fulfillment === "delivery") {
      if (deliveryAddress.trim().length < 10) {
        toast.error("Please enter a complete delivery address (at least 10 characters)");
        return;
      }
    }

    setPlacingOrder(true);
    const idempotencyKey = crypto.randomUUID();

    try {
      // 1. Call place_order RPC
      const { data: orderId, error: rpcError } = await supabase.rpc("place_order", {
        p_items: items.map((i) => ({
          product_id: i.productId,
          size: i.size,
          quantity: i.quantity,
        })),
        p_customer_name: trimmedName,
        p_customer_phone: cleanPhone,
        p_fulfillment: fulfillment,
        p_address: fulfillment === "delivery" ? deliveryAddress.trim() : "",
        p_idempotency_key: idempotencyKey,
      });

      if (rpcError) throw rpcError;

      // 2. Query newly created order details
      const { data: orderData, error: fetchError } = await supabase
        .from("orders")
        .select("id, order_number, total, subtotal, delivery_fee, fulfillment")
        .eq("id", orderId)
        .single();

      if (fetchError || !orderData) {
        throw new Error("Order was placed, but failed to retrieve confirmation.");
      }

      // 3. Clear cart
      clear();

      // 4. Update UI to payment submission step
      setPlacedOrder({
        id: orderData.id,
        orderNumber: orderData.order_number,
        total: Number(orderData.total),
        subtotal: Number(orderData.subtotal),
        deliveryFee: Number(orderData.delivery_fee),
        fulfillment: orderData.fulfillment,
      });

      toast.success(`Order ${orderData.order_number} created successfully!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to place order";
      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !placedOrder) return;

    const trimmedRef = transactionRef.trim();
    if (trimmedRef.length < 4 || trimmedRef.length > 64) {
      toast.error("Please enter a valid UPI transaction reference / UTR number (4-64 characters)");
      return;
    }

    if (!proofFile) {
      toast.error("Please select or capture your payment screenshot proof");
      return;
    }

    setSubmittingProof(true);
    try {
      // 1. Upload screenshot to private payment-proofs bucket
      const ext = extFor(proofFile);
      const fileName = `${Date.now()}.${ext}`;
      const storagePath = `${user.id}/${placedOrder.id}/${fileName}`;

      await uploadWithProgress("payment-proofs", storagePath, proofFile, (pct) =>
        setUploadProgress(pct),
      );

      // 2. Submit payment proof to DB RPC
      const { error: rpcError } = await supabase.rpc("submit_payment_proof", {
        p_order_id: placedOrder.id,
        p_transaction_ref: trimmedRef,
        p_screenshot_path: storagePath,
      });

      if (rpcError) throw rpcError;

      setProofSubmitted(true);
      toast.success("Payment proof submitted! The shop will verify it shortly.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit payment proof";
      toast.error(message);
    } finally {
      setSubmittingProof(false);
      setUploadProgress(null);
    }
  };

  // If order was placed and proof submitted:
  if (placedOrder && proofSubmitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-10" />
        </div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Proof Received!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you! We received your payment screenshot for order{" "}
          <strong className="text-foreground">{placedOrder.orderNumber}</strong>.
        </p>
        <div className="mt-6 rounded-2xl border bg-card p-5 text-left text-sm space-y-2">
          <p className="flex justify-between">
            <span className="text-muted-foreground">Order Number:</span>
            <span className="font-bold">{placedOrder.orderNumber}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">Amount Paid:</span>
            <span className="font-bold text-primary">{inr(placedOrder.total)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-bold text-navy">Proof Submitted (Under Review)</span>
          </p>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Sri Ganesh Cloth Centre will verify the payment against their UPI bank statement and
          update your order status.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/account"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            Track in My Orders
          </Link>
          <Link
            to="/shop"
            search={{}}
            className="rounded-full border px-6 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // If order was placed, display UPI QR and Proof Submission
  if (placedOrder) {
    const upiId = settings?.upi_id || "7981809751@upi";
    const payeeName = settings?.payee_name || "Sri Ganesh Cloth Centre";
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      payeeName,
    )}&am=${encodeURIComponent(placedOrder.total.toFixed(2))}&cu=INR&tn=${encodeURIComponent(
      `Order ${placedOrder.orderNumber}`,
    )}`;

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-navy">
              <Clock className="size-3.5" /> Order Placed — Payment Required
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
              Pay ₹{placedOrder.total} via UPI
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Order Number: <strong className="text-foreground">{placedOrder.orderNumber}</strong>
            </p>
          </div>

          {/* QR Code and Payment Details */}
          <div className="mt-6 flex flex-col items-center rounded-2xl border bg-muted/20 p-6 text-center">
            {settings?.qr_image_path && storeAssets?.[settings.qr_image_path] ? (
              <img
                src={storeAssets[settings.qr_image_path]}
                alt="Shop UPI QR"
                className="size-52 rounded-xl border bg-white p-2 object-contain shadow-xs"
              />
            ) : (
              <div className="flex size-52 flex-col items-center justify-center rounded-xl border bg-white p-4 text-center shadow-xs">
                <QrCode className="size-20 text-navy" />
                <span className="mt-2 text-xs font-bold text-foreground">
                  Scan with any UPI App
                </span>
                <span className="text-[10px] text-muted-foreground">PhonePe / GPay / Paytm</span>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-bold">
              <span>UPI ID: {upiId}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(upiId);
                  toast.success("UPI ID copied to clipboard!");
                }}
                className="text-primary hover:text-primary/80"
                aria-label="Copy UPI ID"
              >
                <Copy className="size-3.5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Pay exact amount: <strong className="text-primary">{inr(placedOrder.total)}</strong>
            </p>
          </div>

          {/* Payment Instructions */}
          <div className="mt-6 rounded-xl border bg-card p-4 text-xs text-muted-foreground">
            <h2 className="font-bold text-foreground">How to complete payment:</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Open PhonePe, Google Pay, Paytm or any UPI application.</li>
              <li>
                Scan the QR code above or pay to UPI ID: <strong>{upiId}</strong>.
              </li>
              <li>
                Enter exact amount <strong>{inr(placedOrder.total)}</strong>.
              </li>
              <li>After payment, take a screenshot of the successful transaction.</li>
              <li>Enter the UTR / Transaction Reference number and upload the screenshot below.</li>
            </ol>
          </div>

          {/* Upload Proof Form */}
          <form onSubmit={handleSubmitProof} className="mt-8 space-y-4 border-t pt-6">
            <h2 className="font-display text-lg font-bold">Submit Payment Evidence</h2>

            <div>
              <label className="text-xs font-bold text-foreground">
                Transaction ID / UTR Reference
              </label>
              <input
                type="text"
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. 324512984561 (from PhonePe/GPay receipt)"
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Found in your payment app under transaction details.
              </p>
            </div>

            <div>
              <ImagePicker
                label="Payment Screenshot (Proof)"
                onChange={(file) => setProofFile(file)}
                camera={true}
              />
            </div>

            {uploadProgress !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Uploading screenshot…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={submittingProof || !proofFile || !transactionRef.trim()}
                className="w-full rounded-full py-2.5 text-sm font-semibold shadow-xs"
              >
                {submittingProof ? "Submitting Proof…" : "Submit Payment Proof"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Cart Empty State
  if (ready && items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShoppingBag className="size-8" />
        </div>
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You haven't added any clothes or sarees to your bag yet.
        </p>
        <Link
          to="/shop"
          search={{}}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
        >
          <ArrowRight className="size-4" /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground">
            {count} {count === 1 ? "item" : "items"} in your shopping bag
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clear} className="text-xs text-muted-foreground">
          <Trash2 className="mr-1 size-3.5" /> Clear Cart
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Cart Items List */}
        <div className="space-y-4 lg:col-span-7">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.size}`}
              className="flex gap-4 rounded-2xl border bg-card p-4 shadow-2xs"
            >
              <div className="size-20 shrink-0 overflow-hidden rounded-xl border bg-muted sm:size-24">
                <ProductImg
                  url={item.imagePath ? cartImages?.[item.imagePath] : undefined}
                  alt={item.name}
                />
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.slug }}
                      className="font-semibold hover:text-primary text-sm line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(item.productId, item.size)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">
                      Size: {item.size}
                    </span>
                    <span className="text-xs font-bold text-primary">{inr(item.price)}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {/* Quantity adjustment */}
                  <div className="flex items-center rounded-lg border bg-background">
                    <button
                      type="button"
                      onClick={() => setQty(item.productId, item.size, item.quantity - 1)}
                      className="px-2.5 py-1 text-xs font-bold hover:bg-muted"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.productId, item.size, item.quantity + 1)}
                      className="px-2.5 py-1 text-xs font-bold hover:bg-muted"
                      disabled={item.quantity >= item.maxStock}
                    >
                      +
                    </button>
                  </div>

                  <span className="font-display font-bold text-sm">
                    {inr(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Checkout & Order Form */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-xl font-bold">Order Summary</h2>

            {/* Price breakdown */}
            <div className="mt-4 space-y-2 border-b pb-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span>{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Fulfillment</span>
                <span>
                  {fulfillment === "pickup"
                    ? "Store Pickup (Free)"
                    : deliveryFee > 0
                      ? inr(deliveryFee)
                      : "Free Delivery"}
                </span>
              </div>
              <div className="flex justify-between font-display text-base font-bold text-foreground pt-2">
                <span>Total Amount</span>
                <span className="text-primary">{inr(grandTotal)}</span>
              </div>
            </div>

            {/* If NOT authenticated */}
            {!user ? (
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-xs font-bold text-foreground">Sign in to complete checkout</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Your cart items are saved. Sign in or register to enter delivery details.
                </p>
                <Link
                  to="/auth"
                  search={{ redirect: "/cart" }}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  Sign In to Continue <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              /* If authenticated: Checkout details form */
              <form onSubmit={handlePlaceOrder} className="mt-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contact & Fulfillment
                </h3>

                <div>
                  <label className="text-xs font-bold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Recipient's Name"
                    className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold">Mobile Phone (10 Digits)</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold">Fulfillment Method</label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfillment("delivery")}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition ${
                        fulfillment === "delivery"
                          ? "border-primary bg-primary/5 text-primary"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Truck className="mb-1 size-4" /> Home Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillment("pickup")}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition ${
                        fulfillment === "pickup"
                          ? "border-primary bg-primary/5 text-primary"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Store className="mb-1 size-4" /> Store Pickup
                    </button>
                  </div>
                </div>

                {fulfillment === "delivery" ? (
                  <div>
                    <label className="text-xs font-bold">Delivery Address</label>
                    <textarea
                      required
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Door No, Street, Landmark, Arilova / Visakhapatnam, PIN 530040"
                      className="mt-1 w-full rounded-xl border bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border bg-muted/40 p-3 text-[11px] text-muted-foreground">
                    <p className="font-bold text-foreground">Pickup Address:</p>
                    <p className="mt-0.5">
                      Door No. 199/3, Near Ramalayam Temple, Durga Bazar, Arilova Colony,
                      Visakhapatnam – 530040
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={placingOrder}
                  className="w-full rounded-full py-2.5 text-sm font-semibold shadow-xs"
                >
                  {placingOrder ? "Placing Order…" : `Place Order — ${inr(grandTotal)}`}
                </Button>

                <p className="text-center text-[11px] text-muted-foreground">
                  Stock is reserved atomically upon placement. Pay via UPI in the next step.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
