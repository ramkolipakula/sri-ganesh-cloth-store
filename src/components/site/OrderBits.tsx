import { Check } from "lucide-react";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";

const tone: Record<string, string> = {
  pending_payment: "bg-warning/30 text-warning-foreground",
  unpaid: "bg-warning/30 text-warning-foreground",
  proof_submitted: "bg-secondary text-secondary-foreground",
  under_review: "bg-secondary text-secondary-foreground",
  confirmed: "bg-success/15 text-success",
  verified: "bg-success/15 text-success",
  processing: "bg-accent text-accent-foreground",
  completed: "bg-navy text-navy-foreground",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

export function StatusPill({ value, kind }: { value: string; kind: "order" | "payment" }) {
  const label = (kind === "order" ? ORDER_STATUS_LABEL : PAYMENT_STATUS_LABEL)[value] ?? value;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${tone[value] ?? "bg-muted"}`}
    >
      {label}
    </span>
  );
}

export function OrderTimeline({
  status,
  paymentStatus,
}: {
  status: string;
  paymentStatus: string;
}) {
  const proof = ["proof_submitted", "under_review", "verified", "refunded"].includes(paymentStatus);
  const verified = ["verified", "refunded"].includes(paymentStatus);
  const steps = [
    { label: "Order created", done: true },
    { label: "Payment proof submitted", done: proof },
    { label: "Payment verified", done: verified },
    {
      label: "Order confirmed",
      done: verified && ["confirmed", "processing", "completed"].includes(status),
    },
    { label: "Processing", done: ["processing", "completed"].includes(status) },
    { label: "Completed", done: status === "completed" },
  ];
  if (status === "cancelled")
    return (
      <p className="rounded-lg bg-muted p-3 text-sm font-semibold">
        This order was cancelled{paymentStatus === "refunded" ? " and refunded" : ""}.
      </p>
    );
  return (
    <ol className="space-y-3">
      {steps.map((s) => (
        <li key={s.label} className="flex items-center gap-3 text-sm">
          <span
            className={`flex size-6 items-center justify-center rounded-full border-2 ${s.done ? "border-success bg-success text-success-foreground" : "border-border"}`}
          >
            {s.done && <Check className="size-3.5" />}
          </span>
          <span className={s.done ? "font-semibold" : "text-muted-foreground"}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
