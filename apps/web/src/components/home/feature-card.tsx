"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  cardVariants,
  iconVariants,
  whyShopViewport,
} from "@/components/home/why-shop-motion";
import { cn } from "@/lib/utils";

type IconComponent = (props: {
  className?: string;
  strokeWidth?: number;
}) => React.ReactNode;

export type FeatureCardItem = {
  title: string;
  description: string;
  icon: IconComponent;
};

export function HangerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12 4.5C12 3.67 12.67 3 13.5 3C14.33 3 15 3.67 15 4.5C15 5.2 14.52 5.78 13.88 5.95L12 6.5V9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 18.5L12 9.5L19.5 18.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.75 18.5H20.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FeatureCard({
  item,
  index,
}: {
  item: FeatureCardItem;
  index: number;
}) {
  const reduceMotion = useReducedMotion();
  const Icon = item.icon;

  return (
    <motion.article
      custom={index}
      variants={cardVariants}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={whyShopViewport}
      className={cn(
        "group rounded-2xl border border-[#E5D8B9] bg-white p-9 shadow-[0_8px_24px_rgba(0,63,45,0.04)] transition duration-300 sm:p-10",
        "hover:-translate-y-1 hover:border-[#B68A25] hover:shadow-[0_14px_30px_rgba(0,63,45,0.08)]",
        "motion-reduce:transform-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      )}
    >
      <motion.div
        custom={index}
        variants={iconVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={whyShopViewport}
        className={cn(
          "inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F0E2] text-[#B68A25] transition duration-300",
          "group-hover:scale-105 group-hover:bg-[#F3E8D0]",
          "motion-reduce:group-hover:scale-100"
        )}
      >
        <Icon className="h-7 w-7" strokeWidth={1.5} />
      </motion.div>

      <h3 className="mt-6 font-serif text-[1.65rem] font-normal leading-snug text-[#003F2D] sm:text-[1.75rem]">
        {item.title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-[#656565] sm:text-base">
        {item.description}
      </p>
    </motion.article>
  );
}
