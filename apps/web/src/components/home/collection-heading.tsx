"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LotusOrnament } from "@/components/home/hero-decorations";
import {
  browseLabelVariants,
  descriptionVariants,
  dividerLineVariants,
  dividerVariants,
  headingVariants,
  lotusVariants,
  sectionViewport,
} from "@/components/home/collection-motion";

export function CollectionHeading({
  eyebrow = "Browse",
  title = "Explore Our Collections",
  description = "Four signature edits that define ONE OF A KIND FASHION.",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-3xl text-center">
      <motion.div
        variants={browseLabelVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={sectionViewport}
        className="flex items-center justify-center gap-4"
      >
        <span className="hidden h-px w-12 bg-[#C6A24A] sm:block sm:w-16" />
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#C6A24A]">
          {eyebrow}
        </p>
        <span className="hidden h-px w-12 bg-[#C6A24A] sm:block sm:w-16" />
      </motion.div>

      <motion.h2
        id="collections-heading"
        variants={headingVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={sectionViewport}
        className="mt-4 font-serif text-4xl font-normal tracking-[-0.02em] text-[#003F2D] sm:text-5xl lg:text-[3.4rem]"
      >
        {title}
      </motion.h2>

      <motion.div
        variants={dividerVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={sectionViewport}
        className="mt-5 flex items-center justify-center gap-3"
      >
        <motion.span
          variants={dividerLineVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={sectionViewport}
          className="h-px w-12 origin-center bg-[#D4AF37] sm:w-14"
        />
        <motion.span
          variants={lotusVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={sectionViewport}
          className="text-[#D4AF37]"
        >
          <LotusOrnament className="h-5 w-9" />
        </motion.span>
        <motion.span
          variants={dividerLineVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={sectionViewport}
          className="h-px w-12 origin-center bg-[#D4AF37] sm:w-14"
        />
      </motion.div>

      <motion.p
        variants={descriptionVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={sectionViewport}
        className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-[#73776F] sm:text-[18px]"
      >
        {description}
      </motion.p>
    </div>
  );
}
