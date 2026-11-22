"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AboutHighlights } from "@/components/about/about-highlights";

const ease = [0.22, 1, 0.36, 1] as const;

export function AboutStory({
  introduction = "A Canadian boutique specialising in Indian traditional clothing, ethnic wear, wedding outfits, and jewellery.",
  paragraphOne = "ONE OF A KIND FASHION is an Edmonton-based ethnic fashion boutique created for celebrations that deserve something singular. We curate lehengas, suits, and jewellery with a focus on elegance, craftsmanship, and wearable luxury.",
  paragraphTwo = "From bridal fittings to festive occasion wear, our goal is to help you find pieces that feel personal — tradition, styled to perfection.",
}: {
  introduction?: string;
  paragraphOne?: string;
  paragraphTwo?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="max-w-xl lg:max-w-none">
      <motion.nav
        aria-label="Breadcrumb"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.1 }}
        className="text-[12px] tracking-[0.02em] text-[#626B67]"
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href="/"
              className="transition hover:text-[#003F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A25]/50 focus-visible:ring-offset-2"
            >
              Home
            </Link>
          </li>
          <li aria-hidden className="text-[#B68A25]/80">
            /
          </li>
          <li className="text-[#252A27]" aria-current="page">
            Our Story
          </li>
        </ol>
      </motion.nav>

      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.5,
          delay: reduceMotion ? 0 : 0.2,
          ease,
        }}
        className="mt-8 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#B68A25] sm:text-[12px]"
      >
        Our Story
      </motion.p>

      <div className="mt-4 overflow-hidden">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.55,
            delay: reduceMotion ? 0 : 0.28,
            ease,
          }}
          className="font-serif text-[20px] italic leading-none text-[#003F2D]/75 sm:text-[22px]"
        >
          About
        </motion.p>
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.7,
            delay: reduceMotion ? 0 : 0.36,
            ease,
          }}
          className="mt-1.5 font-serif text-[clamp(2rem,4.2vw,3.35rem)] font-medium leading-[1.05] tracking-[0.01em] text-[#003F2D]"
        >
          ONE OF A KIND FASHION
        </motion.h1>
      </div>

      <motion.span
        aria-hidden
        className="mt-6 block h-px w-16 origin-left bg-[#B68A25]"
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          duration: reduceMotion ? 0 : 0.6,
          delay: reduceMotion ? 0 : 0.52,
          ease,
        }}
      />

      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.55,
          delay: reduceMotion ? 0 : 0.62,
          ease,
        }}
        className="mt-6 max-w-[32rem] font-serif text-[20px] italic leading-[1.55] text-[#3A4541] sm:text-[22px] lg:text-[24px]"
      >
        {introduction}
      </motion.p>

      <div className="mt-7 max-w-[36rem] space-y-5 text-[16px] leading-[1.75] text-[#626B67] sm:text-[17px]">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.55,
            delay: reduceMotion ? 0 : 0.75,
            ease,
          }}
        >
          {paragraphOne}
        </motion.p>
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.55,
            delay: reduceMotion ? 0 : 0.9,
            ease,
          }}
        >
          {paragraphTwo}
        </motion.p>
      </div>

      <AboutHighlights />
    </div>
  );
}
