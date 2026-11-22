"use client";

import { CollectionCard, type CollectionCardData } from "@/components/home/collection-card";
import { CollectionDecorations } from "@/components/home/collection-decorations";
import { CollectionHeading } from "@/components/home/collection-heading";
import { Container } from "@/components/ui/container";

export function CollectionsSection({
  collections,
}: {
  collections: CollectionCardData[];
}) {
  return (
    <section
      aria-labelledby="collections-heading"
      className="relative overflow-hidden border-b border-[#D4AF37]/20 bg-[#FFF9F0] py-16 sm:py-20"
    >
      <CollectionDecorations />
      <Container className="relative max-w-[1440px]">
        <CollectionHeading />

        {collections.length === 0 ? (
          <p className="mt-12 text-center text-sm text-[#73776F]">
            Collections will appear here once categories are published.
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-[1.4rem]">
            {collections.map((collection, index) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                index={index}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
