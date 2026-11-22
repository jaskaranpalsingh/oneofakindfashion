"use client";

import type { ProductSummary } from "@ookf/shared";
import { motion, useReducedMotion } from "framer-motion";
import { ProductCard } from "@/components/commerce/product-card";
import { NewArrivalsHeading } from "@/components/home/new-arrivals-heading";
import {
  cardVariants,
  sectionViewport,
} from "@/components/home/new-arrivals-motion";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type NewArrivalsSectionProps = {
  products: ProductSummary[];
  error?: boolean;
};

export function NewArrivalsSection({
  products,
  error = false,
}: NewArrivalsSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="new-arrivals-heading"
      className="border-y border-[#D4AF37]/20 bg-[#FFF9F0] py-14 sm:py-16 lg:py-20"
    >
      <Container className="max-w-[1440px]">
        <NewArrivalsHeading />

        {error ? (
          <div className="mt-10 rounded-[14px] border border-[#003F2D]/15 bg-white px-5 py-8 text-center">
            <p className="font-serif text-2xl text-[#003F2D]">
              We couldn&apos;t load new arrivals
            </p>
            <p className="mt-2 text-sm text-[#6F746E]">
              Please try again in a moment.
            </p>
            <Button
              type="button"
              className="mt-5"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : null}

        {!error && products.length === 0 ? (
          <p className="mt-10 text-center font-serif text-2xl text-[#003F2D] sm:text-3xl">
            New pieces are coming soon.
          </p>
        ) : null}

        {!error && products.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                custom={index}
                variants={cardVariants}
                initial={reduceMotion ? false : "hidden"}
                whileInView="visible"
                viewport={sectionViewport}
                className="h-full min-w-0"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
