import type { Transition, Variants } from "framer-motion";

export const easeOutSoft: Transition["ease"] = [0.22, 1, 0.36, 1];

export const whyShopViewport = {
  once: true,
  amount: 0.28,
} as const;

export const labelVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOutSoft },
  },
};

export const headingVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: 0.12, ease: easeOutSoft },
  },
};

export const descriptionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.25, ease: easeOutSoft },
  },
};

export const dividerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delay: 0.38, duration: 0.35, ease: easeOutSoft },
  },
};

export const dividerLineVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { delay: 0.38, duration: 0.6, ease: easeOutSoft },
  },
};

export const lotusVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.42, duration: 0.45, ease: easeOutSoft },
  },
};

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay: 0.5 + index * 0.12,
      ease: easeOutSoft,
    },
  }),
};

export const iconVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: 0.62 + index * 0.12,
      ease: easeOutSoft,
    },
  }),
};
