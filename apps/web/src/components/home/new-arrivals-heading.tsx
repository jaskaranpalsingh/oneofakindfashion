"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  descriptionVariants,
  dividerVariants,
  headingVariants,
  labelVariants,
  sectionViewport,
  viewAllVariants,
} from "@/components/home/new-arrivals-motion";

export function NewArrivalsHeading() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-2xl">
        <motion.p
          variants={labelVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={sectionViewport}
          className="text-[12px] font-medium uppercase tracking-[0.32em] text-[#C6A24A] sm:text-[13px]"
        >
          Just in
        </motion.p>

        <motion.h2
          id="new-arrivals-heading"
          variants={headingVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={sectionViewport}
          className="mt-3 font-serif text-[2.25rem] font-normal leading-[1.1] tracking-[-0.02em] text-[#003F2D] sm:text-[2.75rem] lg:text-[3.75rem]"
        >
          New Arrivals
        </motion.h2>

        <motion.span
          aria-hidden
          variants={dividerVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={sectionViewport}
          className="mt-4 block h-px w-[100px] origin-left bg-[#D4AF37]"
        />

        <motion.p
          variants={descriptionVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={sectionViewport}
          className="mt-4 max-w-lg text-sm leading-relaxed text-[#6F746E] sm:text-[15px]"
        >
          Discover the latest additions to our jewellery and fashion
          collections.
        </motion.p>
      </div>

      <motion.div
        variants={viewAllVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={sectionViewport}
        className="shrink-0 sm:pt-2"
      >
        <Link
          href="/shop/new-arrivals"
          className="group inline-flex items-center gap-2 border-b border-[#D4AF37] pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#003F2D] outline-none transition hover:text-[#0B513B] focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF9F0]"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5 text-[#D4AF37] transition duration-300 group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </div>
  );
}
