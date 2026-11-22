"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function AboutFashionImage({
  src = "/images/about/about-editorial.jpg",
  alt = "Traditional embroidered lehenga styled in the ONE OF A KIND FASHION boutique",
}: {
  src?: string;
  alt?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [allowParallax, setAllowParallax] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setAllowParallax(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion || !allowParallax ? [0, 0] : [12, -12]
  );

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
      <div
        aria-hidden
        className="absolute -right-3 -top-4 hidden h-[92%] w-[92%] bg-[#E8DFD0] sm:block lg:-right-5 lg:-top-5"
      />
      <motion.div
        style={reduceMotion ? undefined : { y }}
        initial={
          reduceMotion ? false : { opacity: 0, scale: 1.035, y: 15 }
        }
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.9,
          delay: reduceMotion ? 0 : 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative overflow-hidden bg-[#F3EEE4]"
      >
        <div className="group relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={src}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 38vw"
            className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </div>
      </motion.div>
    </div>
  );
}
