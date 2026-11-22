"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export type FooterNavLink = {
  href: string;
  label: string;
};

export function FooterLinks({
  title,
  links,
  underlineDelay = 0.2,
}: {
  title: string;
  links: readonly FooterNavLink[];
  underlineDelay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <nav aria-label={title}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#B68A25]">
        {title}
      </p>
      <motion.span
        aria-hidden
        className="mt-2 block h-px w-7 origin-left bg-[#B68A25]"
        initial={reduceMotion ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{
          duration: reduceMotion ? 0 : 0.45,
          delay: reduceMotion ? 0 : underlineDelay,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="footer-nav-link">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
