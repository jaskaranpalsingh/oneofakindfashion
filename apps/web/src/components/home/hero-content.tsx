"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import {
  descriptionVariants,
  dividerVariants,
  headingLineVariants,
  labelVariants,
  lineVariants,
  lotusVariants,
  primaryButtonVariants,
  secondaryButtonVariants,
} from "@/components/home/hero-motion";
import { cn } from "@/lib/utils";

export function HeroContent() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative z-10 flex max-w-xl flex-col justify-center py-4 lg:py-8">
      <motion.p
        variants={labelVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37] sm:text-[11px]"
      >
        Edmonton <span aria-hidden>•</span> Ethnic Fashion Boutique
      </motion.p>

      <h1 className="mt-5 font-serif text-[2.85rem] leading-[1.02] tracking-[-0.02em] text-[#003F2D] sm:text-5xl md:text-6xl lg:mt-6 lg:text-[4.35rem]">
        <span className="block overflow-hidden">
          <motion.span
            className="block"
            custom={0.5}
            variants={headingLineVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
          >
            Elegance Rooted in
          </motion.span>
        </span>
        <span className="block overflow-hidden">
          <motion.span
            className="block"
            custom={0.7}
            variants={headingLineVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
          >
            Tradition
          </motion.span>
        </span>
      </h1>

      <motion.div
        variants={dividerVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        className="mt-6 flex items-center gap-3"
      >
        <motion.span
          variants={lineVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          className="h-px w-14 origin-center bg-[#D4AF37] sm:w-16"
        />
        <motion.span
          variants={lotusVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          className="text-[#D4AF37]"
          aria-hidden
        >
          <Heart className="h-3.5 w-3.5 fill-current" strokeWidth={1.5} />
        </motion.span>
        <motion.span
          variants={lineVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          className="h-px w-14 origin-center bg-[#D4AF37] sm:w-16"
        />
      </motion.div>

      <motion.p
        variants={descriptionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        className="mt-6 max-w-lg font-serif text-xl leading-snug text-[#003F2D] sm:text-2xl"
      >
        Discover Beautiful Lehengas, Suits & Jewellery
      </motion.p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <motion.div
          variants={primaryButtonVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
        >
          <Link
            href="/shop"
            className={cn(
              "group inline-flex h-[52px] items-center justify-center gap-2.5 bg-[#003F2D] px-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition duration-300",
              "hover:-translate-y-0.5 hover:bg-[#0B513B]",
              "active:translate-y-0 active:scale-[0.99]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F5EB]"
            )}
          >
            Shop Collection
            <ArrowRight className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <motion.div
          variants={secondaryButtonVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
        >
          <Link
            href="/shop/jewellery"
            className={cn(
              "group inline-flex h-[52px] items-center justify-center gap-2.5 border border-[#D4AF37] bg-[#FAF8F3] px-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#003F2D] transition duration-300",
              "hover:bg-white",
              "active:scale-[0.99]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F5EB]"
            )}
          >
            Explore Jewellery
            <ArrowRight className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
