"use client";

import type { LucideIcon } from "lucide-react";
import { Mail, MapPin, Phone } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function ContactIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#003F2D]/[0.08] text-[#003F2D]">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
    </span>
  );
}

export function FooterContact({
  addressLine1,
  city,
  province,
  country,
  phone,
  email,
  underlineDelay = 0.35,
}: {
  addressLine1: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  email: string;
  underlineDelay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#B68A25]">
        Contact
      </p>
      <motion.span
        aria-hidden
        className="mt-2 block h-px w-7 origin-left bg-[#B68A25]"
        initial={reduceMotion ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{
          duration: reduceMotion ? 0 : 0.45,
          delay: reduceMotion ? 0 : underlineDelay,
          ease: [0.22, 1, 0.36, 1],
        }}
      />

      <ul className="mt-4 space-y-3.5 text-[13.5px] leading-relaxed text-[#2F3A36]">
        <li className="flex gap-3">
          <ContactIcon Icon={MapPin} />
          <p>
            {addressLine1}
            <br />
            {city}, {province}, {country}
          </p>
        </li>
        <li className="flex items-center gap-3">
          <ContactIcon Icon={Phone} />
          <a href={telHref(phone)} className="footer-contact-link">
            {phone}
          </a>
        </li>
        <li className="flex items-start gap-3">
          <ContactIcon Icon={Mail} />
          <a href={`mailto:${email}`} className="footer-contact-link break-all">
            {email}
          </a>
        </li>
      </ul>
    </div>
  );
}
