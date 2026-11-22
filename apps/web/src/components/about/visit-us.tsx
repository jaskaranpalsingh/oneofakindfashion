"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function mapsHref(
  addressLine1: string,
  city: string,
  province: string,
  country: string
) {
  const query = encodeURIComponent(
    `${addressLine1}, ${city}, ${province}, ${country}`
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function VisitUs({
  addressLine1,
  city,
  province,
  country,
  phone,
  email,
}: {
  addressLine1: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  email: string;
}) {
  const reduceMotion = useReducedMotion();

  const items = [
    {
      key: "address",
      icon: MapPin,
      href: mapsHref(addressLine1, city, province, country),
      external: true,
      label: `Open address in Google Maps: ${addressLine1}, ${city}, ${province}, ${country}`,
      content: (
        <>
          <span className="block">{addressLine1}</span>
          <span className="block">
            {city}, {province}, {country}
          </span>
        </>
      ),
    },
    {
      key: "phone",
      icon: Phone,
      href: telHref(phone),
      external: false,
      label: `Call ${phone}`,
      content: phone,
    },
    {
      key: "email",
      icon: Mail,
      href: `mailto:${email}`,
      external: false,
      label: `Email ${email}`,
      content: email,
    },
  ] as const;

  return (
    <motion.section
      aria-labelledby="visit-us-heading"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: reduceMotion ? 0 : 0.7,
        ease,
      }}
      className={cn(
        "mx-auto w-full max-w-[1600px] rounded-2xl border border-[#E8E1D8] bg-white",
        "px-6 py-6 shadow-[0_8px_28px_rgba(6,78,59,0.06)] transition-[box-shadow] duration-300",
        "hover:shadow-[0_12px_34px_rgba(6,78,59,0.1)]",
        "sm:px-8 sm:py-8 lg:px-10 lg:py-10"
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center">
        {/* Heading */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: reduceMotion ? 0 : 0.55,
            delay: reduceMotion ? 0 : 0.05,
            ease,
          }}
          className="shrink-0 border-b border-[#E8E1D8] pb-5 lg:w-[9.5rem] lg:border-b-0 lg:pb-0 lg:pr-8 xl:w-[10.5rem] xl:pr-10"
        >
          <h2
            id="visit-us-heading"
            className="font-serif text-[28px] leading-none text-[#064E3B] sm:text-[30px] lg:text-[32px]"
          >
            Visit Us
          </h2>
          <motion.span
            aria-hidden
            className="mt-3 block h-px w-10 origin-left bg-[#C49A32]"
            initial={reduceMotion ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{
              duration: reduceMotion ? 0 : 0.8,
              delay: reduceMotion ? 0 : 0.2,
              ease,
            }}
          />
        </motion.div>

        {/* Contact items */}
        <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === items.length - 1;

            return (
              <motion.div
                key={item.key}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.55,
                  delay: reduceMotion ? 0 : 0.15 + index * 0.1,
                  ease,
                }}
                className={cn(
                  "border-[#E8E1D8] py-5",
                  !isLast && "border-b sm:border-b-0",
                  // Tablet: 2 columns with dividers
                  index === 0 && "sm:border-r sm:pr-6",
                  index === 1 && "sm:pl-6 sm:border-b sm:pb-5 lg:border-b-0 lg:pb-5",
                  index === 2 && "sm:col-span-2 sm:pt-5 lg:col-span-1 lg:pt-5 lg:pl-0",
                  // Desktop: vertical dividers from heading
                  "lg:border-l lg:border-b-0 lg:px-6 lg:py-0 xl:px-8",
                  index === 2 && "lg:pr-0"
                )}
              >
                <a
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  aria-label={item.label}
                  className={cn(
                    "group flex items-start gap-3 text-[14px] leading-relaxed text-[#181818]",
                    "transition-colors duration-[220ms] hover:text-[#064E3B]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A32] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  )}
                >
                  <Icon
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#064E3B] transition duration-[220ms] group-hover:-translate-y-0.5 group-hover:text-[#C49A32] motion-reduce:transform-none"
                    strokeWidth={1.6}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "min-w-0",
                      item.key === "email" && "break-all sm:break-words"
                    )}
                  >
                    {item.content}
                  </span>
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
