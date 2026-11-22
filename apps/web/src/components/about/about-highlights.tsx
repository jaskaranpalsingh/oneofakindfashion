"use client";

import { Gem } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { HangerIcon } from "@/components/home/feature-card";

function LotusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 19c2.8-2.2 4.5-4.4 4.5-7.2 0-2.1-1.3-3.5-2.8-3.5-.8 0-1.5.4-1.7 1" />
      <path d="M12 19c-2.8-2.2-4.5-4.4-4.5-7.2 0-2.1 1.3-3.5 2.8-3.5.8 0 1.5.4 1.7 1" />
      <path d="M12 19V9.5" />
      <path d="M12 8.2c1.2-1.6 2.2-2.4 3.8-3.2-1.7.2-3 .9-3.8 2.2-0.8-1.3-2.1-2-3.8-2.2 1.6.8 2.6 1.6 3.8 3.2Z" />
      <path d="M8.5 19h7" />
    </svg>
  );
}

const HIGHLIGHTS = [
  {
    title: "Curated Collections",
    icon: Gem,
  },
  {
    title: "Expert Styling Support",
    icon: HangerIcon,
  },
  {
    title: "Timeless Craftsmanship",
    icon: LotusIcon,
  },
] as const;

export function AboutHighlights() {
  const reduceMotion = useReducedMotion();

  return (
    <ul className="mt-10 grid grid-cols-1 gap-6 border-t border-[#E5D9C8] pt-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#E5D9C8]">
      {HIGHLIGHTS.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.li
            key={item.title}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: reduceMotion ? 0 : 0.5,
              delay: reduceMotion ? 0 : 0.05 + index * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-center gap-3 sm:flex-col sm:items-start sm:px-5 first:sm:pl-0 last:sm:pr-0"
          >
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: reduceMotion ? 0 : 0.45,
                delay: reduceMotion ? 0 : 0.1 + index * 0.1,
              }}
              className="inline-flex text-[#B68A25] transition duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </motion.span>
            <p className="font-serif text-[17px] leading-snug text-[#003F2D] sm:text-lg">
              {item.title}
            </p>
          </motion.li>
        );
      })}
    </ul>
  );
}
