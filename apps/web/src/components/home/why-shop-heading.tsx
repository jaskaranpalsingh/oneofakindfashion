"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LotusOrnament } from "@/components/home/hero-decorations";
import {
  descriptionVariants,
  dividerLineVariants,
  dividerVariants,
  headingVariants,
  labelVariants,
  lotusVariants,
  whyShopViewport,
} from "@/components/home/why-shop-motion";

export function WhyShopHeading() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-[850px] text-center">
      <motion.div
        variants={labelVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={whyShopViewport}
        className="flex items-center justify-center gap-4"
      >
        <span className="h-px w-10 bg-[#B68A25] sm:w-14" aria-hidden />
        <p className="text-[13px] font-medium uppercase tracking-[0.28em] text-[#B68A25] sm:text-[14px]">
          Why Us
        </p>
        <span className="h-px w-10 bg-[#B68A25] sm:w-14" aria-hidden />
      </motion.div>

      <motion.h2
        id="why-shop-heading"
        variants={headingVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={whyShopViewport}
        className="mt-4 font-serif text-4xl font-normal tracking-[-0.02em] text-[#003F2D] sm:text-5xl lg:text-[3.75rem]"
      >
        Why Shop With Us
      </motion.h2>

      <motion.p
        variants={descriptionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={whyShopViewport}
        className="mx-auto mt-5 max-w-3xl text-[16px] leading-relaxed text-[#656565] sm:text-[17px]"
      >
        A boutique experience built for real inventory, real orders, and lasting
        celebrations.
      </motion.p>

      <motion.div
        variants={dividerVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={whyShopViewport}
        className="mt-6 flex items-center justify-center gap-3"
      >
        <motion.span
          variants={dividerLineVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={whyShopViewport}
          className="h-px w-14 origin-center bg-[#B68A25] sm:w-16"
          aria-hidden
        />
        <motion.span
          variants={lotusVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={whyShopViewport}
          className="text-[#B68A25]"
        >
          <LotusOrnament className="h-5 w-9" />
        </motion.span>
        <motion.span
          variants={dividerLineVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={whyShopViewport}
          className="h-px w-14 origin-center bg-[#B68A25] sm:w-16"
          aria-hidden
        />
      </motion.div>
    </div>
  );
}
