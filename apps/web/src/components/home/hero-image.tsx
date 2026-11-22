"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { imageFrameVariants } from "@/components/home/hero-motion";

export function HeroImage() {
  const reduceMotion = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const [allowParallax, setAllowParallax] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setAllowParallax(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion || !allowParallax ? [0, 0] : [10, -16]
  );

  return (
    <motion.div
      ref={frameRef}
      variants={imageFrameVariants}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      className="relative z-10 w-full"
    >
      <div className="relative aspect-[3/4] overflow-hidden border border-[#D4AF37] bg-[#F8F5EB] sm:aspect-[4/5] lg:min-h-[560px] lg:aspect-auto xl:min-h-[620px]">
        <motion.div
          style={{ y: parallaxY }}
          className="absolute inset-[-3%] will-change-transform"
        >
          <Image
            src="/images/hero-traditional-wear.jpg"
            alt="Model wearing an emerald green traditional Indian outfit with gold embroidery and jewellery"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover object-[center_15%] transition duration-700 ease-out md:group-hover:scale-[1.02]"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
