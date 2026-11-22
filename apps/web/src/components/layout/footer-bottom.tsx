"use client";

import { motion, useReducedMotion } from "framer-motion";

export function FooterBottom({
  storeName,
  currency,
  secureCheckout,
}: {
  storeName: string;
  currency: string;
  secureCheckout: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const year = new Date().getFullYear();

  return (
    <motion.div
      className="border-t border-[#0B513B] bg-[#003F2D]"
      initial={reduceMotion ? false : { opacity: 0.85 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: reduceMotion ? 0 : 0.45 }}
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-5 py-4 text-[12px] leading-relaxed text-[#D7E2DC] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-8 lg:px-12 xl:px-16">
        <p>
          © {year} {storeName}. All rights reserved.
        </p>
        <p className="sm:text-right">
          <span className="text-[#B68A25]">Prices in {currency}</span>
          {secureCheckout ? (
            <span className="text-[#D7E2DC]/80"> · Secure checkout</span>
          ) : null}
        </p>
      </div>
    </motion.div>
  );
}
