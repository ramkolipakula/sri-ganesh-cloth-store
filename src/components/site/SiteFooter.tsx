import { Phone, MapPin, MessageCircle } from "lucide-react";
import { useSettings } from "@/lib/queries";

export function SiteFooter() {
  const { data: s } = useSettings();
  const phone = s?.phone ?? "7981809751";
  return (
    <footer className="mt-16 bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl">Sri Ganesh Cloth Centre</p>
          <p className="mt-2 text-sm opacity-80">
            {s?.tagline || "Quality Clothes, Comfort for Every You"}
          </p>
          <p className="mt-3 inline-block rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">
            Wholesale Rate ki Retail Ammabadanu
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="flex gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {s?.address}
          </p>
          <a href={`tel:+91${phone}`} className="flex gap-2 hover:underline">
            <Phone className="size-4" />
            {phone}
          </a>
          <a
            href={`https://wa.me/${s?.whatsapp ?? "91" + phone}`}
            target="_blank"
            rel="noreferrer"
            className="flex gap-2 hover:underline"
          >
            <MessageCircle className="size-4" />
            WhatsApp us
          </a>
        </div>
        <p className="text-xs opacity-60 sm:text-right">
          Payments via UPI. Every payment is verified manually by the shop.
        </p>
      </div>
    </footer>
  );
}
