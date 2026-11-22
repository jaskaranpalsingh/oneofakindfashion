"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cardVariants, sectionViewport } from "@/components/home/collection-motion";
import { cn } from "@/lib/utils";

export type CollectionCardData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  href: string;
};

export function CollectionCard({
  collection,
  index,
}: {
  collection: CollectionCardData;
  index: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      custom={index}
      variants={cardVariants}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={sectionViewport}
      className="h-full"
    >
      <Link
        href={collection.href}
        aria-label={`Shop ${collection.name} — ${collection.description}`}
        className={cn(
          "group relative flex aspect-[3/4] h-full flex-col overflow-hidden rounded-[14px] border border-[#C6A24A]/85 bg-[#002D21] shadow-[0_10px_28px_rgba(0,45,33,0.12)] outline-none transition duration-500",
          "hover:-translate-y-[3px] hover:border-[#D4AF37] hover:shadow-[0_16px_34px_rgba(0,45,33,0.18)]",
          "focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF9F0]",
          "motion-reduce:transform-none motion-reduce:transition-none"
        )}
      >
        <div className="absolute inset-0 overflow-hidden">
          {collection.imageUrl ? (
            <Image
              src={collection.imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={cn(
                "object-cover object-center transition duration-[600ms] ease-out",
                "group-hover:scale-[1.045]",
                "motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#003F2D]/80 text-xs uppercase tracking-[0.2em] text-white/70">
              Image coming soon
            </div>
          )}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,45,33,0.96)_0%,rgba(0,45,33,0.78)_34%,rgba(0,45,33,0.28)_62%,rgba(0,45,33,0.12)_100%)] transition duration-500 group-hover:bg-[linear-gradient(to_top,rgba(0,45,33,0.98)_0%,rgba(0,45,33,0.84)_36%,rgba(0,45,33,0.34)_64%,rgba(0,45,33,0.16)_100%)]"
          />
        </div>

        <div className="relative mt-auto flex flex-col p-5 sm:p-6">
          <h3 className="font-serif text-[1.85rem] font-normal leading-tight text-[#FFF9F0] drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)] sm:text-[2rem]">
            {collection.name}
          </h3>
          <span className="mt-2.5 h-px w-10 bg-[#D4AF37]" aria-hidden />
          <p className="mt-2.5 text-sm leading-relaxed text-[#FFF9F0]/95">
            {collection.description}
          </p>
          <span
            className={cn(
              "mt-5 inline-flex h-10 w-fit items-center gap-2 border border-[#D4AF37] bg-[#003F2D]/55 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition duration-300",
              "group-hover:bg-[#0B513B]",
              "rounded-sm"
            )}
          >
            Shop Now
            <ArrowRight className="h-3.5 w-3.5 text-[#D4AF37] transition duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
