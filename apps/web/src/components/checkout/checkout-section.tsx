"use client";

import { motion, useReducedMotion } from "framer-motion";

export function CheckoutSection({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="border border-[#E5E1D9] bg-white p-4 sm:p-5"
    >
      <h2 className="font-serif text-xl leading-none text-[#003F2D] sm:text-[1.35rem]">
        {title}
      </h2>
      <span className="mt-2 block h-px w-10 bg-[#B68A25]" aria-hidden />
      <div className="mt-3.5">{children}</div>
    </motion.section>
  );
}
