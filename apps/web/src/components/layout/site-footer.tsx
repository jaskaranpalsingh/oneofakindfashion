"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FooterBottom } from "@/components/layout/footer-bottom";
import { FooterBrand } from "@/components/layout/footer-brand";
import { FooterContact } from "@/components/layout/footer-contact";
import { FooterLinks } from "@/components/layout/footer-links";
import {
  DEFAULT_PUBLIC_SETTINGS,
  type PublicStoreSettings,
} from "@/lib/store-settings";

const SHOP_LINKS = [
  { href: "/shop/lehengas", label: "Lehengas" },
  { href: "/shop/suits", label: "Suits" },
  { href: "/shop/jewellery", label: "Jewellery" },
  { href: "/shop/new-arrivals", label: "New Arrivals" },
] as const;

const CARE_LINKS = [
  { href: "/contact", label: "Contact Us" },
  { href: "/faq", label: "FAQs" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/track-order", label: "Track Order" },
  { href: "/returns", label: "Returns" },
  { href: "/privacy-policy", label: "Privacy Policy" },
] as const;

const columnReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export function SiteFooter({
  settings = DEFAULT_PUBLIC_SETTINGS,
}: {
  settings?: PublicStoreSettings;
}) {
  const reduceMotion = useReducedMotion();
  const transition = {
    duration: reduceMotion ? 0 : 0.5,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <footer className="mt-auto bg-[#F4F1EA]">
      {/* Soft green wash + brand edge */}
      <div
        aria-hidden
        className="h-1 w-full bg-gradient-to-r from-[#003F2D] via-[#0B513B] to-[#B68A25]"
      />

      <div className="relative overflow-hidden bg-[linear-gradient(180deg,#EEF3EF_0%,#F7F4EE_28%,#F7F4EE_100%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-[#003F2D]/[0.04] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-10 h-52 w-52 rounded-full bg-[#0B513B]/[0.05] blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-0 pt-14 sm:px-8 sm:pt-16 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 gap-9 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-[1.4fr_0.85fr_1fr_1.25fr] lg:gap-x-12">
            <motion.div
              variants={columnReveal}
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...transition, delay: 0 }}
            >
              <FooterBrand
                storeName={settings.storeName}
                socialLinks={settings.socialLinks}
              />
            </motion.div>

            <motion.div
              variants={columnReveal}
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...transition, delay: reduceMotion ? 0 : 0.08 }}
            >
              <FooterLinks
                title="Shop"
                links={SHOP_LINKS}
                underlineDelay={0.16}
              />
            </motion.div>

            <motion.div
              variants={columnReveal}
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...transition, delay: reduceMotion ? 0 : 0.16 }}
            >
              <FooterLinks
                title="Customer Care"
                links={CARE_LINKS}
                underlineDelay={0.24}
              />
            </motion.div>

            <motion.div
              variants={columnReveal}
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...transition, delay: reduceMotion ? 0 : 0.24 }}
            >
              <FooterContact
                addressLine1={settings.addressLine1}
                city={settings.city}
                province={settings.province}
                country={settings.country}
                phone={settings.phone}
                email={settings.email}
                underlineDelay={0.32}
              />
            </motion.div>
          </div>

          <div className="mt-12 sm:mt-14" />
        </div>
      </div>

      <FooterBottom
        storeName={settings.storeName}
        currency={settings.currency || "CAD"}
        secureCheckout={settings.payments.stripeConfigured}
      />
    </footer>
  );
}
