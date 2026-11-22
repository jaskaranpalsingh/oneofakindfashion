import type { Transition, Variants } from "framer-motion";

export const easeOutSoft: Transition["ease"] = [0.22, 1, 0.36, 1];

export const sectionViewport = {
  once: true,
  amount: 0.25,
} as const;

export const browseLabelVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOutSoft },
  },
};

export const headingVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.1, ease: easeOutSoft },
  },
};

export const dividerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delay: 0.22, duration: 0.35, ease: easeOutSoft },
  },
};

export const dividerLineVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { delay: 0.22, duration: 0.7, ease: easeOutSoft },
  },
};

export const lotusVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.28, duration: 0.55, ease: easeOutSoft },
  },
};

export const descriptionVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.38, duration: 0.55, ease: easeOutSoft },
  },
};

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.72,
      delay: 0.45 + index * 0.1,
      ease: easeOutSoft,
    },
  }),
};
