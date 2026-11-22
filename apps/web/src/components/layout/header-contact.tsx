import { DEFAULT_STORE } from "@ookf/shared";
import { MapPin, Phone } from "lucide-react";

export function HeaderContact() {
  return (
    <div className="relative z-10 hidden min-w-0 max-w-[16.5rem] flex-col gap-1.5 text-[#FFF9EF] lg:flex">
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
        <p className="text-[11px] leading-snug text-[#FFF9EF]/92">
          {DEFAULT_STORE.addressLine1}, {DEFAULT_STORE.city},{" "}
          {DEFAULT_STORE.province}, Canada
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Phone className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
        <a
          href={`tel:${DEFAULT_STORE.phone}`}
          className="text-[12px] font-medium tracking-wide text-[#FFF9EF] transition hover:text-gold-light"
        >
          {DEFAULT_STORE.phone}
        </a>
      </div>
    </div>
  );
}
