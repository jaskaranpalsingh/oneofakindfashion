"use client";

import { useState, type FormEvent } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { PublicStoreSettings } from "@/lib/store-settings";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-1.5 h-11 w-full border border-[#E5DFD4] bg-white px-3.5 text-[14px] text-[#003F2D] placeholder:text-[#9CA3AF] transition focus:border-[#003F2D] focus:outline-none focus:ring-1 focus:ring-[#003F2D]";

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B726E]";

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function mapsHref(
  addressLine1: string,
  city: string,
  province: string,
  country: string
) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${addressLine1}, ${city}, ${province}, ${country}`
  )}`;
}

export function ContactPageView({ settings }: { settings: PublicStoreSettings }) {
  const reduceMotion = useReducedMotion();
  const [status, setStatus] = useState<"idle" | "opened">("idle");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();

    const subject = encodeURIComponent(
      name ? `Boutique enquiry from ${name}` : "Boutique enquiry"
    );
    const body = encodeURIComponent(
      [
        message,
        "",
        "—",
        name ? `Name: ${name}` : null,
        email ? `Email: ${email}` : null,
        phone ? `Phone: ${phone}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    );

    window.location.href = `mailto:${settings.email}?subject=${subject}&body=${body}`;
    setStatus("opened");
  }

  const details = [
    {
      key: "visit",
      icon: MapPin,
      label: "Visit",
      href: mapsHref(
        settings.addressLine1,
        settings.city,
        settings.province,
        settings.country
      ),
      external: true,
      lines: [
        settings.addressLine1,
        `${settings.city}, ${settings.province}, ${settings.country}`,
      ],
    },
    {
      key: "call",
      icon: Phone,
      label: "Call",
      href: telHref(settings.phone),
      external: false,
      lines: [settings.phone],
    },
    {
      key: "email",
      icon: Mail,
      label: "Email",
      href: `mailto:${settings.email}`,
      external: false,
      lines: [settings.email],
    },
  ] as const;

  return (
    <section className="bg-[#FAF7F0] py-12 sm:py-16 lg:py-20">
      <Container className="max-w-[1100px]">
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C49A36]">
            Boutique
          </p>
          <h1 className="mt-3 font-serif text-[2.25rem] leading-none tracking-[-0.02em] text-[#003F2D] sm:text-[2.75rem]">
            Contact us
          </h1>
          <span className="mt-4 block h-px w-10 bg-[#C49A36]" aria-hidden />
          <p className="mt-4 text-[15px] leading-relaxed text-[#6B726E]">
            Reach {settings.storeName} for orders, fittings, and styling
            questions.
          </p>
        </motion.header>

        <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:items-start">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.04 }}
            className="space-y-7"
          >
            {details.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex gap-3.5">
                  <Icon
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#003F2D]"
                    strokeWidth={1.6}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
                      {item.label}
                    </p>
                    <a
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className={cn(
                        "mt-1.5 block text-[15px] leading-relaxed text-[#003F2D] transition hover:text-[#0B513B]",
                        item.key === "email" && "break-all"
                      )}
                    >
                      {item.lines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </a>
                  </div>
                </div>
              );
            })}

            <p className="border-t border-[#E5DFD4] pt-6 text-[13px] leading-relaxed text-[#6B726E]">
              Prefer a quick reply? Call or email the boutique directly and we
              will help you with your order or appointment.
            </p>
          </motion.div>

          <motion.form
            onSubmit={onSubmit}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08 }}
            className="border border-[#E5DFD4] bg-white p-5 sm:p-7"
            noValidate
          >
            <h2 className="font-serif text-[1.35rem] leading-none text-[#003F2D]">
              Send a message
            </h2>
            <p className="mt-2 text-[13px] text-[#6B726E]">
              We will respond as soon as we can during boutique hours.
            </p>

            <div className="mt-6 space-y-4">
              <label className={labelClass}>
                Name
                <input
                  name="name"
                  required
                  autoComplete="name"
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                Phone{" "}
                <span className="font-normal normal-case tracking-normal text-[#9CA3AF]">
                  (optional)
                </span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                Message
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us about your order, fitting, or styling question."
                  className={cn(
                    fieldClass,
                    "h-auto min-h-[132px] resize-y py-3 leading-relaxed"
                  )}
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex h-11 items-center bg-[#003F2D] px-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#0B513B]"
            >
              Send message
            </button>

            {status === "opened" ? (
              <p className="mt-3 text-[13px] text-[#003F2D]" role="status">
                Your email app should open with the message ready to send.
              </p>
            ) : (
              <p className="mt-3 text-[12px] leading-relaxed text-[#6B726E]">
                Sends through your email app to {settings.email}.
              </p>
            )}
          </motion.form>
        </div>
      </Container>
    </section>
  );
}
