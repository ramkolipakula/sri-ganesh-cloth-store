export const inr = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    Number(n ?? 0),
  );

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const fmtDate = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

export function errMsg(e: unknown): string {
  if (!e) return "Something went wrong";
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong";
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "Unpaid",
  proof_submitted: "Proof submitted",
  under_review: "Under review",
  verified: "Verified",
  rejected: "Rejected",
  refunded: "Refunded",
};

export const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
