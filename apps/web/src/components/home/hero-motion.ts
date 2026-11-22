import type { Transition, Variants } from "framer-motion";

export const easeOutLuxury: Transition["ease"] = [0.22, 1, 0.36, 1];

export const heroEase = {
  soft: { duration: 0.7, ease: easeOutLuxury } satisfies Transition,
  image: { duration: 1.1, ease: easeOutLuxury } satisfies Transition,
  line: { duration: 0.7, ease: easeOutLuxury } satisfies Transition,
  button: { duration: 0.28, ease: easeOutLuxury } satisfies Transition,
};

export const labelVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.15, ease: easeOutLuxury },
  },
};

export const headingLineVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: easeOutLuxury },
  }),
};

export const dividerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delay: 0.9, duration: 0.35, ease: easeOutLuxury },
  },
};

export const lineVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { delay: 0.9, duration: 0.7, ease: easeOutLuxury },
  },
};

export const lotusVariants: Variants = {
  hidden: { opacity: 0, scale: 0.86 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.95, duration: 0.55, ease: easeOutLuxury },
  },
};

export const descriptionVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 1.05, duration: 0.55, ease: easeOutLuxury },
  },
};

export const primaryButtonVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 1.2, duration: 0.5, ease: easeOutLuxury },
  },
};

export const secondaryButtonVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 1.3, duration: 0.5, ease: easeOutLuxury },
  },
};

export const imageFrameVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 1.06 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.3, duration: 1.1, ease: easeOutLuxury },
  },
};

export const captionLabelVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 1.15, duration: 0.5, ease: easeOutLuxury },
  },
};

export const captionHeadingVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 1.3, duration: 0.55, ease: easeOutLuxury },
  },
};

export const captionLineVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { delay: 1.45, duration: 0.55, ease: easeOutLuxury },
  },
};
