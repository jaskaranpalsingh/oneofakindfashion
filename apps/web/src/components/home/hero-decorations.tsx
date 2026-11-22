"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";

function FloralMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="110" cy="110" r="18" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="110" cy="110" r="8" stroke="currentColor" strokeWidth="0.7" />
      {Array.from({ length: 8 }).map((_, index) => {
        const angle = (index * Math.PI) / 4;
        const x = 110 + Math.cos(angle) * 46;
        const y = 110 + Math.sin(angle) * 46;
        return (
          <g key={index} transform={`rotate(${index * 45} 110 110)`}>
            <path
              d={`M110 110 C ${110 + 18} ${110 - 28}, ${110 + 34} ${110 - 34}, ${x} ${y}`}
              stroke="currentColor"
              strokeWidth="0.7"
              fill="none"
            />
            <ellipse
              cx={110}
              cy={62}
              rx="11"
              ry="22"
              stroke="currentColor"
              strokeWidth="0.7"
              fill="none"
            />
          </g>
        );
      })}
      <circle cx="110" cy="110" r="72" stroke="currentColor" strokeWidth="0.45" />
      <circle cx="110" cy="110" r="92" stroke="currentColor" strokeWidth="0.35" />
    </svg>
  );
}

export function LotusOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M24 26C24 26 12 18 12 10C12 6.5 15 4 18.5 4C21 4 22.8 5.4 24 7.2C25.2 5.4 27 4 29.5 4C33 4 36 6.5 36 10C36 18 24 26 24 26Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M24 24C24 24 17 18.5 17 12.5C17 10.2 18.8 8.5 21 8.5C22.4 8.5 23.4 9.3 24 10.4C24.6 9.3 25.6 8.5 27 8.5C29.2 8.5 31 10.2 31 12.5C31 18.5 24 24 24 24Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="24" cy="13" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function HeroDecorations() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yTop = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -14]);
  const yBottom = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 18]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(244,215,120,0.14),_transparent_46%),radial-gradient(ellipse_at_bottom_right,_rgba(11,81,59,0.04),_transparent_48%)]" />

      {/* Primary mandala behind hero copy — matches reference */}
      <motion.div
        style={{ y: yTop }}
        className="absolute left-[-4%] top-[8%] text-[#D4AF37]/[0.14] sm:left-[2%] sm:top-[6%] lg:left-[4%] lg:top-[4%]"
      >
        <FloralMotif className="h-[280px] w-[280px] sm:h-[340px] sm:w-[340px] lg:h-[420px] lg:w-[420px]" />
      </motion.div>

      <motion.div
        style={{ y: yBottom }}
        className="absolute -bottom-16 -right-12 hidden text-[#D4AF37]/10 sm:block md:right-0"
      >
        <FloralMotif className="h-52 w-52 md:h-64 md:w-64" />
      </motion.div>
    </div>
  );
}
